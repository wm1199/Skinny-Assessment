import { getBenchmark, calculateGap, BenchmarkData } from './benchmark'

export interface ScoringInput {
  operationType: string
  revenueBand: string
  responses: Array<{
    section: string
    questionKey: string
    answerValue: string
  }>
}

export interface ScoringResult {
  productionWorkflowScore: number
  financialVisibilityScore: number
  technologyGapScore: number
  salesServicePeopleScore: number
  overallScore: number
  topInsights: Array<{
    area: string
    insight: string
    impact: 'high' | 'medium' | 'low'
  }>
  costOpportunities: Array<{
    area: string
    opportunity: string
    estimatedSavings: string
  }>
  gapAnalysis: Array<{
    metric: string
    yourValue: number
    benchmark: number
    target: number
    status: 'above' | 'below' | 'at'
  }>
}

function getResponseValue(responses: any[], key: string): number {
  const response = responses?.find(r => r?.questionKey === key)
  return parseFloat(response?.answerValue || '0')
}

function scoreMetric(
  userValue: number,
  benchmarkValue: number,
  lowerIsBetter: boolean = false
): number {
  if (benchmarkValue === 0) return 50
  
  const gap = calculateGap(userValue, benchmarkValue, lowerIsBetter)
  
  // Score from 0-100
  let score = 50
  if (lowerIsBetter) {
    // For metrics where lower is better (e.g., waste, turnover)
    if (gap?.status === 'below') {
      // User is below benchmark (better)
      score = Math.min(100, 50 + Math.abs(gap?.gapPercent || 0))
    } else if (gap?.status === 'above') {
      // User is above benchmark (worse)
      score = Math.max(0, 50 - Math.abs(gap?.gapPercent || 0))
    }
  } else {
    // For metrics where higher is better (e.g., margin, retention)
    if (gap?.status === 'above') {
      score = Math.min(100, 50 + Math.abs(gap?.gapPercent || 0) / 2)
    } else if (gap?.status === 'below') {
      score = Math.max(0, 50 - Math.abs(gap?.gapPercent || 0) / 2)
    }
  }
  
  return Math.round(Math.max(0, Math.min(100, score)))
}

