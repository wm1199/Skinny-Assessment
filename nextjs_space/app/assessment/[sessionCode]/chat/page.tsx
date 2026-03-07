'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, Loader2, Bot, User } from 'lucide-react'
import { AssessmentHeader } from '@/components/assessment-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const code = params?.sessionCode
    setSessionCode(code || '')
  }, [params?.sessionCode])

  useEffect(() => {
    messagesEndRef?.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input?.trim() || isLoading) return

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

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e?.target?.value)}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
            <p className="text-xs text-slate-500 mt-2">
              Complete the assessment conversation to generate your scorecard
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
