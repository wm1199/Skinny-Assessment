import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { sessionCode, messages } = await request.json()

    if (!sessionCode || !messages) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // System prompt for the assessment conversation
    const systemPrompt = `You are an expert consultant conducting an operational assessment for a commercial print shop. Your goal is to gather information across five key areas:

1. Profile & Setup: Operation type (Digital, Offset, Wide Format, Hybrid), annual revenue range ($1M-$5M, $5M-$10M, $10M-$25M, $25M+), number of employees, and primary markets.

2. Production Workflow: Labor cost percentage, material waste percentage, on-time delivery rate, production bottlenecks, quality control processes.

3. Financial Visibility: Gross margin percentage, job profitability tracking methods, financial reporting frequency, cost accounting practices.

4. Technology Gap: Current MIS/ERP system, MIS adoption score (1-10), automation level (1-10), digital workflow integration.

5. Sales/Service/People: Customer retention rate, employee turnover rate, sales growth rate, customer service practices, employee training programs.

Conduct the conversation naturally, asking one or two questions at a time. Be conversational, empathetic, and professional. When you have gathered sufficient information across all five areas, summarize the key data points and ask if the user would like to generate their assessment scorecard.

Keep responses concise (2-3 sentences) and focused on gathering specific data points.`

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response?.ok) {
      throw new Error('Failed to get LLM response')
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response?.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()

        try {
          while (true) {
            const { done, value } = await reader?.read() ?? {}
            if (done) break
            const chunk = decoder.decode(value)
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}
