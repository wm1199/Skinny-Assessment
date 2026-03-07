import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

// 10 sample test customers with varied profiles
const testCustomers = [
  {
    companyName: 'Acme Print Solutions',
    contactName: 'John Smith',
    email: 'john.smith@acmeprint.com',
    operationType: 'Digital Print',
    revenueBand: '$5M-$10M',
    numEmployees: 42,
    primaryMarkets: 'Marketing Materials, Business Cards, Brochures',
    laborCost: 32,
    materialWaste: 5.5,
    onTimeDelivery: 94,
    grossMargin: 38,
    customerRetention: 88,
    employeeTurnover: 12,
    salesGrowth: 8,
    misAdoption: 7,
    automationLevel: 6,
  },
  {
    companyName: 'Metro Offset Printers',
    contactName: 'Sarah Johnson',
    email: 'sarah@metrooffset.com',
    operationType: 'Offset Print',
    revenueBand: '$10M-$25M',
    numEmployees: 85,
    primaryMarkets: 'Magazines, Catalogs, Books',
    laborCost: 28,
    materialWaste: 3.2,
    onTimeDelivery: 91,
    grossMargin: 42,
    customerRetention: 92,
    employeeTurnover: 8,
    salesGrowth: 5,
    misAdoption: 8,
    automationLevel: 7,
  },
  {
    companyName: 'SignPro Graphics',
    contactName: 'Mike Williams',
    email: 'mike@signpro.com',
    operationType: 'Wide Format',
    revenueBand: '$1M-$5M',
    numEmployees: 18,
    primaryMarkets: 'Banners, Vehicle Wraps, Trade Show Displays',
    laborCost: 38,
    materialWaste: 8.5,
    onTimeDelivery: 85,
    grossMargin: 45,
    customerRetention: 78,
    employeeTurnover: 22,
    salesGrowth: 15,
    misAdoption: 4,
    automationLevel: 3,
  },
  {
    companyName: 'Premier Print Group',
    contactName: 'Lisa Chen',
    email: 'lchen@premierprint.com',
    operationType: 'Hybrid',
    revenueBand: '$25M+',
    numEmployees: 156,
    primaryMarkets: 'Packaging, Labels, Commercial Print',
    laborCost: 25,
    materialWaste: 2.8,
    onTimeDelivery: 96,
    grossMargin: 44,
    customerRetention: 94,
    employeeTurnover: 6,
    salesGrowth: 12,
    misAdoption: 9,
    automationLevel: 9,
  },
  {
    companyName: 'QuickPrint Express',
    contactName: 'David Brown',
    email: 'david@quickprintexpress.com',
    operationType: 'Digital Print',
    revenueBand: '$1M-$5M',
    numEmployees: 12,
    primaryMarkets: 'Business Cards, Flyers, Postcards',
    laborCost: 42,
    materialWaste: 9.2,
    onTimeDelivery: 88,
    grossMargin: 32,
    customerRetention: 72,
    employeeTurnover: 28,
    salesGrowth: 3,
    misAdoption: 3,
    automationLevel: 2,
  },
  {
    companyName: 'Heritage Publishing',
    contactName: 'Robert Taylor',
    email: 'rtaylor@heritagepub.com',
    operationType: 'Offset Print',
    revenueBand: '$5M-$10M',
    numEmployees: 55,
    primaryMarkets: 'Books, Annual Reports, High-End Catalogs',
    laborCost: 30,
    materialWaste: 4.0,
    onTimeDelivery: 89,
    grossMargin: 36,
    customerRetention: 90,
    employeeTurnover: 10,
    salesGrowth: 2,
    misAdoption: 6,
    automationLevel: 5,
  },
  {
    companyName: 'Banner World Inc',
    contactName: 'Jennifer Martinez',
    email: 'jmartinez@bannerworld.com',
    operationType: 'Wide Format',
    revenueBand: '$5M-$10M',
    numEmployees: 35,
    primaryMarkets: 'Event Graphics, Retail Signage, Wall Murals',
    laborCost: 35,
    materialWaste: 6.8,
    onTimeDelivery: 92,
    grossMargin: 48,
    customerRetention: 85,
    employeeTurnover: 15,
    salesGrowth: 18,
    misAdoption: 5,
    automationLevel: 4,
  },
  {
    companyName: 'Consolidated Printing',
    contactName: 'William Anderson',
    email: 'wanderson@consolidatedprint.com',
    operationType: 'Hybrid',
    revenueBand: '$10M-$25M',
    numEmployees: 98,
    primaryMarkets: 'Direct Mail, Transactional Print, Marketing',
    laborCost: 27,
    materialWaste: 3.5,
    onTimeDelivery: 93,
    grossMargin: 40,
    customerRetention: 91,
    employeeTurnover: 9,
    salesGrowth: 7,
    misAdoption: 8,
    automationLevel: 8,
  },
  {
    companyName: 'Digital Dynamics',
    contactName: 'Amanda Wilson',
    email: 'awilson@digitaldynamics.com',
    operationType: 'Digital Print',
    revenueBand: '$10M-$25M',
    numEmployees: 72,
    primaryMarkets: 'Variable Data, Personalization, Short-Run',
    laborCost: 29,
    materialWaste: 4.5,
    onTimeDelivery: 95,
    grossMargin: 41,
    customerRetention: 89,
    employeeTurnover: 11,
    salesGrowth: 14,
    misAdoption: 9,
    automationLevel: 8,
  },
  {
    companyName: 'Classic Press',
    contactName: 'Thomas Jackson',
    email: 'tjackson@classicpress.com',
    operationType: 'Offset Print',
    revenueBand: '$25M+',
    numEmployees: 180,
    primaryMarkets: 'Newspapers, Magazines, Commercial',
    laborCost: 24,
    materialWaste: 2.5,
    onTimeDelivery: 90,
    grossMargin: 35,
    customerRetention: 93,
    employeeTurnover: 7,
    salesGrowth: -2,
    misAdoption: 7,
    automationLevel: 6,
  },
]

