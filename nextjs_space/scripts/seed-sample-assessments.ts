import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Sample company data - 10 realistic print companies
const sampleCompanies = [
  // Chat mode assessments (5)
  {
    mode: 'chat',
    sessionCode: 'CHAT-ABC123',
    operationType: 'Digital Print',
    revenueBand: '$5M-$10M',
    numEmployees: 35,
    primaryMarkets: 'Commercial Printing,Marketing Collateral,Direct Mail',
    companyName: 'Precision Digital Solutions',
    completedAt: new Date('2026-02-15'),
  },
  {
    mode: 'chat',
    sessionCode: 'CHAT-DEF456',
    operationType: 'Hybrid',
    revenueBand: '$10M-$25M',
    numEmployees: 75,
    primaryMarkets: 'Packaging,Labels,Commercial Printing',
    companyName: 'Metro Print & Packaging',
    completedAt: new Date('2026-02-20'),
  },
  {
    mode: 'chat',
    sessionCode: 'CHAT-GHI789',
    operationType: 'Wide Format',
    revenueBand: '$1M-$5M',
    numEmployees: 15,
    primaryMarkets: 'Signage,Marketing Collateral',
    companyName: 'BigCanvas Graphics',
    completedAt: new Date('2026-02-25'),
  },
  {
    mode: 'chat',
    sessionCode: 'CHAT-JKL012',
    operationType: 'Offset Print',
    revenueBand: '$25M+',
    numEmployees: 120,
    primaryMarkets: 'Publishing,Commercial Printing,Direct Mail',
    companyName: 'Heritage Publishing Group',
    completedAt: new Date('2026-03-01'),
  },
  {
    mode: 'chat',
    sessionCode: 'CHAT-MNO345',
    operationType: 'Digital Print',
    revenueBand: '$5M-$10M',
    numEmployees: 42,
    primaryMarkets: 'Marketing Collateral,Packaging,Labels',
    companyName: 'FastTrack Print Co',
    completedAt: new Date('2026-03-03'),
  },
  // Form mode assessments (5)
  {
    mode: 'form',
    sessionCode: 'FORM-PQR678',
    operationType: 'Hybrid',
    revenueBand: '$10M-$25M',
    numEmployees: 85,
    primaryMarkets: 'Commercial Printing,Packaging,Direct Mail,Marketing Collateral',
    companyName: 'Midwest Print Partners',
    completedAt: new Date('2026-02-18'),
  },
  {
    mode: 'form',
    sessionCode: 'FORM-STU901',
    operationType: 'Digital Print',
    revenueBand: '$1M-$5M',
    numEmployees: 18,
    primaryMarkets: 'Commercial Printing,Marketing Collateral',
    companyName: 'QuickPrint Express',
    completedAt: new Date('2026-02-22'),
  },
  {
    mode: 'form',
    sessionCode: 'FORM-VWX234',
    operationType: 'Wide Format',
    revenueBand: '$5M-$10M',
    numEmployees: 28,
    primaryMarkets: 'Signage,Marketing Collateral,Other',
    companyName: 'LargeFormat Pros',
    completedAt: new Date('2026-02-28'),
  },
  {
    mode: 'form',
    sessionCode: 'FORM-YZA567',
    operationType: 'Offset Print',
    revenueBand: '$25M+',
    numEmployees: 150,
    primaryMarkets: 'Publishing,Commercial Printing,Packaging',
    companyName: 'Atlantic Press Industries',
    completedAt: new Date('2026-03-02'),
  },
  {
    mode: 'form',
    sessionCode: 'FORM-BCD890',
    operationType: 'Hybrid',
    revenueBand: '$10M-$25M',
    numEmployees: 65,
    primaryMarkets: 'Labels,Packaging,Direct Mail',
    companyName: 'PrimePack Solutions',
    completedAt: new Date('2026-03-05'),
  },
]

