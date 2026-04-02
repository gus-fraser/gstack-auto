import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { documents } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET() {
  try {
    await requireAuth()

    const docs = await db
      .select({
        id: documents.id,
        filename: documents.filename,
        file_type: documents.file_type,
        size_bytes: documents.size_bytes,
        uploaded_at: documents.uploaded_at,
      })
      .from(documents)
      .where(eq(documents.file_type, 'pdf')) // Only show PDFs to LPs (CSVs are admin data)
      .orderBy(desc(documents.uploaded_at))

    return NextResponse.json({ documents: docs })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('Documents route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
