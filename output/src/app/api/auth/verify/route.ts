import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink, createSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
    }

    const user = await verifyMagicLink(token)

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=expired', request.url))
    }

    const sessionToken = await createSession(user.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const response = NextResponse.redirect(new URL('/dashboard', appUrl))
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/login?error=server_error', request.url))
  }
}
