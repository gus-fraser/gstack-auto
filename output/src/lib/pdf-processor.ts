// ─── PDF Text Extraction + Chunking ─────────────────────

export interface PdfChunk {
  content: string
  pageNumber: number
  chunkIndex: number
}

const TARGET_CHUNK_TOKENS = 500
const OVERLAP_TOKENS = 100
// Rough approximation: 1 token ~ 4 chars
const CHARS_PER_TOKEN = 4

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid bundling issues
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)

  if (!data.text || data.text.trim().length === 0) {
    throw new PdfProcessError('No extractable text found in PDF. Scanned PDFs are not supported.')
  }

  return data.text
}

export function chunkText(text: string, pageBreaks?: number[]): PdfChunk[] {
  const chunks: PdfChunk[] = []
  const targetChars = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN

  // Split into paragraphs first for natural boundaries
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0)

  let currentChunk = ''
  let currentPage = 1
  let chunkIndex = 0
  let charsSoFar = 0

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()

    // Track page numbers if page breaks are provided
    if (pageBreaks) {
      const newCharPos = charsSoFar + trimmed.length
      for (const breakPos of pageBreaks) {
        if (charsSoFar < breakPos && newCharPos >= breakPos) {
          currentPage++
        }
      }
    }

    if (currentChunk.length + trimmed.length > targetChars && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        pageNumber: currentPage,
        chunkIndex,
      })
      chunkIndex++

      // Overlap: keep the last portion of the current chunk
      if (currentChunk.length > overlapChars) {
        currentChunk = currentChunk.slice(-overlapChars) + '\n\n' + trimmed
      } else {
        currentChunk = trimmed
      }
    } else {
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed
    }

    charsSoFar += trimmed.length
  }

  // Final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      pageNumber: currentPage,
      chunkIndex,
    })
  }

  return chunks
}

export class PdfProcessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PdfProcessError'
  }
}
