import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/db'
import { documents } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()

    const { id } = await params

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1)

    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Redirect to blob URL for download
    return NextResponse.redirect(doc.blob_url)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('Document download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
