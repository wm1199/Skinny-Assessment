import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { sessionCode: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionCode = params?.sessionCode
    if (!sessionCode) {
      return NextResponse.json({ error: 'Session code required' }, { status: 400 })
    }

    const assessment = await prisma.assessment.findUnique({
      where: { sessionCode },
      include: {
        result: true,
        respondents: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        responses: {
          select: {
            questionKey: true,
            questionText: true,
            section: true,
            answerValue: true,
          },
        },
      },
    })

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: assessment.id,
      sessionCode: assessment.sessionCode,
      mode: assessment.mode,
      status: assessment.status,
      operationType: assessment.operationType,
      revenueBand: assessment.revenueBand,
      numEmployees: assessment.numEmployees,
      primaryMarkets: assessment.primaryMarkets,
      createdAt: assessment.createdAt.toISOString(),
      respondents: assessment.respondents,
      responses: assessment.responses,
      result: assessment.result
        ? {
            overallScore: assessment.result.overallScore,
            productionWorkflowScore: assessment.result.productionWorkflowScore,
            financialVisibilityScore: assessment.result.financialVisibilityScore,
            technologyGapScore: assessment.result.technologyGapScore,
            salesServicePeopleScore: assessment.result.salesServicePeopleScore,
            topInsights: assessment.result.topInsights,
            costOpportunities: assessment.result.costOpportunities,
            gapAnalysis: assessment.result.gapAnalysis,
          }
        : null,
    })
  } catch (error) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 })
  }
}
