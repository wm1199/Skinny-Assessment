import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { mode } = await request.json()

    if (!mode || !['chat', 'form'].includes(mode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mode' },
        { status: 400 }
      )
    }

    const assessment = await prisma.assessment.create({
      data: {
        mode,
        status: 'in_progress',
      },
    })

    return NextResponse.json({
      success: true,
      sessionCode: assessment?.sessionCode,
      assessmentId: assessment?.id,
    })
  } catch (error) {
    console.error('Error creating assessment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create assessment' },
      { status: 500 }
    )
  }
}
