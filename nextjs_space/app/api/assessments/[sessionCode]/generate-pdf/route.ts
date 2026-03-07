import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getBenchmark } from '@/lib/benchmark'

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

    // Get assessment with all data
    const assessment = await prisma.assessment.findUnique({
      where: { sessionCode },
      include: {
        result: true,
        respondents: true,
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

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Industry Assessment - ${sessionCode}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1e40af;
    }
    
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .tagline {
      font-size: 14px;
      color: #64748b;
    }
    
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #1e293b;
      margin: 30px 0 10px 0;
    }
    
    .subtitle {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 30px;
    }
    
    .score-card {
      background: ${scoreBgColor};
      border: 2px solid ${scoreColor};
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    
    .score-number {
      font-size: 72px;
      font-weight: bold;
      color: ${scoreColor};
      margin: 20px 0;
    }
    
    .score-label {
      font-size: 24px;
      font-weight: 600;
      color: ${scoreColor};
    }
    
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .scores-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    
    .score-item {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .score-item-title {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .score-item-value {
      font-size: 36px;
      font-weight: bold;
      color: #1e40af;
    }
    
    .insight-item {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 4px solid #3b82f6;
    }
    
    .insight-area {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .insight-text {
      font-size: 14px;
      color: #475569;
    }
    
    .opportunity-item {
      background: #dcfce7;
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 4px solid #16a34a;
    }
    
    .opportunity-title {
      font-weight: 600;
      color: #166534;
      margin-bottom: 5px;
    }
    
    .opportunity-desc {
      font-size: 14px;
      color: #475569;
      margin-bottom: 8px;
    }
    
    .opportunity-savings {
      font-size: 18px;
      font-weight: bold;
      color: #16a34a;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th {
      background: #1e40af;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
    }
    
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .status-above {
      color: #16a34a;
      font-weight: 600;
    }
    
    .status-below {
      color: #dc2626;
      font-weight: 600;
    }
    
    .status-at {
      color: #64748b;
      font-weight: 600;
    }
    
    .roadmap {
      background: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border: 2px solid #3b82f6;
    }
    
    .roadmap-step {
      margin: 15px 0;
      padding-left: 30px;
      position: relative;
    }
    
    .roadmap-step::before {
      content: "";
      position: absolute;
      left: 0;
      top: 5px;
      width: 20px;
      height: 20px;
      background: #3b82f6;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    
    .roadmap-step:nth-child(1)::before { content: "1"; }
    .roadmap-step:nth-child(2)::before { content: "2"; }
    .roadmap-step:nth-child(3)::before { content: "3"; }
    
    .roadmap-title {
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 5px;
    }
    
    .roadmap-desc {
      font-size: 14px;
      color: #475569;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    
    .contact {
      margin-top: 30px;
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    
    .contact-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .contact-info {
      font-size: 14px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Gimbel & Associates</div>
    <div class="tagline">Commercial Print Industry Consulting</div>
  </div>
  
  <div class="title">Operational Assessment Scorecard</div>
  <div class="subtitle">Session: ${sessionCode} | Date: ${new Date().toLocaleDateString()}</div>
  
  <!-- Overall Score -->
  <div class="score-card">
    <div>Overall Assessment Score</div>
    <div class="score-number">${overallScore}</div>
    <div>out of 100</div>
    <div class="score-label">${scoreStatus}</div>
  </div>
  
  <!-- Executive Summary -->
  <div class="section">
    <div class="section-title">Executive Summary</div>
    <p>This comprehensive operational assessment evaluates your print shop across four critical functional areas: Production Workflow (20%), Financial Visibility (20%), Technology Gap (15%), and Sales/Service/People (45%). Your overall score of <strong>${overallScore}</strong> places you in the "${scoreStatus}" category when compared to industry benchmarks for ${assessment?.operationType} operations in the ${assessment?.revenueBand} revenue band.</p>
  </div>
  
  <!-- Functional Area Scores -->
  <div class="section">
    <div class="section-title">Functional Area Breakdown</div>
    <div class="scores-grid">
      <div class="score-item">
        <div class="score-item-title">Production Workflow (20%)</div>
        <div class="score-item-value">${result?.productionWorkflowScore}</div>
      </div>
      <div class="score-item">
        <div class="score-item-title">Financial Visibility (20%)</div>
        <div class="score-item-value">${result?.financialVisibilityScore}</div>
      </div>
      <div class="score-item">
        <div class="score-item-title">Technology Gap (15%)</div>
        <div class="score-item-value">${result?.technologyGapScore}</div>
      </div>
      <div class="score-item">
        <div class="score-item-title">Sales & People (45%)</div>
        <div class="score-item-value">${result?.salesServicePeopleScore}</div>
      </div>
    </div>
  </div>
  
  <!-- Top Insights -->
  ${topInsights?.length > 0 ? `
  <div class="section">
    <div class="section-title">Key Insights</div>
    ${topInsights?.map((insight: any) => `
      <div class="insight-item">
        <div class="insight-area">${insight?.area}</div>
        <div class="insight-text">${insight?.insight}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <!-- Gap Analysis Table -->
  ${gapAnalysis?.length > 0 ? `
  <div class="section">
    <div class="section-title">Gap Analysis</div>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Your Value</th>
          <th>Industry Benchmark</th>
          <th>Target Goal</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${gapAnalysis?.map((gap: any) => `
          <tr>
            <td>${gap?.metric}</td>
            <td>${gap?.yourValue?.toFixed(1)}${gap?.metric?.includes('%') ? '%' : ''}</td>
            <td>${gap?.benchmark?.toFixed(1)}${gap?.metric?.includes('%') ? '%' : ''}</td>
            <td>${gap?.target?.toFixed(1)}${gap?.metric?.includes('%') ? '%' : ''}</td>
            <td class="status-${gap?.status}">${gap?.status === 'above' ? '↑ Above' : gap?.status === 'below' ? '↓ Below' : '→ At'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}
  
  <!-- Cost Opportunities -->
  ${costOpportunities?.length > 0 ? `
  <div class="section">
    <div class="section-title">Cost Saving Opportunities</div>
    ${costOpportunities?.map((opp: any) => `
      <div class="opportunity-item">
        <div class="opportunity-title">${opp?.area}</div>
        <div class="opportunity-desc">${opp?.opportunity}</div>
        <div class="opportunity-savings">${opp?.estimatedSavings}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <!-- Consulting Roadmap -->
  <div class="section">
    <div class="section-title">3-Step Consulting Roadmap</div>
    <div class="roadmap">
      <div class="roadmap-step">
        <div class="roadmap-title">Phase 1: Quick Wins (30-60 days)</div>
        <div class="roadmap-desc">Address immediate operational inefficiencies and implement low-hanging fruit improvements in production workflow and cost management.</div>
      </div>
      <div class="roadmap-step">
        <div class="roadmap-title">Phase 2: Strategic Investments (60-120 days)</div>
        <div class="roadmap-desc">Evaluate and implement technology upgrades, process automation, and staff training programs to close identified gaps.</div>
      </div>
      <div class="roadmap-step">
        <div class="roadmap-title">Phase 3: Long-term Excellence (120+ days)</div>
        <div class="roadmap-desc">Establish continuous improvement frameworks, advanced analytics, and strategic planning processes for sustained competitive advantage.</div>
      </div>
    </div>
  </div>
  
  <!-- Contact Information -->
  <div class="contact">
    <div class="contact-title">Ready to Transform Your Operation?</div>
    <div class="contact-info">
      <p>Contact Gimbel & Associates to discuss how we can help you implement these recommendations.</p>
      <p><strong>Email:</strong> consulting@gimbelassociates.com | <strong>Phone:</strong> (555) 123-4567</p>
    </div>
  </div>
  
  <div class="footer">
    © ${new Date().getFullYear()} Gimbel & Associates. All rights reserved. | Assessment ID: ${sessionCode}
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
