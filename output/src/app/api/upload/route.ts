import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { importCsvToDb, CsvParseError } from '@/lib/csv-parser'
import { extractTextFromPdf, chunkText, PdfProcessError } from '@/lib/pdf-processor'
import { embedAndStoreChunks } from '@/lib/rag'
import { db } from '@/db'
import { documents } from '@/db/schema'
import { put } from '@vercel/blob'

const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_CSV_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const fileType = detectFileType(file)
    if (!fileType) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only PDF and CSV files are accepted.' },
        { status: 400 }
      )
    }

    // Size limits
    if (fileType === 'pdf' && file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: `PDF files must be under ${MAX_PDF_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }
    if (fileType === 'csv' && file.size > MAX_CSV_SIZE) {
      return NextResponse.json(
        { error: `CSV files must be under ${MAX_CSV_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    if (fileType === 'csv') {
      return handleCsvUpload(file)
    } else {
      return handlePdfUpload(file)
    }
  } catch (error) {
    if (error instanceof CsvParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof PdfProcessError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    // Auth errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCsvUpload(file: File): Promise<NextResponse> {
  const text = await file.text()
  const result = await importCsvToDb(text)

  // Store the CSV in blob for record-keeping
  const blob = await put(`uploads/${file.name}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  await db.insert(documents).values({
    filename: file.name,
    file_type: 'csv',
    blob_url: blob.url,
    size_bytes: file.size,
    chunk_count: 0,
  })

  return NextResponse.json({
    type: 'csv',
    filename: file.name,
    ...result,
  })
}

async function handlePdfUpload(file: File): Promise<NextResponse> {
  const buffer = Buffer.from(await file.arrayBuffer())

  // Extract text
  const text = await extractTextFromPdf(buffer)

  // Chunk
  const textChunks = chunkText(text)

  // Store file in blob
  const blob = await put(`uploads/${file.name}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  // Create document record
  const [doc] = await db
    .insert(documents)
    .values({
      filename: file.name,
      file_type: 'pdf',
      blob_url: blob.url,
      size_bytes: file.size,
      chunk_count: textChunks.length,
    })
    .returning()

  // Embed and store chunks
  const storedCount = await embedAndStoreChunks(doc!.id, textChunks)

  return NextResponse.json({
    type: 'pdf',
    filename: file.name,
    chunks: storedCount,
    pages_estimated: textChunks[textChunks.length - 1]?.pageNumber ?? 0,
  })
}

function detectFileType(file: File): 'pdf' | 'csv' | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf'
  if (name.endsWith('.csv') || file.type === 'text/csv') return 'csv'
  return null
}
