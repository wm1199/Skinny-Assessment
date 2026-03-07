import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateScores } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function POST(
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

    // Get assessment with all responses
    const assessment = await prisma.assessment.findUnique({
      where: { sessionCode },
      include: {
        responses: true,
      },
    })

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      )
    }

    if (!assessment?.operationType || !assessment?.revenueBand) {
      return NextResponse.json(
        { success: false, error: 'Profile information incomplete' },
        { status: 400 }
      )
    }

    // Calculate scores
    const scoringInput = {
      operationType: assessment?.operationType,
      revenueBand: assessment?.revenueBand,
      responses: assessment?.responses?.map(r => ({
        section: r?.section,
        questionKey: r?.questionKey,
        answerValue: r?.answerValue,
      })) ?? [],
    }

    const scoringResult = calculateScores(scoringInput)

    if (!scoringResult) {
      return NextResponse.json(
        { success: false, error: 'Failed to calculate scores' },
        { status: 500 }
      )
    }

    // Save results
    const result = await prisma.assessmentResult.upsert({
      where: { assessmentId: assessment?.id },
      create: {
        assessmentId: assessment?.id,
        productionWorkflowScore: scoringResult?.productionWorkflowScore,
        financialVisibilityScore: scoringResult?.financialVisibilityScore,
        technologyGapScore: scoringResult?.technologyGapScore,
        salesServicePeopleScore: scoringResult?.salesServicePeopleScore,
        overallScore: scoringResult?.overallScore,
        topInsights: JSON.stringify(scoringResult?.topInsights ?? []),
        costOpportunities: JSON.stringify(scoringResult?.costOpportunities ?? []),
        gapAnalysis: JSON.stringify(scoringResult?.gapAnalysis ?? []),
        consultingRoadmap: JSON.stringify([]),
      },
      update: {
        productionWorkflowScore: scoringResult?.productionWorkflowScore,
        financialVisibilityScore: scoringResult?.financialVisibilityScore,
        technologyGapScore: scoringResult?.technologyGapScore,
        salesServicePeopleScore: scoringResult?.salesServicePeopleScore,
        overallScore: scoringResult?.overallScore,
        topInsights: JSON.stringify(scoringResult?.topInsights ?? []),
        costOpportunities: JSON.stringify(scoringResult?.costOpportunities ?? []),
        gapAnalysis: JSON.stringify(scoringResult?.gapAnalysis ?? []),
      },
    })

    // Update assessment status
    await prisma.assessment.update({
      where: { id: assessment?.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        overallScore: scoringResult?.overallScore,
      },
    })

    return NextResponse.json({
      success: true,
      result: scoringResult,
    })
  } catch (error) {
    console.error('Error calculating scores:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate scores' },
      { status: 500 }
    )
  }
}