// Generate realistic responses for each section
function generateResponses(company: typeof sampleCompanies[0]) {
  const baseScores = {
    'Digital Print': { production: 75, financial: 70, technology: 80, sales: 72 },
    'Offset Print': { production: 78, financial: 75, technology: 65, sales: 70 },
    'Wide Format': { production: 72, financial: 68, technology: 70, sales: 75 },
    'Hybrid': { production: 80, financial: 78, technology: 75, sales: 76 },
  }
  
  const base = baseScores[company.operationType as keyof typeof baseScores] || baseScores['Hybrid']
  
  // Add some variance based on revenue band
  const revenueMultiplier = {
    '$1M-$5M': 0.9,
    '$5M-$10M': 1.0,
    '$10M-$25M': 1.05,
    '$25M+': 1.1,
  }
  const multiplier = revenueMultiplier[company.revenueBand as keyof typeof revenueMultiplier] || 1.0
  
  // Add random variance of ±8%
  const variance = () => (Math.random() * 16 - 8) / 100

  return {
    // Profile responses
    profile: [
      { questionKey: 'operationType', questionText: 'What type of operation do you run?', answerValue: company.operationType, answerType: 'select' },
      { questionKey: 'revenueBand', questionText: 'What is your annual revenue range?', answerValue: company.revenueBand, answerType: 'select' },
      { questionKey: 'numEmployees', questionText: 'How many employees do you have?', answerValue: String(company.numEmployees), answerType: 'number' },
      { questionKey: 'primaryMarkets', questionText: 'What are your primary markets served?', answerValue: company.primaryMarkets, answerType: 'multiselect' },
      { questionKey: 'yearsFounded', questionText: 'How many years has your business been operating?', answerValue: String(Math.floor(Math.random() * 30) + 5), answerType: 'number' },
      { questionKey: 'geographicReach', questionText: 'What is your geographic reach?', answerValue: ['Local (single city)', 'Regional (state)', 'National', 'International'][Math.floor(Math.random() * 4)], answerType: 'select' },
    ],
    // Production responses
    production: [
      { questionKey: 'laborCostPct', questionText: 'What is your labor cost as a percentage of revenue?', answerValue: String(Math.round(28 + Math.random() * 12)), answerType: 'number' },
      { questionKey: 'materialWastePct', questionText: 'What is your material waste percentage?', answerValue: String(Math.round(4 + Math.random() * 6)), answerType: 'number' },
      { questionKey: 'onTimeDeliveryPct', questionText: 'What is your on-time delivery rate?', answerValue: String(Math.round(85 + Math.random() * 12)), answerType: 'number' },
      { questionKey: 'productionBottlenecks', questionText: 'Describe your main production bottlenecks', answerValue: ['prepress delays', 'equipment downtime', 'staffing issues', 'material shortages'][Math.floor(Math.random() * 4)], answerType: 'text' },
      { questionKey: 'qualityControlProcess', questionText: 'What quality control processes do you have in place?', answerValue: 'Color management system,Manual spot checks,Customer approval process', answerType: 'multiselect' },
      { questionKey: 'equipmentAge', questionText: 'What is the average age of your primary production equipment?', answerValue: ['0-3 years', '4-7 years', '8-10 years'][Math.floor(Math.random() * 3)], answerType: 'select' },
      { questionKey: 'productionCapacityUtilization', questionText: 'What is your average production capacity utilization?', answerValue: String(Math.round(65 + Math.random() * 25)), answerType: 'number' },
      { questionKey: 'shiftStructure', questionText: 'What is your shift structure?', answerValue: ['Single shift', 'Two shifts', 'Three shifts'][Math.floor(Math.random() * 3)], answerType: 'select' },
    ],
    // Financial responses
    financial: [
      { questionKey: 'grossMarginPct', questionText: 'What is your gross margin percentage?', answerValue: String(Math.round(28 + Math.random() * 15)), answerType: 'number' },
      { questionKey: 'jobProfitabilityTracking', questionText: 'How do you track job profitability?', answerValue: ['Real-time job costing system', 'Post-job analysis', 'Monthly aggregated reports'][Math.floor(Math.random() * 3)], answerType: 'select' },
      { questionKey: 'financialReportingFrequency', questionText: 'How frequently do you review financial reports?', answerValue: ['Daily', 'Weekly', 'Monthly'][Math.floor(Math.random() * 3)], answerType: 'select' },
      { questionKey: 'costAccountingMethod', questionText: 'What cost accounting practices do you use?', answerValue: 'Job order costing,Activity-based costing', answerType: 'multiselect' },
      { questionKey: 'budgetVarianceTracking', questionText: 'Do you track budget variances?', answerValue: ['Yes, monthly', 'Yes, quarterly'][Math.floor(Math.random() * 2)], answerType: 'select' },
      { questionKey: 'cashFlowManagement', questionText: 'How would you rate your cash flow management?', answerValue: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)], answerType: 'select' },
    ],
    // Technology responses
    technology: [
      { questionKey: 'misErpSystem', questionText: 'What MIS/ERP system do you currently use?', answerValue: ['PrintSmith Vision', 'Avanti Slingshot', 'EFI Pace', 'Custom/In-house', 'Spreadsheets'][Math.floor(Math.random() * 5)], answerType: 'select' },
      { questionKey: 'misAdoptionScore', questionText: 'How would you rate your MIS adoption and usage?', answerValue: String(Math.round(5 + Math.random() * 4)), answerType: 'number' },
      { questionKey: 'automationLevel', questionText: 'What is your automation level for key processes?', answerValue: String(Math.round(4 + Math.random() * 5)), answerType: 'number' },
      { questionKey: 'digitalWorkflowIntegration', questionText: 'Which digital workflow tools are integrated?', answerValue: 'Web-to-print,Digital asset management,Production scheduling', answerType: 'multiselect' },
      { questionKey: 'technologyInvestmentPlans', questionText: 'What are your technology investment plans for the next 12 months?', answerValue: 'MIS/ERP upgrade,Automation software,Cloud migration', answerType: 'multiselect' },
      { questionKey: 'itSupport', questionText: 'What IT support structure do you have?', answerValue: ['In-house IT team', 'Outsourced IT support', 'Equipment vendor support only'][Math.floor(Math.random() * 3)], answerType: 'select' },
    ],
    // Sales responses
    sales: [
      { questionKey: 'customerRetentionPct', questionText: 'What is your customer retention rate?', answerValue: String(Math.round(80 + Math.random() * 15)), answerType: 'number' },
      { questionKey: 'employeeTurnoverPct', questionText: 'What is your employee turnover rate?', answerValue: String(Math.round(8 + Math.random() * 15)), answerType: 'number' },
      { questionKey: 'salesGrowthPct', questionText: 'What was your sales growth rate last year?', answerValue: String(Math.round(-5 + Math.random() * 20)), answerType: 'number' },
      { questionKey: 'customerServicePractices', questionText: 'What customer service practices do you have?', answerValue: 'Dedicated account managers,Online order tracking,Proactive communication', answerType: 'multiselect' },
      { questionKey: 'employeeTrainingPrograms', questionText: 'What employee training programs do you offer?', answerValue: 'Technical skills training,Safety training,Cross-training', answerType: 'multiselect' },
      { questionKey: 'salesTeamStructure', questionText: 'How is your sales team structured?', answerValue: ['Inside sales only', 'Outside sales only', 'Hybrid inside/outside', 'Owner-led sales'][Math.floor(Math.random() * 4)], answerType: 'select' },
      { questionKey: 'marketingStrategy', questionText: 'What marketing strategies do you employ?', answerValue: 'Digital marketing,Email campaigns,Referral programs', answerType: 'multiselect' },
      { questionKey: 'customerConcentration', questionText: 'What percentage of revenue comes from your top 5 customers?', answerValue: String(Math.round(25 + Math.random() * 30)), answerType: 'number' },
    ],
    // Scores
    scores: {
      productionWorkflowScore: Math.round(base.production * multiplier * (1 + variance())),
      financialVisibilityScore: Math.round(base.financial * multiplier * (1 + variance())),
      technologyGapScore: Math.round(base.technology * multiplier * (1 + variance())),
      salesServicePeopleScore: Math.round(base.sales * multiplier * (1 + variance())),
    }
  }
}

