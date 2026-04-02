'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '@/components/chat-message'
import { Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  citations?: Array<{
    index: number
    documentName: string
    pageNumber: number | null
    excerpt: string
  }>
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setInput('')
    setError(null)
    const userMessage: Message = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to get response')
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      // Add an empty assistant message to stream into
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        // Parse the AI SDK data stream format
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('0:')) {
            // Text delta
            try {
              const text = JSON.parse(line.slice(2))
              assistantContent += text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantContent,
                }
                return updated
              })
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      // Remove the empty assistant message on error
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1]?.role === 'assistant' && prev[prev.length - 1]?.content === '') {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col md:h-[calc(100vh-64px)]">
      <h1 className="flex-none text-[24px] font-semibold text-text-primary">Chat</h1>
      <p className="flex-none mt-1 text-[15px] text-text-secondary">
        Ask questions about your fund documents
      </p>

      {/* Messages */}
      <div ref={scrollRef} className="mt-4 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-chat space-y-4">
          {messages.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[15px] text-text-secondary">
                Ask a question about your quarterly reports, fund performance, or portfolio.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  'What is my current NAV?',
                  'Summarize the latest quarterly report',
                  'How has my IRR trended?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      inputRef.current?.focus()
                    }}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-text-secondary transition-colors duration-150 hover:bg-surface-raised"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              citations={msg.citations}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-auto mt-2 max-w-chat">
          <p className="text-[13px] text-negative">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="mx-auto mt-4 flex-none w-full max-w-chat">
        <div className="flex items-end gap-2 rounded-md border border-border bg-surface p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your fund documents..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] text-text-primary placeholder:text-text-muted outline-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white transition-colors duration-150 hover:opacity-90 disabled:opacity-30"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
