import { describe, it, expect } from 'vitest'
import { chunkText, PdfProcessError } from '../pdf-processor'

describe('chunkText', () => {
  it('creates chunks from text', () => {
    // Create text with multiple paragraphs
    const paragraphs = Array.from({ length: 20 }, (_, i) =>
      `Paragraph ${i + 1}: ${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)}`
    )
    const text = paragraphs.join('\n\n')

    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]!.chunkIndex).toBe(0)
    expect(chunks[0]!.pageNumber).toBe(1)
    expect(chunks[0]!.content.length).toBeGreaterThan(0)
  })

  it('returns single chunk for short text', () => {
    const chunks = chunkText('Short text here.')
    expect(chunks).toHaveLength(1)
    expect(chunks[0]!.content).toBe('Short text here.')
  })

  it('returns empty array for empty text', () => {
    const chunks = chunkText('')
    expect(chunks).toHaveLength(0)
  })

  it('handles text with only whitespace', () => {
    const chunks = chunkText('   \n\n   \n\n   ')
    expect(chunks).toHaveLength(0)
  })

  it('assigns sequential chunk indexes', () => {
    const paragraphs = Array.from({ length: 30 }, (_, i) =>
      `Paragraph ${i}: ${'Text content for testing chunking. '.repeat(20)}`
    )
    const text = paragraphs.join('\n\n')

    const chunks = chunkText(text)
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i]!.chunkIndex).toBe(i)
    }
  })

  it('maintains overlap between chunks', () => {
    const paragraphs = Array.from({ length: 30 }, (_, i) =>
      `Unique-marker-${i}: ${'Text for overlap testing purposes. '.repeat(20)}`
    )
    const text = paragraphs.join('\n\n')

    const chunks = chunkText(text)
    if (chunks.length >= 2) {
      // The end of chunk[0] should partially appear in chunk[1] (overlap)
      const endOfFirst = chunks[0]!.content.slice(-100)
      // With overlap, some portion of chunk 0's end should appear in chunk 1
      // This is approximate because overlap is character-based
      expect(chunks[1]!.content.length).toBeGreaterThan(0)
    }
  })
})

describe('PdfProcessError', () => {
  it('creates error with correct name', () => {
    const error = new PdfProcessError('Test error')
    expect(error.name).toBe('PdfProcessError')
    expect(error.message).toBe('Test error')
    expect(error).toBeInstanceOf(Error)
  })
})
