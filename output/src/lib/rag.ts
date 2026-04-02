import { openai } from '@ai-sdk/openai'
import { embed } from 'ai'
import { db } from '@/db'
import { chunks, documents } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

// ─── Embeddings ──────────────────────────────────────────

const EMBEDDING_MODEL = 'text-embedding-3-small'
const SIMILARITY_THRESHOLD = 0.7
const TOP_K = 5

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  })
  return embedding
}

export async function embedAndStoreChunks(
  documentId: string,
  textChunks: Array<{ content: string; pageNumber: number; chunkIndex: number }>
): Promise<number> {
  let stored = 0

  for (const chunk of textChunks) {
    const embedding = await embedText(chunk.content)

    await db.insert(chunks).values({
      document_id: documentId,
      content: chunk.content,
      page_number: chunk.pageNumber,
      chunk_index: chunk.chunkIndex,
      embedding,
    })
    stored++
  }

  return stored
}

// ─── Similarity Search ──────────────────────────────────

export interface SearchResult {
  content: string
  pageNumber: number | null
  documentName: string
  similarity: number
}

export async function similaritySearch(query: string): Promise<SearchResult[]> {
  const queryEmbedding = await embedText(query)
  const embeddingStr = `[${queryEmbedding.join(',')}]`

  // Raw SQL for pgvector cosine similarity
  const results = await db.execute(sql`
    SELECT
      c.content,
      c.page_number,
      d.filename as document_name,
      1 - (c.embedding <=> ${embeddingStr}::vector) as similarity
    FROM ${chunks} c
    JOIN ${documents} d ON c.document_id = d.id
    WHERE 1 - (c.embedding <=> ${embeddingStr}::vector) > ${SIMILARITY_THRESHOLD}
    ORDER BY c.embedding <=> ${embeddingStr}::vector
    LIMIT ${TOP_K}
  `)

  return (results.rows as Array<{
    content: string
    page_number: number | null
    document_name: string
    similarity: number
  }>).map((r) => ({
    content: r.content,
    pageNumber: r.page_number,
    documentName: r.document_name,
    similarity: Number(r.similarity),
  }))
}

// ─── Prompt Building ────────────────────────────────────

export function buildChatPrompt(
  question: string,
  searchResults: SearchResult[],
  lpName: string | null
): { systemPrompt: string; hasContext: boolean; avgConfidence: number } {
  if (searchResults.length === 0) {
    return {
      systemPrompt: buildNoContextPrompt(lpName),
      hasContext: false,
      avgConfidence: 0,
    }
  }

  const avgConfidence =
    searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length

  const contextBlocks = searchResults
    .map(
      (r, i) =>
        `[${i + 1}] Source: ${r.documentName}, p.${r.pageNumber ?? 'N/A'}\n${r.content}`
    )
    .join('\n\n---\n\n')

  const systemPrompt = `You are a financial reporting assistant for ${lpName ? `${lpName}'s` : 'an'} investor portal.
You answer questions using ONLY the provided document excerpts.

RULES:
1. Every claim must cite a source using the format [Source: DocumentName, p.N]
2. If the provided context does not contain enough information to answer, say "I don't have enough information to answer that based on the available documents."
3. Never make up or extrapolate data not present in the sources.
4. Use precise financial terminology.
5. Format currency values with appropriate precision.

CONTEXT:
${contextBlocks}`

  return { systemPrompt, hasContext: true, avgConfidence }
}

function buildNoContextPrompt(lpName: string | null): string {
  return `You are a financial reporting assistant for ${lpName ? `${lpName}'s` : 'an'} investor portal.
You have been asked a question but no relevant documents were found in the knowledge base.
Respond with: "I don't have enough information to answer that based on the available documents. Please ask your fund manager to upload relevant quarterly reports."
Do not attempt to answer the question from general knowledge.`
}

// ─── Citation Extraction ─────────────────────────────────

export interface Citation {
  index: number
  documentName: string
  pageNumber: number | null
  excerpt: string
}

export function extractCitations(
  responseText: string,
  searchResults: SearchResult[]
): Citation[] {
  const citations: Citation[] = []
  const pattern = /\[Source:\s*([^,]+),\s*p\.(\d+|N\/A)\]/g
  let match

  while ((match = pattern.exec(responseText)) !== null) {
    const docName = match[1]!.trim()
    const page = match[2] === 'N/A' ? null : parseInt(match[2]!, 10)

    const source = searchResults.find(
      (r) => r.documentName === docName && (r.pageNumber === page || page === null)
    )

    citations.push({
      index: citations.length + 1,
      documentName: docName,
      pageNumber: page,
      excerpt: source?.content.slice(0, 200) ?? '',
    })
  }

  return citations
}
