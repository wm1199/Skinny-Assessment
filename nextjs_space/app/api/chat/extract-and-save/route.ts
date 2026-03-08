import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateScores } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

interface ExtractedData {
  profile: {
    operationType?: string
    revenueBand?: string
    numEmployees?: number
    primaryMarkets?: string
  }
  production: {
    laborCostPercent?: number
    materialWastePercent?: number
    onTimeDeliveryPercent?: number
  }
  financial: {
    grossMarginPercent?: number
    jobProfitabilityTracking?: string
    financialReportingFrequency?: string
  }
  technology: {
    misErpSystem?: string
    misAdoptionScore?: number
    automationLevel?: number
    digitalWorkflowIntegration?: string
  }
  sales: {
    customerRetentionPercent?: number
    employeeTurnoverPercent?: number
    salesGrowthPercent?: number
  }
}

export async function POST(request: Request) {
  try {
    const { sessionCode, messages } = await request.json()

    if (!sessionCode || !messages) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the assessment
    const assessment = await prisma.assessment.findUnique({
      where: { sessionCode },
    })

    if (!assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Use LLM to extract structured data from the conversation
    const extractionPrompt = `You are a data extraction assistant. Analyze the following conversation between a consultant and a print shop representative. Extract all assessment data mentioned and return it as valid JSON.

IMPORTANT: Only extract data that was explicitly mentioned in the conversation. Use null for any fields not discussed.

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{
  "profile": {
    "operationType": "Digital Print" | "Offset Print" | "Wide Format" | "Hybrid" | null,
    "revenueBand": "$1M-$5M" | "$5M-$10M" | "$10M-$25M" | "$25M+" | null,
    "numEmployees": <number or null>,
    "primaryMarkets": "<string description or null>"
  },
  "production": {
    "laborCostPercent": <number 0-100 or null>,
    "materialWastePercent": <number 0-100 or null>,
    "onTimeDeliveryPercent": <number 0-100 or null>
  },
  "financial": {
    "grossMarginPercent": <number 0-100 or null>,
    "jobProfitabilityTracking": "Automated per-job" | "Manual tracking" | "None" | null,
    "financialReportingFrequency": "Daily" | "Weekly" | "Monthly" | "Quarterly" | null
  },
  "technology": {
    "misErpSystem": "Fully integrated MIS" | "Basic MIS" | "Spreadsheets only" | "None" | null,
    "misAdoptionScore": <number 1-10 or null>,
    "automationLevel": <number 1-10 or null>,
    "digitalWorkflowIntegration": "End-to-end" | "Partial" | "Minimal" | "None" | null
  },
  "sales": {
    "customerRetentionPercent": <number 0-100 or null>,
    "employeeTurnoverPercent": <number 0-100 or null>,
    "salesGrowthPercent": <number -100 to 100 or null>
  }
}

Conversation to analyze:
${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}`

    const extractResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          { role: 'user', content: extractionPrompt },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    })

    if (!extractResponse.ok) {
      throw new Error('Failed to extract data from conversation')
    }

    const extractResult = await extractResponse.json()
    const extractedText = extractResult?.choices?.[0]?.message?.content || '{}'
    
    // Parse the JSON - handle potential markdown code blocks
    let cleanJson = extractedText.trim()
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```json?\n?/g, '').replace(/```/g, '')
    }
    
    let extractedData: ExtractedData
    try {
      extractedData = JSON.parse(cleanJson)
    } catch (e) {
      console.error('Failed to parse extracted data:', cleanJson)
      extractedData = {
        profile: {},
        production: {},
        financial: {},
        technology: {},
        sales: {},
      }
    }

    // Create or get respondent
    let respondent = await prisma.respondent.findFirst({
      where: { assessmentId: assessment.id },
    })

    if (!respondent) {
      respondent = await prisma.respondent.create({
        data: {
          assessmentId: assessment.id,
          name: 'Chat Respondent',
          email: 'chat@assessment.local',
          role: 'Primary Contact',
        },
      })
    }

    // Update assessment profile data
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        operationType: extractedData.profile?.operationType || assessment.operationType,
        revenueBand: extractedData.profile?.revenueBand || assessment.revenueBand,
        numEmployees: extractedData.profile?.numEmployees || assessment.numEmployees,
        primaryMarkets: extractedData.profile?.primaryMarkets || assessment.primaryMarkets,
      },
    })

    // Delete existing responses for this assessment (to avoid duplicates)
    await prisma.response.deleteMany({
      where: { assessmentId: assessment.id },
    })

    // Save all extracted responses
    const responsesToCreate: {
      assessmentId: string
      respondentId: string
      section: string
      questionKey: string
      questionText: string
      answerValue: string
      answerType: string
    }[] = []

    // Profile responses
    if (extractedData.profile?.operationType) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'profile',
        questionKey: 'operationType',
        questionText: 'Operation Type',
        answerValue: extractedData.profile.operationType,
        answerType: 'select',
      })
    }
    if (extractedData.profile?.revenueBand) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'profile',
        questionKey: 'revenueBand',
        questionText: 'Revenue Band',
        answerValue: extractedData.profile.revenueBand,
        answerType: 'select',
      })
    }
    if (extractedData.profile?.numEmployees != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'profile',
        questionKey: 'numEmployees',
        questionText: 'Number of Employees',
        answerValue: String(extractedData.profile.numEmployees),
        answerType: 'number',
      })
    }
    if (extractedData.profile?.primaryMarkets) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'profile',
        questionKey: 'primaryMarkets',
        questionText: 'Primary Markets',
        answerValue: extractedData.profile.primaryMarkets,
        answerType: 'text',
      })
    }

    // Production responses
    if (extractedData.production?.laborCostPercent != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'production',
        questionKey: 'laborCostPercent',
        questionText: 'Labor Cost as % of Revenue',
        answerValue: String(extractedData.production.laborCostPercent),
        answerType: 'number',
      })
    }
    if (extractedData.production?.materialWastePercent != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'production',
        questionKey: 'materialWastePercent',
        questionText: 'Material Waste %',
        answerValue: String(extractedData.production.materialWastePercent),
        answerType: 'number',
      })
    }
    if (extractedData.production?.onTimeDeliveryPercent != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'production',
        questionKey: 'onTimeDeliveryPercent',
        questionText: 'On-Time Delivery %',
        answerValue: String(extractedData.production.onTimeDeliveryPercent),
        answerType: 'number',
      })
    }

    // Financial responses
    if (extractedData.financial?.grossMarginPercent != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'financial',
        questionKey: 'grossMarginPercent',
        questionText: 'Gross Margin %',
        answerValue: String(extractedData.financial.grossMarginPercent),
        answerType: 'number',
      })
    }
    if (extractedData.financial?.jobProfitabilityTracking) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'financial',
        questionKey: 'jobProfitabilityTracking',
        questionText: 'Job Profitability Tracking',
        answerValue: extractedData.financial.jobProfitabilityTracking,
        answerType: 'select',
      })
    }
    if (extractedData.financial?.financialReportingFrequency) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'financial',
        questionKey: 'financialReportingFrequency',
        questionText: 'Financial Reporting Frequency',
        answerValue: extractedData.financial.financialReportingFrequency,
        answerType: 'select',
      })
    }

    // Technology responses
    if (extractedData.technology?.misErpSystem) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'technology',
        questionKey: 'misErpSystem',
        questionText: 'MIS/ERP System',
        answerValue: extractedData.technology.misErpSystem,
        answerType: 'select',
      })
    }
    if (extractedData.technology?.automationLevel != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'technology',
        questionKey: 'automationLevel',
        questionText: 'Automation Level (1-10)',
        answerValue: String(extractedData.technology.automationLevel),
        answerType: 'number',
      })
    }
    if (extractedData.technology?.digitalWorkflowIntegration) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'technology',
        questionKey: 'digitalWorkflowIntegration',
        questionText: 'Digital Workflow Integration',
        answerValue: extractedData.technology.digitalWorkflowIntegration,
        answerType: 'select',
      })
    }

    // Sales responses
    if (extractedData.sales?.customerRetentionPercent != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'sales',
        questionKey: 'customerRetentionPercent',
        questionText: 'Customer Retention %',
        answerValue: String(extractedData.sales.customerRetentionPercent),
        answerType: 'number',
      })
    }
    if (extractedData.sales?.employeeTurnoverPercent != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'sales',
        questionKey: 'employeeTurnoverPercent',
        questionText: 'Employee Turnover %',
        answerValue: String(extractedData.sales.employeeTurnoverPercent),
        answerType: 'number',
      })
    }
    if (extractedData.sales?.salesGrowthPercent != null) {
      responsesToCreate.push({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: 'sales',
        questionKey: 'salesGrowthPercent',
        questionText: 'Sales Growth %',
        answerValue: String(extractedData.sales.salesGrowthPercent),
        answerType: 'number',
      })
    }

    // Create all responses
    if (responsesToCreate.length > 0) {
      await prisma.response.createMany({
        data: responsesToCreate,
      })
    }

    // Delete existing section progress
    await prisma.sectionProgress.deleteMany({
      where: { assessmentId: assessment.id },
    })

    // Mark sections as completed based on what data we have
    const sections = ['profile', 'production', 'financial', 'technology', 'sales']
    for (const section of sections) {
      const hasData = responsesToCreate.some(r => r.section === section)
      await prisma.sectionProgress.create({
        data: {
          assessmentId: assessment.id,
          section,
          isCompleted: hasData,
          completedById: hasData ? respondent.id : null,
          completedAt: hasData ? new Date() : null,
        },
      })
    }

    // Get updated assessment with responses
    const updatedAssessment = await prisma.assessment.findUnique({
      where: { id: assessment.id },
      include: { responses: true },
    })

    // Calculate scores
    const scoringInput = {
      operationType: updatedAssessment?.operationType || 'Digital Print',
      revenueBand: updatedAssessment?.revenueBand || '$5M-$10M',
      responses: updatedAssessment?.responses || [],
    }

    const scores = await calculateScores(scoringInput)

    if (!scores) {
      return NextResponse.json(
        { success: false, error: 'Failed to calculate scores' },
        { status: 500 }
      )
    }

    // Delete existing result
    await prisma.assessmentResult.deleteMany({
      where: { assessmentId: assessment.id },
    })

    // Save scores
    await prisma.assessmentResult.create({
      data: {
        assessmentId: assessment.id,
        productionWorkflowScore: scores.productionWorkflowScore,
        financialVisibilityScore: scores.financialVisibilityScore,
        technologyGapScore: scores.technologyGapScore,
        salesServicePeopleScore: scores.salesServicePeopleScore,
        overallScore: scores.overallScore,
        topInsights: JSON.stringify(scores.topInsights),
        costOpportunities: JSON.stringify(scores.costOpportunities),
        gapAnalysis: JSON.stringify(scores.gapAnalysis),
        consultingRoadmap: JSON.stringify([
          { phase: 1, title: 'Quick Wins', description: 'Address immediate inefficiencies', timeline: '30-60 days' },
          { phase: 2, title: 'Strategic Investments', description: 'Technology and process upgrades', timeline: '60-120 days' },
          { phase: 3, title: 'Long-term Excellence', description: 'Continuous improvement', timeline: '120+ days' },
        ]),
      },
    })

    // Update assessment status
    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: 'completed' },
    })

    return NextResponse.json({
      success: true,
      extractedData,
      responsesCreated: responsesToCreate.length,
      scores: {
        overall: scores.overallScore,
        production: scores.productionWorkflowScore,
        financial: scores.financialVisibilityScore,
        technology: scores.technologyGapScore,
        sales: scores.salesServicePeopleScore,
      },
    })
  } catch (error) {
    console.error('Error extracting and saving chat data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract and save data' },
      { status: 500 }
    )
  }
}
