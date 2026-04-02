import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth'
import { Resend } from 'resend'
import { z } from 'zod'

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
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

    const result = await createMagicLink(parsed.data.email)

    // Always return success to prevent email enumeration
    if (!result) {
      return NextResponse.json({ message: 'If an account exists, a magic link has been sent.' })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const verifyUrl = `${appUrl}/auth/verify?token=${result.token}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fundName = process.env.FUND_NAME ?? 'Hudson Capital'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@usehudson.com',
      to: parsed.data.email,
      subject: `Sign in to ${fundName}`,
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #18181b; font-weight: 600; font-size: 20px; margin-bottom: 16px;">${fundName}</h2>
          <p style="color: #52525b; font-size: 15px; line-height: 1.5; margin-bottom: 24px;">
            Click the link below to sign in to your investor portal. This link expires in 15 minutes.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 500;">
            Sign in to portal
          </a>
          <p style="color: #a1a1aa; font-size: 13px; margin-top: 24px;">
            If you did not request this link, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'If an account exists, a magic link has been sent.' })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