async function main() {
  console.log('🌱 Seeding 10 sample assessments...')
  
  // First, ensure we have a user to associate with assessments
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@gimbel.com' },
    update: {},
    create: {
      email: 'admin@gimbel.com',
      name: 'Admin User',
      password: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // hashed 'admin123'
    },
  })
  
  console.log(`✅ Using admin user: ${adminUser.email}`)
  
  for (const company of sampleCompanies) {
    console.log(`\n📊 Creating assessment for ${company.companyName} (${company.mode} mode)...`)
    
    const responses = generateResponses(company)
    const overallScore = Math.round(
      (responses.scores.productionWorkflowScore + 
       responses.scores.financialVisibilityScore + 
       responses.scores.technologyGapScore + 
       responses.scores.salesServicePeopleScore) / 4
    )
    
    // Create assessment
    const assessment = await prisma.assessment.upsert({
      where: { sessionCode: company.sessionCode },
      update: {
        mode: company.mode,
        status: 'completed',
        operationType: company.operationType,
        revenueBand: company.revenueBand,
        numEmployees: company.numEmployees,
        primaryMarkets: company.primaryMarkets,
        overallScore: overallScore,
        completedAt: company.completedAt,
        updatedAt: new Date(),
      },
      create: {
        sessionCode: company.sessionCode,
        mode: company.mode,
        status: 'completed',
        operationType: company.operationType,
        revenueBand: company.revenueBand,
        numEmployees: company.numEmployees,
        primaryMarkets: company.primaryMarkets,
        overallScore: overallScore,
        completedAt: company.completedAt,
        createdById: adminUser.id,
      },
    })
    
    // Create respondent (company rep)
    const respondent = await prisma.respondent.upsert({
      where: { 
        id: `resp-${company.sessionCode}` 
      },
      update: {},
      create: {
        id: `resp-${company.sessionCode}`,
        assessmentId: assessment.id,
        name: company.companyName,
        email: `contact@${company.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        role: 'Operations Manager',
      },
    })
    
    // Delete existing responses for this assessment (for re-running)
    await prisma.response.deleteMany({
      where: { assessmentId: assessment.id }
    })
    
    // Create all responses
    const allResponses = [
      ...responses.profile.map(r => ({ ...r, section: 'profile' })),
      ...responses.production.map(r => ({ ...r, section: 'production' })),
      ...responses.financial.map(r => ({ ...r, section: 'financial' })),
      ...responses.technology.map(r => ({ ...r, section: 'technology' })),
      ...responses.sales.map(r => ({ ...r, section: 'sales' })),
    ]
    
    await prisma.response.createMany({
      data: allResponses.map(r => ({
        assessmentId: assessment.id,
        respondentId: respondent.id,
        section: r.section,
        questionKey: r.questionKey,
        questionText: r.questionText,
        answerValue: r.answerValue,
        answerType: r.answerType,
      })),
    })
    
    // Create section progress
    const sections = ['profile', 'production', 'financial', 'technology', 'sales']
    for (const section of sections) {
      await prisma.sectionProgress.upsert({
        where: {
          assessmentId_section: {
            assessmentId: assessment.id,
            section: section,
          },
        },
        update: {
          isCompleted: true,
          completedAt: company.completedAt,
        },
        create: {
          assessmentId: assessment.id,
          section: section,
          isCompleted: true,
          completedById: respondent.id,
          completedAt: company.completedAt,
        },
      })
    }
    
    // Create assessment result
    await prisma.assessmentResult.upsert({
      where: { assessmentId: assessment.id },
      update: {
        productionWorkflowScore: responses.scores.productionWorkflowScore,
        financialVisibilityScore: responses.scores.financialVisibilityScore,
        technologyGapScore: responses.scores.technologyGapScore,
        salesServicePeopleScore: responses.scores.salesServicePeopleScore,
        overallScore: overallScore,
      },
      create: {
        assessmentId: assessment.id,
        productionWorkflowScore: responses.scores.productionWorkflowScore,
        financialVisibilityScore: responses.scores.financialVisibilityScore,
        technologyGapScore: responses.scores.technologyGapScore,
        salesServicePeopleScore: responses.scores.salesServicePeopleScore,
        overallScore: overallScore,
        topInsights: JSON.stringify([
          `Strong ${company.operationType} operations with room for optimization`,
          `Revenue in the ${company.revenueBand} range shows growth potential`,
          `Team of ${company.numEmployees} employees indicates scalable operations`,
        ]),
        costOpportunities: JSON.stringify([
          { area: 'Material Waste Reduction', potential: '$25,000 - $50,000/year' },
          { area: 'Labor Efficiency', potential: '$30,000 - $60,000/year' },
          { area: 'Technology ROI', potential: '$15,000 - $35,000/year' },
        ]),
        gapAnalysis: JSON.stringify({
          strengths: ['Customer relationships', 'Production quality'],
          weaknesses: ['Technology adoption', 'Process automation'],
          opportunities: ['Market expansion', 'Service diversification'],
        }),
        consultingRoadmap: JSON.stringify([
          { phase: 1, title: 'Assessment Review', duration: '2 weeks' },
          { phase: 2, title: 'Strategy Development', duration: '4 weeks' },
          { phase: 3, title: 'Implementation', duration: '8-12 weeks' },
        ]),
      },
    })
    
    console.log(`   ✅ Created assessment ${company.sessionCode}`)
    console.log(`      Mode: ${company.mode}`)
    console.log(`      Operation: ${company.operationType}`)
    console.log(`      Revenue: ${company.revenueBand}`)
    console.log(`      Overall Score: ${overallScore}`)
  }
  
  console.log('\n🎉 Successfully seeded 10 sample assessments!')
  console.log('   - 5 Chat mode assessments (CHAT-*)')
  console.log('   - 5 Form mode assessments (FORM-*)')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