export function calculateScores(input: ScoringInput): ScoringResult | null {
  const { operationType, revenueBand, responses } = input
  
  const benchmark = getBenchmark(operationType, revenueBand)
  if (!benchmark) {
    console.error('No benchmark found for:', operationType, revenueBand)
    return null
  }
  
  // Production Workflow Score (20%)
  const laborCost = getResponseValue(responses, 'laborCostPct')
  const materialWaste = getResponseValue(responses, 'materialWastePct')
  const onTimeDelivery = getResponseValue(responses, 'onTimeDeliveryPct')
  
  const laborScore = scoreMetric(laborCost, benchmark?.AvgLaborCostPct || 0, true)
  const wasteScore = scoreMetric(materialWaste, benchmark?.AvgMaterialWastePct || 0, true)
  const deliveryScore = scoreMetric(onTimeDelivery, benchmark?.AvgOnTimeDeliveryPct || 0, false)
  
  const productionWorkflowScore = Math.round(
    (laborScore + wasteScore + deliveryScore) / 3
  )
  
  // Financial Visibility Score (20%)
  const grossMargin = getResponseValue(responses, 'grossMarginPct')
  const financialVisibilityScore = scoreMetric(grossMargin, benchmark?.AvgGrossMarginPct || 0, false)
  
  // Technology Gap Score (15%)
  const misAdoption = getResponseValue(responses, 'misAdoptionScore')
  const automation = getResponseValue(responses, 'automationLevel')
  
  const misScore = scoreMetric(misAdoption, benchmark?.AvgMISAdoptionScore || 0, false)
  const autoScore = scoreMetric(automation, benchmark?.AvgAutomationScore || 0, false)
  
  const technologyGapScore = Math.round((misScore + autoScore) / 2)
  
  // Sales/Service/People Score (45%)
  const customerRetention = getResponseValue(responses, 'customerRetentionPct')
  const employeeTurnover = getResponseValue(responses, 'employeeTurnoverPct')
  const salesGrowth = getResponseValue(responses, 'salesGrowthPct')
  
  const retentionScore = scoreMetric(customerRetention, benchmark?.AvgCustomerRetentionPct || 0, false)
  const turnoverScore = scoreMetric(employeeTurnover, benchmark?.AvgEmployeeTurnoverPct || 0, true)
  const growthScore = scoreMetric(salesGrowth, benchmark?.AvgSalesGrowthPct || 0, false)
  
  const salesServicePeopleScore = Math.round(
    (retentionScore + turnoverScore + growthScore) / 3
  )
  
  // Overall Score (weighted average)
  const overallScore = Math.round(
    productionWorkflowScore * 0.2 +
    financialVisibilityScore * 0.2 +
    technologyGapScore * 0.15 +
    salesServicePeopleScore * 0.45
  )
  
  // Generate insights
  const topInsights = []
  
  if (laborScore < 60) {
    topInsights.push({
      area: 'Production',
      insight: `Labor costs at ${laborCost}% are ${Math.abs(laborCost - (benchmark?.AvgLaborCostPct || 0)).toFixed(1)}% higher than industry average`,
      impact: 'high' as const,
    })
  }
  
  if (wasteScore < 60) {
    topInsights.push({
      area: 'Production',
      insight: `Material waste at ${materialWaste}% exceeds benchmark by ${Math.abs(materialWaste - (benchmark?.AvgMaterialWastePct || 0)).toFixed(1)}%`,
      impact: 'high' as const,
    })
  }
  
  if (turnoverScore < 60) {
    topInsights.push({
      area: 'People',
      insight: `Employee turnover at ${employeeTurnover}% is ${Math.abs(employeeTurnover - (benchmark?.AvgEmployeeTurnoverPct || 0)).toFixed(1)}% above industry norm`,
      impact: 'high' as const,
    })
  }
  
  // Cost opportunities
  const costOpportunities = []
  
  if (laborScore < 70) {
    costOpportunities.push({
      area: 'Labor Efficiency',
      opportunity: 'Optimize staffing and reduce overtime through better scheduling',
      estimatedSavings: '$50K - $200K annually',
    })
  }
  
  if (wasteScore < 70) {
    costOpportunities.push({
      area: 'Material Waste',
      opportunity: 'Implement better quality control and prepress automation',
      estimatedSavings: '$30K - $150K annually',
    })
  }
  
  // Gap analysis
  const gapAnalysis = [
    {
      metric: 'Labor Cost %',
      yourValue: laborCost,
      benchmark: benchmark?.AvgLaborCostPct || 0,
      target: (benchmark?.AvgLaborCostPct || 0) * 0.95,
      status: calculateGap(laborCost, benchmark?.AvgLaborCostPct || 0, true)?.status,
    },
    {
      metric: 'Material Waste %',
      yourValue: materialWaste,
      benchmark: benchmark?.AvgMaterialWastePct || 0,
      target: (benchmark?.AvgMaterialWastePct || 0) * 0.8,
      status: calculateGap(materialWaste, benchmark?.AvgMaterialWastePct || 0, true)?.status,
    },
    {
      metric: 'On-Time Delivery %',
      yourValue: onTimeDelivery,
      benchmark: benchmark?.AvgOnTimeDeliveryPct || 0,
      target: 95,
      status: calculateGap(onTimeDelivery, benchmark?.AvgOnTimeDeliveryPct || 0, false)?.status,
    },
    {
      metric: 'Gross Margin %',
      yourValue: grossMargin,
      benchmark: benchmark?.AvgGrossMarginPct || 0,
      target: (benchmark?.AvgGrossMarginPct || 0) * 1.1,
      status: calculateGap(grossMargin, benchmark?.AvgGrossMarginPct || 0, false)?.status,
    },
    {
      metric: 'Customer Retention %',
      yourValue: customerRetention,
      benchmark: benchmark?.AvgCustomerRetentionPct || 0,
      target: 90,
      status: calculateGap(customerRetention, benchmark?.AvgCustomerRetentionPct || 0, false)?.status,
    },
  ]
  
  return {
    productionWorkflowScore,
    financialVisibilityScore,
    technologyGapScore,
    salesServicePeopleScore,
    overallScore,
    topInsights,
    costOpportunities,
    gapAnalysis,
  }
}
