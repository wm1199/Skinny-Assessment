import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBenchmark } from '@/lib/benchmark'

export const dynamic = 'force-dynamic'

// Helper function to generate SVG gauge chart
function generateGaugeChart(score: number, size: number = 200): string {
  const centerX = size / 2
  const centerY = size / 2
  const radius = size * 0.4
  const strokeWidth = 20
  const circumference = Math.PI * radius // Half circle
  const scorePercentage = score / 100
  const dashOffset = circumference * (1 - scorePercentage)
  
  const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  const bgColor = '#e2e8f0'
  
  return `
    <svg width="${size}" height="${size * 0.65}" viewBox="0 0 ${size} ${size * 0.65}">
      <!-- Background arc -->
      <path 
        d="M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}" 
        fill="none" 
        stroke="${bgColor}" 
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
      />
      <!-- Score arc -->
      <path 
        d="M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}" 
        fill="none" 
        stroke="${scoreColor}" 
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(0 ${centerX} ${centerY})"
      />
      <!-- Score text -->
      <text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-size="48" font-weight="bold" fill="${scoreColor}">${score}</text>
      <text x="${centerX}" y="${centerY + 20}" text-anchor="middle" font-size="14" fill="#64748b">out of 100</text>
    </svg>
  `
}

// Helper function to generate radar chart SVG
function generateRadarChart(scores: { production: number; financial: number; technology: number; sales: number }, size: number = 300): string {
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = size * 0.4
  
  const categories = [
    { name: 'Production', score: scores.production, angle: -90 },
    { name: 'Financial', score: scores.financial, angle: 0 },
    { name: 'Sales & People', score: scores.sales, angle: 90 },
    { name: 'Technology', score: scores.technology, angle: 180 },
  ]
  
  // Generate grid circles
  const gridCircles = [25, 50, 75, 100].map(level => {
    const r = (level / 100) * maxRadius
    return `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`
  }).join('')
  
  // Generate axis lines and labels
  const axisLines = categories.map(cat => {
    const angleRad = (cat.angle * Math.PI) / 180
    const x2 = centerX + maxRadius * Math.cos(angleRad)
    const y2 = centerY + maxRadius * Math.sin(angleRad)
    const labelX = centerX + (maxRadius + 25) * Math.cos(angleRad)
    const labelY = centerY + (maxRadius + 25) * Math.sin(angleRad)
    return `
      <line x1="${centerX}" y1="${centerY}" x2="${x2}" y2="${y2}" stroke="#cbd5e1" stroke-width="1"/>
      <text x="${labelX}" y="${labelY + 5}" text-anchor="middle" font-size="11" fill="#475569">${cat.name}</text>
    `
  }).join('')
  
  // Generate score polygon
  const points = categories.map(cat => {
    const angleRad = (cat.angle * Math.PI) / 180
    const r = (cat.score / 100) * maxRadius
    const x = centerX + r * Math.cos(angleRad)
    const y = centerY + r * Math.sin(angleRad)
    return `${x},${y}`
  }).join(' ')
  
  // Generate score points
  const scorePoints = categories.map(cat => {
    const angleRad = (cat.angle * Math.PI) / 180
    const r = (cat.score / 100) * maxRadius
    const x = centerX + r * Math.cos(angleRad)
    const y = centerY + r * Math.sin(angleRad)
    return `<circle cx="${x}" cy="${y}" r="5" fill="#1e40af"/>`
  }).join('')
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${gridCircles}
      ${axisLines}
      <polygon points="${points}" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" stroke-width="2"/>
      ${scorePoints}
    </svg>
  `
}

// Helper function to generate horizontal bar chart
function generateBarChart(items: Array<{ label: string; value: number; benchmark: number }>, width: number = 400, height: number = 200): string {
  const barHeight = 25
  const barGap = 15
  const labelWidth = 120
  const chartWidth = width - labelWidth - 60
  const maxValue = Math.max(...items.flatMap(i => [i.value, i.benchmark]), 100)
  
  const bars = items.map((item, index) => {
    const y = index * (barHeight * 2 + barGap) + 20
    const valueWidth = (item.value / maxValue) * chartWidth
    const benchmarkWidth = (item.benchmark / maxValue) * chartWidth
    const isAbove = item.value >= item.benchmark
    const valueColor = isAbove ? '#16a34a' : '#dc2626'
    
    return `
      <text x="0" y="${y + 15}" font-size="11" fill="#475569">${item.label}</text>
      <rect x="${labelWidth}" y="${y}" width="${benchmarkWidth}" height="${barHeight}" fill="#94a3b8" rx="3"/>
      <rect x="${labelWidth}" y="${y + barHeight + 2}" width="${valueWidth}" height="${barHeight}" fill="${valueColor}" rx="3"/>
      <text x="${labelWidth + valueWidth + 5}" y="${y + barHeight + 17}" font-size="10" fill="${valueColor}">${item.value.toFixed(1)}</text>
    `
  }).join('')
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${bars}
      <text x="${labelWidth}" y="${height - 5}" font-size="9" fill="#94a3b8">■ Industry Benchmark</text>
      <text x="${labelWidth + 120}" y="${height - 5}" font-size="9" fill="#16a34a">■ Your Value (Above)</text>
      <text x="${labelWidth + 240}" y="${height - 5}" font-size="9" fill="#dc2626">■ Your Value (Below)</text>
    </svg>
  `
}

