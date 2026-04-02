import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { similaritySearch, buildChatPrompt, extractCitations } from '@/lib/rag'
import { db } from '@/db'
import { conversations, messages } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { z } from 'zod'

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(2000, 'Message too long (max 2000 characters)'),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userMessages = parsed.data.messages
    const latestMessage = userMessages[userMessages.length - 1]

    if (!latestMessage || latestMessage.role !== 'user') {
      return new Response(
        JSON.stringify({ error: 'Last message must be from user' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Similarity search for RAG context
    const searchResults = await similaritySearch(latestMessage.content)
    const { systemPrompt, hasContext, avgConfidence } = buildChatPrompt(
      latestMessage.content,
      searchResults,
      user.lp_name
    )

    // Get or create conversation
    let [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, user.id))
      .limit(1)

    if (!conversation) {
      const [newConv] = await db
        .insert(conversations)
        .values({ user_id: user.id })
        .returning()
      conversation = newConv!
    }

    // Save user message
    await db.insert(messages).values({
      conversation_id: conversation.id,
      role: 'user',
      content: latestMessage.content,
    })

    // Stream response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      onFinish: async ({ text }) => {
        // Save assistant message with citations
        const citations = extractCitations(text, searchResults)
        await db.insert(messages).values({
          conversation_id: conversation.id,
          role: 'assistant',
          content: text,
          citations: JSON.stringify(citations),
          confidence: avgConfidence.toFixed(3),
        })

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({ updated_at: new Date() })
          .where(eq(conversations.id, conversation.id))
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return new Response(
        JSON.stringify({ error: authErr.message }),
        { status: authErr.statusCode, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.error('Chat route error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
