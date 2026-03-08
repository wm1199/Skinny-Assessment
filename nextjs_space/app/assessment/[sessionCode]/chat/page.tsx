'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, Loader2, Bot, User, Download, FileText, CheckCircle } from 'lucide-react'
import { AssessmentHeader } from '@/components/assessment-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// Detect if the AI offered to generate report and user agreed
function shouldTriggerReportGeneration(messages: Message[]): boolean {
  if (messages.length < 4) return false
  
  const lastMessages = messages.slice(-4)
  
  // Look for AI offering report generation
  const aiOfferedReport = lastMessages.some(
    (m) =>
      m.role === 'assistant' &&
      (m.content.toLowerCase().includes('generate') ||
        m.content.toLowerCase().includes('scorecard') ||
        m.content.toLowerCase().includes('report')) &&
      (m.content.toLowerCase().includes('would you like') ||
        m.content.toLowerCase().includes('shall i') ||
        m.content.toLowerCase().includes('ready to'))
  )
  
  if (!aiOfferedReport) return false
  
  // Check if user's most recent message is affirmative
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop()
  if (!lastUserMessage) return false
  
  const affirmativeResponses = [
    'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please', 'go ahead',
    'sounds good', 'let\'s do it', 'generate', 'create', 'make it',
    'absolutely', 'definitely', 'of course', 'do it', 'proceed'
  ]
  
  const userText = lastUserMessage.content.toLowerCase().trim()
  return affirmativeResponses.some((phrase) => userText.includes(phrase))
}

export default function ChatAssessment({ params }: { params: { sessionCode: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [sessionCode, setSessionCode] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm here to conduct your operational assessment. I'll ask you questions about your print shop across five key areas: Profile, Production, Financial, Technology, and Sales/People. Let's start with some basic information. What type of print operation do you run? (Digital, Offset, Wide Format, or Hybrid)",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportReady, setReportReady] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const code = params?.sessionCode
    setSessionCode(code || '')
  }, [params?.sessionCode])

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check if we should generate report after messages update
  useEffect(() => {
    if (!isLoading && !reportReady && !isGeneratingReport && messages.length > 4) {
      if (shouldTriggerReportGeneration(messages)) {
        generateReport()
      }
    }
  }, [messages, isLoading])

  const generateReport = async () => {
    setIsGeneratingReport(true)
    
    // Add a system message
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: '📊 Generating your assessment report... I\'m analyzing your responses and calculating scores against industry benchmarks.',
      },
    ])

    try {
      const response = await fetch('/api/chat/extract-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode, messages }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const result = await response.json()

      // Update with completion message
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: `✅ **Your assessment report is ready!**\n\n**Overall Score: ${result.scores.overall}**\n\n• Production Workflow: ${result.scores.production}\n• Financial Visibility: ${result.scores.financial}\n• Technology Gap: ${result.scores.technology}\n• Sales & People: ${result.scores.sales}\n\nClick the "Download Report" button below to get your complete PDF scorecard with detailed insights, benchmarks, and recommendations.`,
        }
        return newMessages
      })

      setReportReady(true)
      toast({
        title: 'Report Ready!',
        description: 'Your assessment report has been generated.',
      })
    } catch (error) {
      console.error('Error generating report:', error)
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: 'I encountered an issue generating your report. Please try again or use the structured form for a more reliable assessment.',
        }
        return newMessages
      })
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/assessments/${sessionCode}/generate-pdf`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assessment-${sessionCode}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Download Started',
        description: 'Your PDF report is downloading.',
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to download PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input?.trim() || isLoading || isGeneratingReport) return

    const userMessage = input?.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode,
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      })

      if (!response?.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response?.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader?.read() ?? {}
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk?.split('\n')

        for (const line of lines) {
          if (line?.startsWith('data: ')) {
            const data = line?.slice(6)
            if (data === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed?.choices?.[0]?.delta?.content) {
                assistantMessage += parsed?.choices?.[0]?.delta?.content
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages?.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage,
                  }
                  return newMessages
                })
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex flex-col">
      <AssessmentHeader sessionCode={sessionCode} showProgress={false} />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col">
        <div className="bg-white rounded-xl shadow-lg flex flex-col h-[calc(100vh-200px)]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages?.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex items-start space-x-3 ${
                  message?.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message?.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {message?.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`flex-1 px-4 py-3 rounded-lg ${
                    message?.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message?.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Report Ready Banner */}
          {reportReady && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t bg-gradient-to-r from-green-50 to-emerald-50 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Assessment Complete!</p>
                    <p className="text-sm text-green-600">Your PDF report is ready to download</p>
                  </div>
                </div>
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Report
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Input */}
          <div className="border-t p-4">
            {!reportReady ? (
              <>
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e?.target?.value)}
                    placeholder="Type your response..."
                    disabled={isLoading || isGeneratingReport}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || isGeneratingReport || !input?.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
                <p className="text-xs text-slate-500 mt-2">
                  {isGeneratingReport
                    ? 'Generating your assessment report...'
                    : 'Complete the assessment conversation to generate your scorecard'}
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Thank you for completing the assessment! You can also{' '}
                  <button
                    onClick={() => router.push(`/assessment/${sessionCode}/results`)}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    view your results online
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