// Helper function to generate infographic icons
function generateIcon(type: string, color: string, size: number = 40): string {
  switch (type) {
    case 'production':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>`
    case 'financial':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>`
    case 'technology':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      </svg>`
    case 'sales':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`
    case 'savings':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
      </svg>`
    case 'trend':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>`
    default:
      return ''
  }
}

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

    // Get assessment with all data
    const assessment = await prisma.assessment.findUnique({
      where: { sessionCode },
      include: {
        result: true,
        respondents: true,
        responses: true,
      },
    })

    if (!assessment || !assessment?.result) {
      return NextResponse.json(
        { success: false, error: 'Assessment results not found' },
        { status: 404 }
      )
    }

    const result = assessment?.result
    const topInsights = JSON.parse(result?.topInsights ?? '[]')
    const costOpportunities = JSON.parse(result?.costOpportunities ?? '[]')
    const gapAnalysis = JSON.parse(result?.gapAnalysis ?? '[]')

    const overallScore = result?.overallScore ?? 0
    const scoreColor = overallScore >= 80 ? '#16a34a' : overallScore >= 60 ? '#d97706' : '#dc2626'
    const scoreBgColor = overallScore >= 80 ? '#dcfce7' : overallScore >= 60 ? '#fef3c7' : '#fee2e2'
    const scoreStatus = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'
    
    // Generate chart data
    const gaugeChart = generateGaugeChart(overallScore, 220)
    const radarChart = generateRadarChart({
      production: result?.productionWorkflowScore ?? 0,
      financial: result?.financialVisibilityScore ?? 0,
      technology: result?.technologyGapScore ?? 0,
      sales: result?.salesServicePeopleScore ?? 0,
    }, 280)
    
    // Prepare bar chart data from gap analysis
    const barChartItems = gapAnalysis.slice(0, 5).map((gap: any) => ({
      label: gap.metric?.replace(' %', '').substring(0, 18) || 'Metric',
      value: gap.yourValue || 0,
      benchmark: gap.benchmark || 0,
    }))
    const barChart = barChartItems.length > 0 ? generateBarChart(barChartItems, 500, 250) : ''
    
    // Calculate total potential savings
    const totalSavings = costOpportunities.reduce((sum: number, opp: any) => {
      const match = opp.estimatedSavings?.match(/\$[\d,]+/)
      if (match) {
        return sum + parseInt(match[0].replace(/[$,]/g, ''))
      }
      return sum
    }, 0)

    // Generate HTML content for PDF with enhanced visuals
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Industry Assessment - ${sessionCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.6; }
    .page { padding: 40px; page-break-after: always; min-height: 100vh; }
    .page:last-child { page-break-after: auto; }
    
    /* Header Styles */
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1e40af; }
    .logo { font-size: 32px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
    .tagline { font-size: 14px; color: #64748b; }
    .title { font-size: 28px; font-weight: bold; color: #1e293b; margin: 20px 0 10px 0; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 20px; }
    
    /* Infographic Cover Page */
    .cover-page { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%); color: white; padding: 50px; min-height: 100vh; }
    .cover-header { text-align: center; margin-bottom: 40px; }
    .cover-logo { font-size: 36px; font-weight: bold; margin-bottom: 10px; }
    .cover-title { font-size: 42px; font-weight: bold; margin: 30px 0 15px 0; }
    .cover-subtitle { font-size: 18px; opacity: 0.9; }
    
    .infographic-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 40px 0; }
    .infographic-card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 25px; color: #1e293b; }
    .infographic-card-full { grid-column: span 2; }
    .infographic-card-icon { width: 50px; height: 50px; margin-bottom: 15px; }
    .infographic-card-title { font-size: 14px; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .infographic-card-value { font-size: 48px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
    .infographic-card-label { font-size: 14px; color: #475569; }
    
    .score-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 16px; }
    .score-badge-excellent { background: #dcfce7; color: #166534; }
    .score-badge-good { background: #fef3c7; color: #92400e; }
    .score-badge-needs-improvement { background: #fee2e2; color: #991b1b; }
    
    .key-stats { display: flex; justify-content: space-around; margin: 30px 0; flex-wrap: wrap; }
    .key-stat { text-align: center; padding: 20px; }
    .key-stat-value { font-size: 36px; font-weight: bold; color: white; }
    .key-stat-label { font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    
    /* Charts Section */
    .charts-container { display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 20px; margin: 30px 0; }
    .chart-box { background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; }
    .chart-title { font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 15px; }
    
    /* Score Card */
    .score-card { background: ${scoreBgColor}; border: 3px solid ${scoreColor}; border-radius: 16px; padding: 30px; text-align: center; margin: 25px 0; }
    .score-card-header { font-size: 16px; color: #64748b; margin-bottom: 10px; }
    .score-label { font-size: 24px; font-weight: 600; color: ${scoreColor}; margin-top: 10px; }
    
    /* Section Styles */
    .section { margin: 25px 0; page-break-inside: avoid; }
    .section-title { font-size: 20px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
    .section-icon { width: 24px; height: 24px; }
    
    /* Scores Grid with Icons */
    .scores-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .score-item { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px; }
    .score-item-icon { width: 45px; height: 45px; background: #1e40af; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .score-item-content { flex: 1; }
    .score-item-title { font-size: 13px; color: #64748b; margin-bottom: 5px; }
    .score-item-value { font-size: 32px; font-weight: bold; color: #1e40af; }
    .score-item-bar { height: 6px; background: #e2e8f0; border-radius: 3px; margin-top: 8px; overflow: hidden; }
    .score-item-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #1e40af); border-radius: 3px; }
    
    /* Insight Cards */
    .insight-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .insight-item { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 18px; border-radius: 10px; border-left: 4px solid #3b82f6; display: flex; gap: 15px; }
    .insight-icon { width: 40px; height: 40px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .insight-content { flex: 1; }
    .insight-area { font-weight: 600; color: #1e40af; margin-bottom: 5px; font-size: 14px; }
    .insight-text { font-size: 13px; color: #475569; line-height: 1.5; }
    
    /* Opportunity Cards */
    .opportunity-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .opportunity-item { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 18px; border-radius: 10px; border-left: 4px solid #16a34a; display: flex; gap: 15px; align-items: center; }
    .opportunity-icon { width: 50px; height: 50px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: white; font-weight: bold; font-size: 18px; }
    .opportunity-content { flex: 1; }
    .opportunity-title { font-weight: 600; color: #166534; margin-bottom: 3px; }
    .opportunity-desc { font-size: 13px; color: #475569; }
    .opportunity-savings { font-size: 20px; font-weight: bold; color: #16a34a; text-align: right; }
    
    /* Gap Analysis Visual */
    .gap-visual { margin: 20px 0; }
    .gap-item { display: flex; align-items: center; margin: 12px 0; gap: 10px; }
    .gap-label { width: 120px; font-size: 12px; color: #475569; flex-shrink: 0; }
    .gap-bars { flex: 1; position: relative; height: 30px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }
    .gap-benchmark { position: absolute; height: 100%; background: #94a3b8; opacity: 0.5; }
    .gap-value { position: absolute; height: 100%; border-radius: 5px; }
    .gap-value-above { background: linear-gradient(90deg, #22c55e, #16a34a); }
    .gap-value-below { background: linear-gradient(90deg, #ef4444, #dc2626); }
    .gap-numbers { width: 100px; text-align: right; font-size: 11px; color: #64748b; flex-shrink: 0; }
    
    /* Table Styles */
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
    th { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 12px 10px; text-align: left; font-weight: 600; }
    td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .status-above { color: #16a34a; font-weight: 600; }
    .status-below { color: #dc2626; font-weight: 600; }
    .status-at { color: #64748b; font-weight: 600; }
    
    /* Roadmap Timeline */
    .roadmap { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 12px; margin: 20px 0; }
    .roadmap-timeline { position: relative; padding-left: 40px; }
    .roadmap-timeline::before { content: ''; position: absolute; left: 15px; top: 10px; bottom: 10px; width: 3px; background: #3b82f6; }
    .roadmap-step { position: relative; margin: 25px 0; padding: 15px; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .roadmap-step::before { content: ''; position: absolute; left: -32px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background: #3b82f6; border-radius: 50%; border: 3px solid white; }
    .roadmap-step:nth-child(1)::after { content: '1'; }
    .roadmap-step:nth-child(2)::after { content: '2'; }
    .roadmap-step:nth-child(3)::after { content: '3'; }
    .roadmap-step::after { position: absolute; left: -28px; top: 50%; transform: translateY(-50%); color: white; font-weight: bold; font-size: 12px; }
    .roadmap-title { font-weight: 600; color: #1e40af; margin-bottom: 5px; font-size: 15px; }
    .roadmap-desc { font-size: 13px; color: #475569; line-height: 1.5; }
    .roadmap-timeframe { display: inline-block; background: #3b82f6; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; margin-top: 8px; }
    
    /* Contact Section */
    .contact { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; text-align: center; color: white; margin: 30px 0; }
    .contact-title { font-size: 22px; font-weight: 600; margin-bottom: 15px; }
    .contact-info { font-size: 14px; opacity: 0.95; }
    .contact-details { display: flex; justify-content: center; gap: 40px; margin-top: 15px; flex-wrap: wrap; }
    .contact-item { display: flex; align-items: center; gap: 8px; }
    
    /* Footer */
    .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px; }
    
    /* Summary Infographic */
    .summary-box { background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border: 2px solid #eab308; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .summary-title { font-size: 18px; font-weight: bold; color: #854d0e; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
    .summary-content { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .summary-stat { text-align: center; }
    .summary-stat-value { font-size: 28px; font-weight: bold; color: #854d0e; }
    .summary-stat-label { font-size: 12px; color: #a16207; }
  </style>
</head>
<body>
  <!-- PAGE 1: INFOGRAPHIC COVER -->
  <div class="page cover-page">
    <div class="cover-header">
      <div class="cover-logo">Gimbel & Associates</div>
      <div style="font-size: 14px; opacity: 0.9;">Commercial Print Industry Consulting</div>
    </div>
    
    <div style="text-align: center;">
      <div class="cover-title">Operational Assessment Report</div>
      <div class="cover-subtitle">${assessment?.operationType || 'Print Shop'} | ${assessment?.revenueBand || 'Revenue Band'}</div>
      <div style="margin-top: 15px; font-size: 14px; opacity: 0.8;">Assessment ID: ${sessionCode} | ${new Date().toLocaleDateString()}</div>
    </div>
    
    <div class="infographic-grid">
      <div class="infographic-card infographic-card-full" style="text-align: center;">
        <div class="infographic-card-title">Overall Performance Score</div>
        <div style="display: flex; justify-content: center; align-items: center; gap: 30px; margin: 20px 0;">
          ${gaugeChart}
          <div style="text-align: left;">
            <div class="score-badge ${overallScore >= 80 ? 'score-badge-excellent' : overallScore >= 60 ? 'score-badge-good' : 'score-badge-needs-improvement'}">${scoreStatus}</div>
            <p style="font-size: 14px; color: #64748b; margin-top: 10px; max-width: 250px;">Compared to ${assessment?.operationType || 'similar'} operations in the ${assessment?.revenueBand || 'same'} revenue band.</p>
          </div>
        </div>
      </div>
      
      <div class="infographic-card">
        <div class="infographic-card-title">Production Score</div>
        <div class="infographic-card-value">${result?.productionWorkflowScore ?? 0}</div>
        <div class="infographic-card-label">Workflow Efficiency</div>
        <div style="height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 10px; overflow: hidden;">
          <div style="height: 100%; width: ${result?.productionWorkflowScore ?? 0}%; background: linear-gradient(90deg, #3b82f6, #1e40af); border-radius: 4px;"></div>
        </div>
      </div>
      
      <div class="infographic-card">
        <div class="infographic-card-title">Financial Score</div>
        <div class="infographic-card-value">${result?.financialVisibilityScore ?? 0}</div>
        <div class="infographic-card-label">Visibility & Controls</div>
        <div style="height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 10px; overflow: hidden;">
          <div style="height: 100%; width: ${result?.financialVisibilityScore ?? 0}%; background: linear-gradient(90deg, #3b82f6, #1e40af); border-radius: 4px;"></div>
        </div>
      </div>
      
      <div class="infographic-card">
        <div class="infographic-card-title">Technology Score</div>
        <div class="infographic-card-value">${result?.technologyGapScore ?? 0}</div>
        <div class="infographic-card-label">Digital Readiness</div>
        <div style="height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 10px; overflow: hidden;">
          <div style="height: 100%; width: ${result?.technologyGapScore ?? 0}%; background: linear-gradient(90deg, #3b82f6, #1e40af); border-radius: 4px;"></div>
        </div>
      </div>
      
      <div class="infographic-card">
        <div class="infographic-card-title">Sales & People Score</div>
        <div class="infographic-card-value">${result?.salesServicePeopleScore ?? 0}</div>
        <div class="infographic-card-label">Customer & Team Health</div>
        <div style="height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 10px; overflow: hidden;">
          <div style="height: 100%; width: ${result?.salesServicePeopleScore ?? 0}%; background: linear-gradient(90deg, #3b82f6, #1e40af); border-radius: 4px;"></div>
        </div>
      </div>
    </div>
    
    <div class="key-stats">
      <div class="key-stat">
        <div class="key-stat-value">${topInsights?.length || 0}</div>
        <div class="key-stat-label">Key Insights</div>
      </div>
      <div class="key-stat">
        <div class="key-stat-value">${costOpportunities?.length || 0}</div>
        <div class="key-stat-label">Opportunities</div>
      </div>
      <div class="key-stat">
        <div class="key-stat-value">${totalSavings > 0 ? '$' + totalSavings.toLocaleString() : 'TBD'}</div>
        <div class="key-stat-label">Potential Savings</div>
      </div>
      <div class="key-stat">
        <div class="key-stat-value">${gapAnalysis?.length || 0}</div>
        <div class="key-stat-label">Metrics Analyzed</div>
      </div>
    </div>
  </div>
  
  <!-- PAGE 2: DETAILED ANALYSIS -->
  <div class="page">
    <div class="header">
      <div class="logo">Gimbel & Associates</div>
      <div class="tagline">Commercial Print Industry Consulting</div>
    </div>
    
    <div class="title">Detailed Performance Analysis</div>
    <div class="subtitle">Session: ${sessionCode} | ${assessment?.operationType || 'Print Shop'} | ${assessment?.revenueBand || ''}</div>
    
    <!-- Radar Chart Section -->
    <div class="section">
      <div class="section-title">Performance Radar</div>
      <div class="charts-container">
        <div class="chart-box">
          <div class="chart-title">Functional Area Comparison</div>
          ${radarChart}
        </div>
      </div>
    </div>
    
    <!-- Score Breakdown with Visual Bars -->
    <div class="section">
      <div class="section-title">Score Breakdown by Category</div>
      <div class="scores-grid">
        <div class="score-item">
          <div class="score-item-icon">${generateIcon('production', 'white', 28)}</div>
          <div class="score-item-content">
            <div class="score-item-title">Production Workflow (20% weight)</div>
            <div class="score-item-value">${result?.productionWorkflowScore ?? 0}</div>
            <div class="score-item-bar"><div class="score-item-bar-fill" style="width: ${result?.productionWorkflowScore ?? 0}%"></div></div>
          </div>
        </div>
        <div class="score-item">
          <div class="score-item-icon">${generateIcon('financial', 'white', 28)}</div>
          <div class="score-item-content">
            <div class="score-item-title">Financial Visibility (20% weight)</div>
            <div class="score-item-value">${result?.financialVisibilityScore ?? 0}</div>
            <div class="score-item-bar"><div class="score-item-bar-fill" style="width: ${result?.financialVisibilityScore ?? 0}%"></div></div>
          </div>
        </div>
        <div class="score-item">
          <div class="score-item-icon">${generateIcon('technology', 'white', 28)}</div>
          <div class="score-item-content">
            <div class="score-item-title">Technology Gap (15% weight)</div>
            <div class="score-item-value">${result?.technologyGapScore ?? 0}</div>
            <div class="score-item-bar"><div class="score-item-bar-fill" style="width: ${result?.technologyGapScore ?? 0}%"></div></div>
          </div>
        </div>
        <div class="score-item">
          <div class="score-item-icon">${generateIcon('sales', 'white', 28)}</div>
          <div class="score-item-content">
            <div class="score-item-title">Sales & People (45% weight)</div>
            <div class="score-item-value">${result?.salesServicePeopleScore ?? 0}</div>
            <div class="score-item-bar"><div class="score-item-bar-fill" style="width: ${result?.salesServicePeopleScore ?? 0}%"></div></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Key Insights -->
    ${topInsights?.length > 0 ? `
    <div class="section">
      <div class="section-title">Key Insights</div>
      <div class="insight-grid">
        ${topInsights?.map((insight: any, idx: number) => `
          <div class="insight-item">
            <div class="insight-icon" style="color: white; font-weight: bold; font-size: 16px;">${idx + 1}</div>
            <div class="insight-content">
              <div class="insight-area">${insight?.area || 'Insight'}</div>
              <div class="insight-text">${insight?.insight || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
  
  <!-- PAGE 3: GAP ANALYSIS & OPPORTUNITIES -->
  <div class="page">
    <div class="header">
      <div class="logo">Gimbel & Associates</div>
      <div class="tagline">Commercial Print Industry Consulting</div>
    </div>
    
    <div class="title">Gap Analysis & Opportunities</div>
    
    <!-- Visual Gap Analysis -->
    ${gapAnalysis?.length > 0 ? `
    <div class="section">
      <div class="section-title">Performance vs. Industry Benchmark</div>
      <div class="gap-visual">
        ${gapAnalysis.slice(0, 6).map((gap: any) => {
          const maxVal = Math.max(gap.yourValue || 0, gap.benchmark || 0, 100)
          const benchWidth = ((gap.benchmark || 0) / maxVal) * 100
          const valueWidth = ((gap.yourValue || 0) / maxVal) * 100
          const isAbove = (gap.yourValue || 0) >= (gap.benchmark || 0)
          return `
            <div class="gap-item">
              <div class="gap-label">${(gap.metric || '').replace(' %', '').substring(0, 18)}</div>
              <div class="gap-bars">
                <div class="gap-benchmark" style="width: ${benchWidth}%"></div>
                <div class="gap-value ${isAbove ? 'gap-value-above' : 'gap-value-below'}" style="width: ${valueWidth}%"></div>
              </div>
              <div class="gap-numbers">
                <span style="color: ${isAbove ? '#16a34a' : '#dc2626'}; font-weight: 600;">${(gap.yourValue || 0).toFixed(1)}</span> 
                vs ${(gap.benchmark || 0).toFixed(1)}
              </div>
            </div>
          `
        }).join('')}
      </div>
      <div style="display: flex; gap: 20px; font-size: 11px; color: #64748b; margin-top: 10px;">
        <span>■ <span style="color: #94a3b8;">Industry Benchmark</span></span>
        <span>■ <span style="color: #16a34a;">Your Value (Meeting/Exceeding)</span></span>
        <span>■ <span style="color: #dc2626;">Your Value (Below Benchmark)</span></span>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">Detailed Gap Analysis</div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Your Value</th>
            <th>Benchmark</th>
            <th>Target</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${gapAnalysis?.map((gap: any) => `
            <tr>
              <td><strong>${gap?.metric || ''}</strong></td>
              <td>${(gap?.yourValue ?? 0).toFixed(1)}${(gap?.metric || '').includes('%') ? '%' : ''}</td>
              <td>${(gap?.benchmark ?? 0).toFixed(1)}${(gap?.metric || '').includes('%') ? '%' : ''}</td>
              <td>${(gap?.target ?? 0).toFixed(1)}${(gap?.metric || '').includes('%') ? '%' : ''}</td>
              <td class="status-${gap?.status || 'at'}">${gap?.status === 'above' ? '✓ Above' : gap?.status === 'below' ? '✗ Below' : '→ At'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}
    
    <!-- Cost Opportunities -->
    ${costOpportunities?.length > 0 ? `
    <div class="section">
      <div class="section-title">💰 Cost Saving Opportunities</div>
      <div class="opportunity-grid">
        ${costOpportunities?.map((opp: any, idx: number) => `
          <div class="opportunity-item">
            <div class="opportunity-icon">$</div>
            <div class="opportunity-content">
              <div class="opportunity-title">${opp?.area || 'Opportunity'}</div>
              <div class="opportunity-desc">${opp?.opportunity || ''}</div>
            </div>
            <div class="opportunity-savings">${opp?.estimatedSavings || 'TBD'}</div>
          </div>
        `).join('')}
      </div>
      
      ${totalSavings > 0 ? `
      <div class="summary-box" style="margin-top: 20px;">
        <div class="summary-title">📊 Total Opportunity Summary</div>
        <div class="summary-content">
          <div class="summary-stat">
            <div class="summary-stat-value">$${totalSavings.toLocaleString()}</div>
            <div class="summary-stat-label">Total Potential Annual Savings</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value">${costOpportunities?.length || 0}</div>
            <div class="summary-stat-label">Improvement Areas Identified</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value">${Math.round(totalSavings / 12).toLocaleString()}</div>
            <div class="summary-stat-label">Monthly Savings Potential</div>
          </div>
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>
  
  <!-- PAGE 4: ROADMAP & CONTACT -->
  <div class="page">
    <div class="header">
      <div class="logo">Gimbel & Associates</div>
      <div class="tagline">Commercial Print Industry Consulting</div>
    </div>
    
    <div class="title">Implementation Roadmap</div>
    
    <div class="section">
      <div class="section-title">🗺️ Your 3-Phase Transformation Journey</div>
      <div class="roadmap">
        <div class="roadmap-timeline">
          <div class="roadmap-step">
            <div class="roadmap-title">Phase 1: Quick Wins</div>
            <div class="roadmap-desc">Address immediate operational inefficiencies and implement low-hanging fruit improvements. Focus on production workflow optimization, waste reduction, and basic cost controls.</div>
            <span class="roadmap-timeframe">30-60 Days</span>
          </div>
          <div class="roadmap-step">
            <div class="roadmap-title">Phase 2: Strategic Investments</div>
            <div class="roadmap-desc">Evaluate and implement technology upgrades, process automation, and comprehensive staff training programs to close identified performance gaps.</div>
            <span class="roadmap-timeframe">60-120 Days</span>
          </div>
          <div class="roadmap-step">
            <div class="roadmap-title">Phase 3: Long-term Excellence</div>
            <div class="roadmap-desc">Establish continuous improvement frameworks, implement advanced analytics capabilities, and develop strategic planning processes for sustained competitive advantage.</div>
            <span class="roadmap-timeframe">120+ Days</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Final Summary Infographic -->
    <div class="summary-box">
      <div class="summary-title">📋 Assessment Summary at a Glance</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
        <div>
          <div style="font-size: 36px; font-weight: bold; color: ${scoreColor};">${overallScore}</div>
          <div style="font-size: 11px; color: #854d0e;">Overall Score</div>
        </div>
        <div>
          <div style="font-size: 36px; font-weight: bold; color: #854d0e;">${gapAnalysis?.filter((g: any) => g.status === 'above').length || 0}/${gapAnalysis?.length || 0}</div>
          <div style="font-size: 11px; color: #854d0e;">Metrics Above Benchmark</div>
        </div>
        <div>
          <div style="font-size: 36px; font-weight: bold; color: #854d0e;">${costOpportunities?.length || 0}</div>
          <div style="font-size: 11px; color: #854d0e;">Improvement Areas</div>
        </div>
        <div>
          <div style="font-size: 36px; font-weight: bold; color: #16a34a;">${totalSavings > 0 ? '$' + (totalSavings / 1000).toFixed(0) + 'K' : 'TBD'}</div>
          <div style="font-size: 11px; color: #854d0e;">Potential Annual Savings</div>
        </div>
      </div>
    </div>
    
    <!-- Contact Section -->
    <div class="contact">
      <div class="contact-title">Ready to Transform Your Operation?</div>
      <div class="contact-info">Let Gimbel & Associates guide you through implementing these recommendations and achieving operational excellence.</div>
      <div class="contact-details">
        <div class="contact-item">
          <span>📧</span>
          <span>consulting@gimbelassociates.com</span>
        </div>
        <div class="contact-item">
          <span>📞</span>
          <span>(555) 123-4567</span>
        </div>
        <div class="contact-item">
          <span>🌐</span>
          <span>www.gimbelassociates.com</span>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Gimbel & Associates. All rights reserved.</p>
      <p style="margin-top: 5px;">Assessment ID: ${sessionCode} | Generated: ${new Date().toLocaleString()}</p>
      <p style="margin-top: 10px; font-style: italic;">This report contains proprietary analysis based on industry benchmarks. Results are comparative and should be validated with detailed operational review.</p>
    </div>
  </div>
</body>
</html>
    `

    // Generate PDF using HTML2PDF API
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: { 
          format: 'A4',
          print_background: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px',
          },
        },
        base_url: process.env.NEXTAUTH_URL || '',
      }),
    })

    if (!createResponse.ok) {
      throw new Error('Failed to create PDF request')
    }

    const { request_id } = await createResponse.json()
    if (!request_id) {
      throw new Error('No request ID returned')
    }

    // Poll for status
    const maxAttempts = 300
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          request_id: request_id, 
          deployment_token: process.env.ABACUSAI_API_KEY 
        }),
      })

      const statusResult = await statusResponse.json()
      const status = statusResult?.status || 'FAILED'
      const pdfResult = statusResult?.result || null

      if (status === 'SUCCESS') {
        if (pdfResult && pdfResult?.result) {
          const pdfBuffer = Buffer.from(pdfResult?.result, 'base64')
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="assessment-${sessionCode}.pdf"`,
            },
          })
        } else {
          throw new Error('PDF generation completed but no result data')
        }
      } else if (status === 'FAILED') {
        const errorMsg = pdfResult?.error || 'PDF generation failed'
        throw new Error(errorMsg)
      }
      
      attempts++
    }

    throw new Error('PDF generation timed out')
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
