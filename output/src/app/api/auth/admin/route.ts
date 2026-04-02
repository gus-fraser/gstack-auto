import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSecret, getOrCreateAdmin, createSession } from '@/lib/auth'
import { z } from 'zod'

const requestSchema = z.object({
  secret: z.string().min(1, 'Admin code is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    if (!verifyAdminSecret(parsed.data.secret)) {
      return NextResponse.json(
        { error: 'Invalid admin code' },
        { status: 401 }
      )
    }

    const admin = await getOrCreateAdmin()
    const sessionToken = await createSession(admin.id)

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    // Also set the regular session for API routes that check it
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
