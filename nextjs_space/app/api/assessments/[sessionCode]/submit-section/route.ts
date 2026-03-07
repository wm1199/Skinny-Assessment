import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { sessionCode: string } }
) {
  try {
    const sessionCode = params?.sessionCode
    const { section, responses, respondent } = await request.json()

    if (!sessionCode || !section || !responses) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find assessment
    const assessment = await prisma.assessment.findUnique({
      where: { sessionCode },
    })

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Create or find respondent
    let respondentRecord = null
    if (respondent?.name && respondent?.email) {
      respondentRecord = await prisma.respondent.upsert({
        where: {
          id: respondent?.id || 'new',
        },
        update: {},
        create: {
          assessmentId: assessment?.id,
          name: respondent?.name,
          email: respondent?.email,
          role: respondent?.role || 'Respondent',
        },
      })
    }

    // Save responses
    for (const response of responses) {
      await prisma.response.create({
        data: {
          assessmentId: assessment?.id,
          respondentId: respondentRecord?.id || assessment?.id,
          section,
          questionKey: response?.key || '',
          questionText: response?.text || '',
          answerValue: String(response?.value || ''),
          answerType: response?.type || 'text',
        },
      })
    }

    // Update section progress
    await prisma.sectionProgress.upsert({
      where: {
        assessmentId_section: {
          assessmentId: assessment?.id,
          section,
        },
      },
      update: {
        isCompleted: true,
        completedById: respondentRecord?.id,
        completedAt: new Date(),
      },
      create: {
        assessmentId: assessment?.id,
        section,
        isCompleted: true,
        completedById: respondentRecord?.id,
        completedAt: new Date(),
      },
    })

    // Update profile data if this is the profile section
    if (section === 'profile') {
      const profileData: any = {}
      for (const response of responses) {
        if (response?.key === 'operationType') profileData.operationType = response?.value
        if (response?.key === 'revenueBand') profileData.revenueBand = response?.value
        if (response?.key === 'numEmployees') profileData.numEmployees = parseInt(response?.value || '0')
        if (response?.key === 'primaryMarkets') profileData.primaryMarkets = Array.isArray(response?.value) ? response?.value?.join(', ') : response?.value
      }
      
      if (Object.keys(profileData || {})?.length > 0) {
        await prisma.assessment.update({
          where: { id: assessment?.id },
          data: profileData,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting section:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit section' },
      { status: 500 }
    )
  }
}
