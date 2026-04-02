import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllLps } from '@/lib/data-access'

export async function GET() {
  try {
    await requireAdmin()
    const lps = await getAllLps()
    return NextResponse.json({ lps })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('Admin LPs route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
