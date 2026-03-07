import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { sessionCode: string } }
) {
  try {
    const sessionCode = params?.sessionCode

    if (!sessionCode) {
      return NextResponse.json(
        { success: false, error: 'Session code required' },
        { status: 400 }
      )
    }

    const assessment = await prisma.assessment.findUnique({
      where: { sessionCode },
      include: {
        respondents: true,
        sectionProgress: true,
        result: true,
      },
    })

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, assessment })
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assessment' },
      { status: 500 }
    )
  }
}
