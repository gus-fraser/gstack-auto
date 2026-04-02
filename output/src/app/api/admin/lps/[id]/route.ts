import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getLpById, updateLpEmail } from '@/lib/data-access'
import { z } from 'zod'

const updateSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function GET(
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

    return NextResponse.json({ lp })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('Admin LP detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const updated = await updateLpEmail(id, parsed.data.email)
    if (!updated) {
      return NextResponse.json(
        { error: 'LP not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      lp: {
        id: updated.id,
        lp_id: updated.lp_id,
        lp_name: updated.lp_name,
        email: updated.email,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const authErr = error as { message: string; statusCode: number }
      return NextResponse.json(
        { error: authErr.message },
        { status: authErr.statusCode }
      )
    }
    console.error('Admin LP update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