function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'TEST-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function seedTestCustomers() {
  console.log('🌱 Seeding 10 test customers...\n')

  for (const customer of testCustomers) {
    const sessionCode = generateSessionCode()
    
    // Create the assessment
    const assessment = await prisma.assessment.create({
      data: {
        sessionCode,
        mode: 'form',
        status: 'completed',
        operationType: customer.operationType,
        revenueBand: customer.revenueBand,
        numEmployees: customer.numEmployees,
        primaryMarkets: customer.primaryMarkets,
      },
    })

    // Create a respondent
    const respondent = await prisma.respondent.create({
      data: {
        assessmentId: assessment.id,
        name: customer.contactName,
        email: customer.email,
        role: 'Primary Contact',
      },
    })

    // Create responses for all sections
    const responses = [
      // Profile
      { section: 'profile', questionKey: 'operationType', questionText: 'Operation Type', answerValue: customer.operationType, answerType: 'select' },
      { section: 'profile', questionKey: 'revenueBand', questionText: 'Revenue Band', answerValue: customer.revenueBand, answerType: 'select' },
      { section: 'profile', questionKey: 'numEmployees', questionText: 'Number of Employees', answerValue: String(customer.numEmployees), answerType: 'number' },
      { section: 'profile', questionKey: 'primaryMarkets', questionText: 'Primary Markets', answerValue: customer.primaryMarkets, answerType: 'text' },
      // Production
      { section: 'production', questionKey: 'laborCostPercent', questionText: 'Labor Cost as % of Revenue', answerValue: String(customer.laborCost), answerType: 'number' },
      { section: 'production', questionKey: 'materialWastePercent', questionText: 'Material Waste %', answerValue: String(customer.materialWaste), answerType: 'number' },
      { section: 'production', questionKey: 'onTimeDeliveryPercent', questionText: 'On-Time Delivery %', answerValue: String(customer.onTimeDelivery), answerType: 'number' },
      // Financial
      { section: 'financial', questionKey: 'grossMarginPercent', questionText: 'Gross Margin %', answerValue: String(customer.grossMargin), answerType: 'number' },
      { section: 'financial', questionKey: 'jobProfitabilityTracking', questionText: 'Job Profitability Tracking', answerValue: customer.misAdoption >= 7 ? 'Automated per-job' : customer.misAdoption >= 4 ? 'Manual tracking' : 'None', answerType: 'select' },
      { section: 'financial', questionKey: 'financialReportingFrequency', questionText: 'Financial Reporting Frequency', answerValue: customer.misAdoption >= 7 ? 'Weekly' : 'Monthly', answerType: 'select' },
      // Technology
      { section: 'technology', questionKey: 'misErpSystem', questionText: 'MIS/ERP System', answerValue: customer.misAdoption >= 7 ? 'Fully integrated MIS' : customer.misAdoption >= 4 ? 'Basic MIS' : 'Spreadsheets only', answerType: 'select' },
      { section: 'technology', questionKey: 'automationLevel', questionText: 'Automation Level (1-10)', answerValue: String(customer.automationLevel), answerType: 'number' },
      { section: 'technology', questionKey: 'digitalWorkflowIntegration', questionText: 'Digital Workflow Integration', answerValue: customer.automationLevel >= 7 ? 'End-to-end' : customer.automationLevel >= 4 ? 'Partial' : 'Minimal', answerType: 'select' },
      // Sales & People
      { section: 'sales', questionKey: 'customerRetentionPercent', questionText: 'Customer Retention %', answerValue: String(customer.customerRetention), answerType: 'number' },
      { section: 'sales', questionKey: 'employeeTurnoverPercent', questionText: 'Employee Turnover %', answerValue: String(customer.employeeTurnover), answerType: 'number' },
      { section: 'sales', questionKey: 'salesGrowthPercent', questionText: 'Sales Growth %', answerValue: String(customer.salesGrowth), answerType: 'number' },
    ]

    for (const resp of responses) {
      await prisma.response.create({
        data: {
          assessmentId: assessment.id,
          respondentId: respondent.id,
          questionKey: resp.questionKey,
          questionText: resp.questionText,
          section: resp.section,
          answerValue: resp.answerValue,
          answerType: resp.answerType,
        },
      })
    }

    // Mark sections as completed
    const sections = ['profile', 'production', 'financial', 'technology', 'sales']
    for (const section of sections) {
      await prisma.sectionProgress.create({
        data: {
          assessmentId: assessment.id,
          section: section,
          isCompleted: true,
          completedById: respondent.id,
          completedAt: new Date(),
        },
      })
    }

    // Calculate scores (simplified calculation)
    const productionScore = Math.round(
      (100 - customer.laborCost) * 0.4 + 
      (100 - customer.materialWaste * 10) * 0.3 + 
      customer.onTimeDelivery * 0.3
    )
    const financialScore = Math.round(
      customer.grossMargin * 1.5 + 
      customer.misAdoption * 3
    )
    const technologyScore = Math.round(
      customer.misAdoption * 5 + 
      customer.automationLevel * 5
    )
    const salesScore = Math.round(
      customer.customerRetention * 0.4 + 
      (100 - customer.employeeTurnover) * 0.3 + 
      Math.max(0, customer.salesGrowth + 10) * 2
    )
    const overallScore = Math.round(
      productionScore * 0.2 + 
      financialScore * 0.2 + 
      technologyScore * 0.15 + 
      salesScore * 0.45
    )

    // Generate insights
    const topInsights = []
    if (customer.laborCost > 35) {
      topInsights.push({ area: 'Production', insight: `Labor costs at ${customer.laborCost}% are above industry average. Consider workflow optimization.` })
    }
    if (customer.materialWaste > 5) {
      topInsights.push({ area: 'Production', insight: `Material waste at ${customer.materialWaste}% exceeds benchmark. Implement waste reduction programs.` })
    }
    if (customer.customerRetention < 85) {
      topInsights.push({ area: 'Sales', insight: `Customer retention at ${customer.customerRetention}% needs improvement. Focus on customer experience.` })
    }
    if (customer.automationLevel < 6) {
      topInsights.push({ area: 'Technology', insight: `Automation level is low. Invest in digital workflow tools for efficiency gains.` })
    }
    if (topInsights.length === 0) {
      topInsights.push({ area: 'Overall', insight: 'Strong performance across all metrics. Focus on maintaining excellence.' })
    }

    // Generate cost opportunities
    const costOpportunities = []
    if (customer.laborCost > 30) {
      const savings = Math.round((customer.laborCost - 28) * 5000)
      costOpportunities.push({ area: 'Labor Efficiency', opportunity: 'Optimize staffing and scheduling', estimatedSavings: `$${savings.toLocaleString()} - $${(savings * 2).toLocaleString()} annually` })
    }
    if (customer.materialWaste > 4) {
      const savings = Math.round((customer.materialWaste - 3) * 8000)
      costOpportunities.push({ area: 'Material Waste', opportunity: 'Implement waste tracking and reduction', estimatedSavings: `$${savings.toLocaleString()} - $${(savings * 1.5).toLocaleString()} annually` })
    }
    if (customer.automationLevel < 7) {
      costOpportunities.push({ area: 'Automation', opportunity: 'Invest in workflow automation', estimatedSavings: '$25,000 - $75,000 annually' })
    }

    // Generate gap analysis
    const gapAnalysis = [
      { metric: 'Labor Cost %', yourValue: customer.laborCost, benchmark: 28, status: customer.laborCost <= 28 ? 'above' : 'below' },
      { metric: 'Material Waste %', yourValue: customer.materialWaste, benchmark: 3.5, status: customer.materialWaste <= 3.5 ? 'above' : 'below' },
      { metric: 'On-Time Delivery %', yourValue: customer.onTimeDelivery, benchmark: 92, status: customer.onTimeDelivery >= 92 ? 'above' : 'below' },
      { metric: 'Gross Margin %', yourValue: customer.grossMargin, benchmark: 38, status: customer.grossMargin >= 38 ? 'above' : 'below' },
      { metric: 'Customer Retention %', yourValue: customer.customerRetention, benchmark: 88, status: customer.customerRetention >= 88 ? 'above' : 'below' },
    ]

    // Create assessment result
    await prisma.assessmentResult.create({
      data: {
        assessmentId: assessment.id,
        productionWorkflowScore: Math.min(100, Math.max(0, productionScore)),
        financialVisibilityScore: Math.min(100, Math.max(0, financialScore)),
        technologyGapScore: Math.min(100, Math.max(0, technologyScore)),
        salesServicePeopleScore: Math.min(100, Math.max(0, salesScore)),
        overallScore: Math.min(100, Math.max(0, overallScore)),
        topInsights: JSON.stringify(topInsights),
        costOpportunities: JSON.stringify(costOpportunities),
        gapAnalysis: JSON.stringify(gapAnalysis),
        consultingRoadmap: JSON.stringify([
          { phase: 1, title: 'Quick Wins', description: 'Address immediate inefficiencies', timeline: '30-60 days' },
          { phase: 2, title: 'Strategic Investments', description: 'Technology and process upgrades', timeline: '60-120 days' },
          { phase: 3, title: 'Long-term Excellence', description: 'Continuous improvement', timeline: '120+ days' },
        ]),
      },
    })

    console.log(`✅ Created: ${customer.companyName}`)
    console.log(`   Session: ${sessionCode}`)
    console.log(`   Contact: ${customer.contactName} (${customer.email})`)
    console.log(`   Profile: ${customer.operationType} | ${customer.revenueBand} | ${customer.numEmployees} employees`)
    console.log(`   Score: ${overallScore}\n`)
  }

  console.log('\n🎉 Successfully seeded 10 test customers!')
}

seedTestCustomers()
  .catch((e) => {
    console.error('Error seeding test customers:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
