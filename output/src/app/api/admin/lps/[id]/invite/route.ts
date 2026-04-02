import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getLpById } from '@/lib/data-access'
import { sendInviteEmail } from '@/lib/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const lp = await getLpById(id)
    if (!lp) {
      return NextResponse.json(
        { error: 'LP not found' },
        { status: 404 }
      )
    }

    if (!lp.email) {
      return NextResponse.json(
        { error: 'LP does not have an email address. Assign one first.' },
        { status: 400 }
      )
    }

    const fundName = process.env.FUND_NAME ?? 'Hudson Capital'
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@usehudson.com'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    await sendInviteEmail({
      to: lp.email,
      lpName: lp.lp_name ?? 'Investor',
      fundName,
      fromEmail,
      appUrl,
    })

    return NextResponse.json({ message: 'Invite sent', to: lp.email })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('Admin invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
