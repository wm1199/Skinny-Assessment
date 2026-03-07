import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a sample assessment with dummy data
  const sessionCode = `SAMPLE-${Date.now().toString(36).toUpperCase()}`;
  
  const assessment = await prisma.assessment.create({
    data: {
      sessionCode,
      mode: 'form',
      status: 'completed',
      operationType: 'Digital Print',
      revenueBand: '$5M-$10M',
      numEmployees: 45,
      primaryMarkets: 'Commercial, Marketing Materials, Packaging',
    },
  });

  // Create a respondent
  const respondent = await prisma.respondent.create({
    data: {
      assessmentId: assessment.id,
      name: 'Sample User',
      email: 'sample@example.com',
      role: 'Operations Manager',
    },
  });

  // Sample responses covering all functional areas
  const sampleResponses = [
    // Profile
    { questionKey: 'operationType', section: 'profile', questionText: 'Operation Type', answerValue: 'Digital Print', answerType: 'select' },
    { questionKey: 'revenueBand', section: 'profile', questionText: 'Annual Revenue', answerValue: '$5M-$10M', answerType: 'select' },
    { questionKey: 'numEmployees', section: 'profile', questionText: 'Number of Employees', answerValue: '45', answerType: 'number' },
    { questionKey: 'primaryMarkets', section: 'profile', questionText: 'Primary Markets', answerValue: 'Commercial, Marketing Materials, Packaging', answerType: 'text' },
    
    // Production Workflow
    { questionKey: 'laborCostPct', section: 'production', questionText: 'Labor Cost %', answerValue: '38', answerType: 'number' },
    { questionKey: 'materialWastePct', section: 'production', questionText: 'Material Waste %', answerValue: '7', answerType: 'number' },
    { questionKey: 'onTimeDeliveryPct', section: 'production', questionText: 'On-Time Delivery %', answerValue: '89', answerType: 'number' },
    { questionKey: 'productionBottlenecks', section: 'production', questionText: 'Production Bottlenecks', answerValue: 'Prepress workflow delays and equipment scheduling conflicts', answerType: 'text' },
    { questionKey: 'qualityControlProcess', section: 'production', questionText: 'Quality Control Process', answerValue: 'Manual inspection at final stage only', answerType: 'text' },
    
    // Financial Visibility
    { questionKey: 'grossMarginPct', section: 'financial', questionText: 'Gross Margin %', answerValue: '32', answerType: 'number' },
    { questionKey: 'jobProfitabilityTracking', section: 'financial', questionText: 'Job Profitability Tracking', answerValue: 'Basic tracking in spreadsheets', answerType: 'select' },
    { questionKey: 'financialReportingFreq', section: 'financial', questionText: 'Financial Reporting Frequency', answerValue: 'Monthly', answerType: 'select' },
    { questionKey: 'costAccountingMethod', section: 'financial', questionText: 'Cost Accounting Method', answerValue: 'Standard costing', answerType: 'select' },
    
    // Technology Gap
    { questionKey: 'misErpSystem', section: 'technology', questionText: 'MIS/ERP System', answerValue: 'Legacy system (10+ years old)', answerType: 'select' },
    { questionKey: 'automationLevel', section: 'technology', questionText: 'Automation Level (1-5)', answerValue: '3', answerType: 'number' },
    { questionKey: 'digitalWorkflowIntegration', section: 'technology', questionText: 'Digital Workflow Integration', answerValue: 'Partial - some manual steps', answerType: 'select' },
    { questionKey: 'techInvestmentPlans', section: 'technology', questionText: 'Technology Investment Plans', answerValue: 'Planning to upgrade MIS within 2 years', answerType: 'text' },
    
    // Sales, Service & People
    { questionKey: 'customerRetentionPct', section: 'sales', questionText: 'Customer Retention %', answerValue: '78', answerType: 'number' },
    { questionKey: 'employeeTurnoverPct', section: 'sales', questionText: 'Employee Turnover %', answerValue: '18', answerType: 'number' },
    { questionKey: 'salesGrowthPct', section: 'sales', questionText: 'Sales Growth %', answerValue: '4', answerType: 'number' },
    { questionKey: 'customerServicePractices', section: 'sales', questionText: 'Customer Service Practices', answerValue: 'Reactive support, no formal SLAs', answerType: 'text' },
    { questionKey: 'employeeTraining', section: 'sales', questionText: 'Employee Training', answerValue: 'Informal on-the-job training only', answerType: 'text' },
  ];

  // Save all responses
  for (const resp of sampleResponses) {
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
    });
  }

  // Mark sections as complete
  const sections = ['profile', 'production', 'financial', 'technology', 'sales'];
  for (const section of sections) {
    await prisma.sectionProgress.create({
      data: {
        assessmentId: assessment.id,
        section,
        isCompleted: true,
        completedById: respondent.id,
        completedAt: new Date(),
      },
    });
  }

  console.log(`Created sample assessment with session code: ${sessionCode}`);
  console.log(`Assessment ID: ${assessment.id}`);
  
  return { sessionCode, assessmentId: assessment.id };
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
