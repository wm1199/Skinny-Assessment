import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all assessments with their results and respondents
    const assessments = await prisma.assessment.findMany({
      include: {
        result: true,
        respondents: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate statistics
    const totalAssessments = assessments.length
    const completedAssessments = assessments.filter((a) => a.status === 'completed').length
    
    // Calculate average score from completed assessments
    const completedWithScores = assessments.filter((a) => a.result?.overallScore != null)
    const avgOverallScore =
      completedWithScores.length > 0
        ? completedWithScores.reduce((sum, a) => sum + (a.result?.overallScore || 0), 0) /
          completedWithScores.length
        : 0

    // Total employees assessed
    const totalEmployeesAssessed = assessments.reduce((sum, a) => sum + (a.numEmployees || 0), 0)

    // Score distribution
    const scoreRanges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ]
    completedWithScores.forEach((a) => {
      const score = a.result?.overallScore || 0
      const range = scoreRanges.find((r) => score >= r.min && score <= r.max)
      if (range) range.count++
    })
    const scoreDistribution = scoreRanges.map((r) => ({ range: r.range, count: r.count }))

    // Operation type breakdown
    const operationTypeCounts: Record<string, number> = {}
    assessments.forEach((a) => {
      const type = a.operationType || 'Unknown'
      operationTypeCounts[type] = (operationTypeCounts[type] || 0) + 1
    })
    const operationTypeBreakdown = Object.entries(operationTypeCounts).map(([type, count]) => ({
      type,
      count,
    }))

    // Revenue band breakdown
    const revenueBandOrder = ['$1M-$5M', '$5M-$10M', '$10M-$25M', '$25M+']
    const revenueBandCounts: Record<string, number> = {}
    assessments.forEach((a) => {
      const band = a.revenueBand || 'Unknown'
      revenueBandCounts[band] = (revenueBandCounts[band] || 0) + 1
    })
    const revenueBreakdown = revenueBandOrder
      .filter((band) => revenueBandCounts[band])
      .map((band) => ({
        band,
        count: revenueBandCounts[band] || 0,
      }))

    // Recent trend (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })
    const trendCounts: Record<string, number> = {}
    assessments.forEach((a) => {
      const dateStr = new Date(a.createdAt).toISOString().split('T')[0]
      if (last7Days.includes(dateStr)) {
        trendCounts[dateStr] = (trendCounts[dateStr] || 0) + 1
      }
    })
    const recentTrend = last7Days.map((date) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: trendCounts[date] || 0,
    }))

    return NextResponse.json({
      totalAssessments,
      completedAssessments,
      avgOverallScore,
      totalEmployeesAssessed,
      scoreDistribution,
      operationTypeBreakdown,
      revenueBreakdown,
      recentTrend,
      assessments: assessments.map((a) => ({
        id: a.id,
        sessionCode: a.sessionCode,
        mode: a.mode,
        status: a.status,
        operationType: a.operationType,
        revenueBand: a.revenueBand,
        numEmployees: a.numEmployees,
        primaryMarkets: a.primaryMarkets,
        createdAt: a.createdAt.toISOString(),
        respondents: a.respondents,
        result: a.result
          ? {
              overallScore: a.result.overallScore,
              productionWorkflowScore: a.result.productionWorkflowScore,
              financialVisibilityScore: a.result.financialVisibilityScore,
              technologyGapScore: a.result.technologyGapScore,
              salesServicePeopleScore: a.result.salesServicePeopleScore,
            }
          : null,
      })),
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
