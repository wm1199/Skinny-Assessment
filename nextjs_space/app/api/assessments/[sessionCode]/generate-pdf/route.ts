import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBenchmark } from '@/lib/benchmark'

export const dynamic = 'force-dynamic'

// Helper: Circular progress ring
function generateCircularProgress(score: number, size: number = 120, strokeWidth: number = 10): string {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#dc2626'
  
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="${strokeWidth}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" 
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" 
        transform="rotate(-90 ${size/2} ${size/2})"/>
      <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" font-size="${size * 0.28}" font-weight="700" fill="${color}">${score}</text>
    </svg>
  `
}

// Helper: Compact score card with mini bar
function generateMiniScoreCard(label: string, score: number, icon: string): string {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#dc2626'
  const bgColor = score >= 80 ? '#dcfce7' : score >= 60 ? '#fef3c7' : '#fee2e2'
  return `
    <div style="background: ${bgColor}; border-radius: 8px; padding: 12px; text-align: center; border-left: 4px solid ${color};">
      <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${label}</div>
      <div style="font-size: 28px; font-weight: 700; color: ${color}; line-height: 1;">${score}</div>
      <div style="height: 4px; background: #e5e7eb; border-radius: 2px; margin-top: 8px;">
        <div style="height: 100%; width: ${score}%; background: ${color}; border-radius: 2px;"></div>
      </div>
    </div>
  `
}

// Helper: Radar chart SVG (compact)
function generateRadarChart(scores: { production: number; financial: number; technology: number; sales: number }, size: number = 200): string {
  const cx = size / 2, cy = size / 2, maxR = size * 0.38
  const cats = [
    { name: 'Production', score: scores.production, angle: -90 },
    { name: 'Financial', score: scores.financial, angle: 0 },
    { name: 'Sales', score: scores.sales, angle: 90 },
    { name: 'Technology', score: scores.technology, angle: 180 },
  ]
  
  const grid = [25, 50, 75, 100].map(l => `<circle cx="${cx}" cy="${cy}" r="${(l/100)*maxR}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`).join('')
  const axes = cats.map(c => {
    const rad = (c.angle * Math.PI) / 180
    return `<line x1="${cx}" y1="${cy}" x2="${cx + maxR * Math.cos(rad)}" y2="${cy + maxR * Math.sin(rad)}" stroke="#cbd5e1" stroke-width="1"/>`
  }).join('')
  const labels = cats.map(c => {
    const rad = (c.angle * Math.PI) / 180
    const lx = cx + (maxR + 18) * Math.cos(rad), ly = cy + (maxR + 18) * Math.sin(rad)
    return `<text x="${lx}" y="${ly + 3}" text-anchor="middle" font-size="9" fill="#475569">${c.name}</text>`
  }).join('')
  const pts = cats.map(c => {
    const rad = (c.angle * Math.PI) / 180, r = (c.score / 100) * maxR
    return `${cx + r * Math.cos(rad)},${cy + r * Math.sin(rad)}`
  }).join(' ')
  const dots = cats.map(c => {
    const rad = (c.angle * Math.PI) / 180, r = (c.score / 100) * maxR
    return `<circle cx="${cx + r * Math.cos(rad)}" cy="${cy + r * Math.sin(rad)}" r="4" fill="#1e40af"/>`
  }).join('')
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${grid}${axes}<polygon points="${pts}" fill="rgba(59,130,246,0.25)" stroke="#3b82f6" stroke-width="2"/>${dots}${labels}</svg>`
}

// Helper: Horizontal comparison bar
function generateComparisonBar(label: string, value: number, benchmark: number, maxVal: number = 100): string {
  const vPct = Math.min((value / maxVal) * 100, 100)
  const bPct = Math.min((benchmark / maxVal) * 100, 100)
  const isAbove = value >= benchmark
  const vColor = isAbove ? '#16a34a' : '#dc2626'
  return `
    <div style="margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px;">
        <span style="color: #475569; font-weight: 500;">${label}</span>
        <span style="color: ${vColor}; font-weight: 600;">${value.toFixed(1)} vs ${benchmark.toFixed(1)}</span>
      </div>
      <div style="position: relative; height: 14px; background: #f1f5f9; border-radius: 7px;">
        <div style="position: absolute; height: 100%; width: ${bPct}%; background: #cbd5e1; border-radius: 7px;"></div>
        <div style="position: absolute; height: 100%; width: ${vPct}%; background: ${vColor}; border-radius: 7px; opacity: 0.85;"></div>
      </div>
    </div>
  `
}

// Helper: Donut chart for savings
function generateDonutChart(segments: Array<{label: string; value: number; color: string}>, size: number = 120): string {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  const cx = size / 2, cy = size / 2, r = size * 0.35, sw = size * 0.15
  let cumulativePercent = 0
  const paths = segments.map(seg => {
    const pct = seg.value / total
    const startAngle = cumulativePercent * 2 * Math.PI - Math.PI / 2
    const endAngle = (cumulativePercent + pct) * 2 * Math.PI - Math.PI / 2
    cumulativePercent += pct
    const largeArc = pct > 0.5 ? 1 : 0
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
    return `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}" fill="none" stroke="${seg.color}" stroke-width="${sw}"/>`
  }).join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}<text x="${cx}" y="${cy+4}" text-anchor="middle" font-size="12" font-weight="600" fill="#1e40af">${segments.length}</text><text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="8" fill="#64748b">Areas</text></svg>`
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
    const scoreColor = overallScore >= 80 ? '#16a34a' : overallScore >= 60 ? '#f59e0b' : '#dc2626'
    const scoreBgColor = overallScore >= 80 ? '#dcfce7' : overallScore >= 60 ? '#fef3c7' : '#fee2e2'
    const scoreStatus = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'
    
    // Generate charts
    const circularProgress = generateCircularProgress(overallScore, 100, 8)
    const radarChart = generateRadarChart({
      production: result?.productionWorkflowScore ?? 0,
      financial: result?.financialVisibilityScore ?? 0,
      technology: result?.technologyGapScore ?? 0,
      sales: result?.salesServicePeopleScore ?? 0,
    }, 180)
    
    // Calculate total potential savings
    const totalSavings = costOpportunities.reduce((sum: number, opp: any) => {
      const match = opp.estimatedSavings?.match(/\$[\d,]+/)
      if (match) {
        return sum + parseInt(match[0].replace(/[$,]/g, ''))
      }
      return sum
    }, 0)
    
    // Generate comparison bars for gap analysis
    const maxGapVal = Math.max(...gapAnalysis.map((g: any) => Math.max(g.yourValue || 0, g.benchmark || 0, 100)))
    const gapBars = gapAnalysis.slice(0, 6).map((gap: any) => 
      generateComparisonBar(
        (gap.metric || '').replace(' %', '').substring(0, 20),
        gap.yourValue || 0,
        gap.benchmark || 0,
        maxGapVal
      )
    ).join('')
    
    // Donut chart segments for savings areas
    const donutSegments = costOpportunities.slice(0, 4).map((opp: any, i: number) => ({
      label: opp.area || 'Area',
      value: parseInt((opp.estimatedSavings || '$1000').replace(/[$,K]/g, '')) || 1,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i]
    }))
    const donutChart = donutSegments.length > 0 ? generateDonutChart(donutSegments, 100) : ''

    // Generate HTML content for PDF - Letter size (8.5 x 11 inches)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Assessment - ${sessionCode}</title>
  <style>
    @page { size: letter; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; line-height: 1.4; font-size: 11px; }
    .page { width: 8.5in; height: 11in; padding: 0.4in; page-break-after: always; position: relative; overflow: hidden; }
    .page:last-child { page-break-after: auto; }
    
    /* Cover Page */
    .cover { background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%); color: white; }
    .cover-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25in; }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .brand-sub { font-size: 9px; opacity: 0.8; margin-top: 2px; }
    .session-info { text-align: right; font-size: 9px; opacity: 0.7; }
    
    .cover-main { display: flex; gap: 0.3in; margin-top: 0.15in; }
    .cover-left { flex: 1; }
    .cover-right { width: 2.6in; }
    
    .report-title { font-size: 28px; font-weight: 700; line-height: 1.15; margin-bottom: 0.12in; }
    .report-context { font-size: 11px; opacity: 0.85; margin-bottom: 0.2in; }
    
    .score-hero { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 0.2in; text-align: center; backdrop-filter: blur(10px); }
    .score-hero-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 8px; }
    .score-status { display: inline-block; padding: 4px 14px; border-radius: 20px; font-size: 10px; font-weight: 600; margin-top: 8px; }
    .status-excellent { background: #dcfce7; color: #166534; }
    .status-good { background: #fef3c7; color: #92400e; }
    .status-needs { background: #fee2e2; color: #991b1b; }
    
    .functional-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 0.2in; }
    .func-card { background: rgba(255,255,255,0.95); border-radius: 8px; padding: 12px; color: #1e293b; }
    .func-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .func-score { font-size: 26px; font-weight: 700; color: #1e40af; line-height: 1.1; }
    .func-bar { height: 4px; background: #e5e7eb; border-radius: 2px; margin-top: 6px; }
    .func-bar-fill { height: 100%; border-radius: 2px; }
    
    .metrics-row { display: flex; justify-content: space-between; background: rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 16px; margin-top: 0.18in; }
    .metric-item { text-align: center; }
    .metric-val { font-size: 18px; font-weight: 700; }
    .metric-lbl { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.75; }
    
    .insights-section { margin-top: 0.18in; }
    .section-head { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; }
    .insight-row { display: flex; gap: 8px; margin-bottom: 8px; }
    .insight-num { width: 20px; height: 20px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; flex-shrink: 0; }
    .insight-content { flex: 1; }
    .insight-area { font-size: 10px; font-weight: 600; }
    .insight-text { font-size: 9px; opacity: 0.85; line-height: 1.35; }
    
    /* Inner pages */
    .inner { background: white; }
    .inner-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e40af; padding-bottom: 8px; margin-bottom: 0.18in; }
    .inner-brand { font-size: 16px; font-weight: 700; color: #1e40af; }
    .inner-meta { font-size: 9px; color: #64748b; }
    .page-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 0.12in; }
    
    .two-col { display: flex; gap: 0.25in; }
    .col { flex: 1; }
    .col-wide { flex: 1.2; }
    .col-narrow { flex: 0.8; }
    
    .card { background: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .card-title { font-size: 11px; font-weight: 600; color: #1e40af; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    
    .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .score-box { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
    .score-box-label { font-size: 9px; color: #64748b; margin-bottom: 4px; }
    .score-box-value { font-size: 22px; font-weight: 700; color: #1e40af; }
    .score-box-bar { height: 3px; background: #e5e7eb; border-radius: 2px; margin-top: 6px; }
    .score-box-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #1e40af); border-radius: 2px; }
    
    .gap-section { margin-top: 6px; }
    
    .opp-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 3px solid #10b981; border-radius: 6px; padding: 10px; margin-bottom: 8px; }
    .opp-header { display: flex; justify-content: space-between; align-items: center; }
    .opp-area { font-size: 10px; font-weight: 600; color: #065f46; }
    .opp-savings { font-size: 12px; font-weight: 700; color: #059669; }
    .opp-desc { font-size: 9px; color: #475569; margin-top: 4px; line-height: 1.35; }
    
    .roadmap-box { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 8px; padding: 14px; }
    .roadmap-step { display: flex; gap: 10px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #93c5fd; }
    .roadmap-step:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .step-num { width: 22px; height: 22px; background: #1e40af; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { font-size: 10px; font-weight: 600; color: #1e40af; }
    .step-desc { font-size: 9px; color: #475569; line-height: 1.35; margin-top: 2px; }
    .step-time { display: inline-block; background: #3b82f6; color: white; padding: 2px 8px; border-radius: 10px; font-size: 8px; margin-top: 4px; }
    
    .summary-strip { background: linear-gradient(135deg, #fefce8, #fef9c3); border: 1px solid #facc15; border-radius: 8px; padding: 12px; display: flex; justify-content: space-around; text-align: center; margin-top: 0.15in; }
    .sum-item { }
    .sum-val { font-size: 18px; font-weight: 700; color: #854d0e; }
    .sum-lbl { font-size: 8px; text-transform: uppercase; color: #a16207; }
    
    .contact-bar { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; border-radius: 8px; padding: 14px 20px; margin-top: 0.15in; display: flex; justify-content: space-between; align-items: center; }
    .contact-cta { font-size: 12px; font-weight: 600; }
    .contact-items { display: flex; gap: 24px; font-size: 9px; }
    
    .footer { position: absolute; bottom: 0.3in; left: 0.4in; right: 0.4in; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #1e40af; color: white; padding: 8px 6px; text-align: left; font-weight: 600; }
    td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .status-above { color: #16a34a; font-weight: 600; }
    .status-below { color: #dc2626; font-weight: 600; }
    .status-at { color: #64748b; }
  </style>
</head>
<body>
  <!-- PAGE 1: EXECUTIVE SUMMARY COVER -->
  <div class="page cover">
    <div class="cover-header">
      <div>
        <div class="brand">Gimbel & Associates</div>
        <div class="brand-sub">Commercial Print Industry Consulting</div>
      </div>
      <div class="session-info">
        Assessment ID: ${sessionCode}<br/>
        ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
    
    <div class="cover-main">
      <div class="cover-left">
        <div class="report-title">Operational Assessment Report</div>
        <div class="report-context">
          <strong>${assessment?.operationType || 'Commercial Print'}</strong> operation in the <strong>${assessment?.revenueBand || '$5M-$10M'}</strong> revenue segment${assessment?.numEmployees ? ` with ${assessment.numEmployees} employees` : ''}.
        </div>
        
        <div class="functional-grid">
          <div class="func-card">
            <div class="func-label">Production Workflow</div>
            <div class="func-score">${result?.productionWorkflowScore ?? 0}</div>
            <div class="func-bar"><div class="func-bar-fill" style="width: ${result?.productionWorkflowScore ?? 0}%; background: ${(result?.productionWorkflowScore ?? 0) >= 60 ? '#16a34a' : '#dc2626'};"></div></div>
          </div>
          <div class="func-card">
            <div class="func-label">Financial Visibility</div>
            <div class="func-score">${result?.financialVisibilityScore ?? 0}</div>
            <div class="func-bar"><div class="func-bar-fill" style="width: ${result?.financialVisibilityScore ?? 0}%; background: ${(result?.financialVisibilityScore ?? 0) >= 60 ? '#16a34a' : '#dc2626'};"></div></div>
          </div>
          <div class="func-card">
            <div class="func-label">Technology Readiness</div>
            <div class="func-score">${result?.technologyGapScore ?? 0}</div>
            <div class="func-bar"><div class="func-bar-fill" style="width: ${result?.technologyGapScore ?? 0}%; background: ${(result?.technologyGapScore ?? 0) >= 60 ? '#16a34a' : '#dc2626'};"></div></div>
          </div>
          <div class="func-card">
            <div class="func-label">Sales & People</div>
            <div class="func-score">${result?.salesServicePeopleScore ?? 0}</div>
            <div class="func-bar"><div class="func-bar-fill" style="width: ${result?.salesServicePeopleScore ?? 0}%; background: ${(result?.salesServicePeopleScore ?? 0) >= 60 ? '#16a34a' : '#dc2626'};"></div></div>
          </div>
        </div>
        
        <div class="metrics-row">
          <div class="metric-item">
            <div class="metric-val">${topInsights?.length || 0}</div>
            <div class="metric-lbl">Key Insights</div>
          </div>
          <div class="metric-item">
            <div class="metric-val">${costOpportunities?.length || 0}</div>
            <div class="metric-lbl">Opportunities</div>
          </div>
          <div class="metric-item">
            <div class="metric-val">${totalSavings > 0 ? '$' + (totalSavings >= 1000 ? Math.round(totalSavings/1000) + 'K' : totalSavings) : 'TBD'}</div>
            <div class="metric-lbl">Est. Savings</div>
          </div>
          <div class="metric-item">
            <div class="metric-val">${gapAnalysis?.length || 0}</div>
            <div class="metric-lbl">Metrics</div>
          </div>
        </div>
        
        ${topInsights?.length > 0 ? `
        <div class="insights-section">
          <div class="section-head">Key Findings</div>
          ${topInsights.slice(0, 3).map((insight: any, idx: number) => `
            <div class="insight-row">
              <div class="insight-num">${idx + 1}</div>
              <div class="insight-content">
                <div class="insight-area">${insight?.area || 'Insight'}</div>
                <div class="insight-text">${(insight?.insight || '').substring(0, 120)}${(insight?.insight || '').length > 120 ? '...' : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
      
      <div class="cover-right">
        <div class="score-hero">
          <div class="score-hero-label">Overall Performance Score</div>
          ${circularProgress}
          <div class="score-status ${overallScore >= 80 ? 'status-excellent' : overallScore >= 60 ? 'status-good' : 'status-needs'}">${scoreStatus}</div>
        </div>
        
        <div style="background: rgba(255,255,255,0.95); border-radius: 8px; padding: 12px; margin-top: 12px; color: #1e293b;">
          <div style="font-size: 10px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">Performance Radar</div>
          <div style="text-align: center;">${radarChart}</div>
        </div>
      </div>
    </div>
    
    <div class="footer" style="color: rgba(255,255,255,0.6); border-top-color: rgba(255,255,255,0.2);">
      © ${new Date().getFullYear()} Gimbel & Associates | Confidential Assessment Report | Page 1
    </div>
  </div>
  
  <!-- PAGE 2: DETAILED ANALYSIS -->
  <div class="page inner">
    <div class="inner-header">
      <div class="inner-brand">Gimbel & Associates</div>
      <div class="inner-meta">${sessionCode} | ${assessment?.operationType || 'Print Shop'}</div>
    </div>
    
    <div class="page-title">Performance Analysis & Gap Assessment</div>
    
    <div class="two-col">
      <div class="col">
        <div class="card">
          <div class="card-title">Score Breakdown by Category</div>
          <div class="score-grid">
            <div class="score-box">
              <div class="score-box-label">Production (20%)</div>
              <div class="score-box-value">${result?.productionWorkflowScore ?? 0}</div>
              <div class="score-box-bar"><div class="score-box-bar-fill" style="width: ${result?.productionWorkflowScore ?? 0}%"></div></div>
            </div>
            <div class="score-box">
              <div class="score-box-label">Financial (20%)</div>
              <div class="score-box-value">${result?.financialVisibilityScore ?? 0}</div>
              <div class="score-box-bar"><div class="score-box-bar-fill" style="width: ${result?.financialVisibilityScore ?? 0}%"></div></div>
            </div>
            <div class="score-box">
              <div class="score-box-label">Technology (15%)</div>
              <div class="score-box-value">${result?.technologyGapScore ?? 0}</div>
              <div class="score-box-bar"><div class="score-box-bar-fill" style="width: ${result?.technologyGapScore ?? 0}%"></div></div>
            </div>
            <div class="score-box">
              <div class="score-box-label">Sales & People (45%)</div>
              <div class="score-box-value">${result?.salesServicePeopleScore ?? 0}</div>
              <div class="score-box-bar"><div class="score-box-bar-fill" style="width: ${result?.salesServicePeopleScore ?? 0}%"></div></div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title">Benchmark Comparison</div>
          <div class="gap-section">${gapBars}</div>
          <div style="display: flex; gap: 12px; font-size: 8px; color: #64748b; margin-top: 8px;">
            <span>■ <span style="color: #cbd5e1;">Benchmark</span></span>
            <span>■ <span style="color: #16a34a;">Above</span></span>
            <span>■ <span style="color: #dc2626;">Below</span></span>
          </div>
        </div>
      </div>
      
      <div class="col">
        ${gapAnalysis?.length > 0 ? `
        <div class="card" style="padding: 10px;">
          <div class="card-title">Detailed Gap Analysis</div>
          <table>
            <thead>
              <tr><th>Metric</th><th>Yours</th><th>Benchmark</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${gapAnalysis.slice(0, 8).map((gap: any) => `
                <tr>
                  <td>${(gap?.metric || '').substring(0, 18)}</td>
                  <td>${(gap?.yourValue ?? 0).toFixed(1)}</td>
                  <td>${(gap?.benchmark ?? 0).toFixed(1)}</td>
                  <td class="status-${gap?.status || 'at'}">${gap?.status === 'above' ? '✓' : gap?.status === 'below' ? '✗' : '–'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      </div>
    </div>
    
    <div class="footer">
      © ${new Date().getFullYear()} Gimbel & Associates | Assessment ID: ${sessionCode} | Page 2
    </div>
  </div>
  
  <!-- PAGE 3: OPPORTUNITIES & ROADMAP -->
  <div class="page inner">
    <div class="inner-header">
      <div class="inner-brand">Gimbel & Associates</div>
      <div class="inner-meta">${sessionCode} | ${assessment?.operationType || 'Print Shop'}</div>
    </div>
    
    <div class="page-title">Improvement Opportunities & Roadmap</div>
    
    <div class="two-col">
      <div class="col-wide">
        ${costOpportunities?.length > 0 ? `
        <div class="card">
          <div class="card-title">💰 Cost Saving Opportunities</div>
          ${costOpportunities.map((opp: any) => `
            <div class="opp-card">
              <div class="opp-header">
                <div class="opp-area">${opp?.area || 'Opportunity'}</div>
                <div class="opp-savings">${opp?.estimatedSavings || 'TBD'}</div>
              </div>
              <div class="opp-desc">${opp?.opportunity || ''}</div>
            </div>
          `).join('')}
          
          ${totalSavings > 0 ? `
          <div style="background: #fef9c3; border-radius: 6px; padding: 10px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 9px; color: #92400e; font-weight: 600;">TOTAL ANNUAL OPPORTUNITY</div>
            </div>
            <div style="font-size: 18px; font-weight: 700; color: #854d0e;">$${totalSavings.toLocaleString()}</div>
          </div>
          ` : ''}
        </div>
        ` : ''}
      </div>
      
      <div class="col-narrow">
        <div class="roadmap-box">
          <div style="font-size: 11px; font-weight: 600; color: #1e40af; margin-bottom: 12px;">Implementation Roadmap</div>
          
          <div class="roadmap-step">
            <div class="step-num">1</div>
            <div class="step-content">
              <div class="step-title">Quick Wins</div>
              <div class="step-desc">Address immediate inefficiencies and implement low-effort improvements.</div>
              <span class="step-time">30-60 Days</span>
            </div>
          </div>
          
          <div class="roadmap-step">
            <div class="step-num">2</div>
            <div class="step-content">
              <div class="step-title">Strategic Investments</div>
              <div class="step-desc">Technology upgrades and process automation initiatives.</div>
              <span class="step-time">60-120 Days</span>
            </div>
          </div>
          
          <div class="roadmap-step">
            <div class="step-num">3</div>
            <div class="step-content">
              <div class="step-title">Long-term Excellence</div>
              <div class="step-desc">Continuous improvement frameworks and advanced analytics.</div>
              <span class="step-time">120+ Days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="summary-strip">
      <div class="sum-item">
        <div class="sum-val" style="color: ${scoreColor};">${overallScore}</div>
        <div class="sum-lbl">Overall Score</div>
      </div>
      <div class="sum-item">
        <div class="sum-val">${gapAnalysis?.filter((g: any) => g.status === 'above').length || 0}/${gapAnalysis?.length || 0}</div>
        <div class="sum-lbl">Above Benchmark</div>
      </div>
      <div class="sum-item">
        <div class="sum-val">${costOpportunities?.length || 0}</div>
        <div class="sum-lbl">Improvement Areas</div>
      </div>
      <div class="sum-item">
        <div class="sum-val">${totalSavings > 0 ? '$' + Math.round(totalSavings/1000) + 'K' : 'TBD'}</div>
        <div class="sum-lbl">Annual Savings</div>
      </div>
    </div>
    
    <div class="contact-bar">
      <div class="contact-cta">Ready to Transform Your Operation?</div>
      <div class="contact-items">
        <span>📧 consulting@gimbelassociates.com</span>
        <span>📞 (555) 123-4567</span>
        <span>🌐 gimbelassociates.com</span>
      </div>
    </div>
    
    <div class="footer">
      © ${new Date().getFullYear()} Gimbel & Associates | This report contains proprietary analysis. | Page 3
    </div>
  </div>
</body>
</html>
    `

    // Generate PDF using HTML2PDF API with Letter size (8.5 x 11 inches)
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: { 
          format: 'Letter',
          print_background: true,
          margin: {
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px',
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
