'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart3, MessageSquare, ClipboardList, Users, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const handleStartAssessment = async (mode: 'chat' | 'form') => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/assessments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      
      const data = await response.json()
      
      if (data?.success && data?.sessionCode) {
        if (mode === 'chat') {
          router.push(`/assessment/${data.sessionCode}/chat`)
        } else {
          router.push(`/assessment/${data.sessionCode}/profile`)
        }
      }
    } catch (error) {
      console.error('Failed to create assessment:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Gimbel & Associates</h1>
              <p className="text-xs text-slate-600">Print Industry Consulting</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Comprehensive Operational Assessment
          </h2>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto">
            Transform your print shop with data-driven insights. Compare against industry benchmarks and discover opportunities for growth.
          </p>
        </motion.div>

        {/* Assessment Modes */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent hover:border-blue-200">
              <CardHeader>
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Conversational Chat</CardTitle>
                <CardDescription className="text-base">
                  Perfect for live conference calls and real-time discussions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">AI-guided conversation flow</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Natural dialogue format</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Ideal for consultant-led sessions</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleStartAssessment('chat')}
                  disabled={isCreating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                >
                  Start Chat Assessment <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="h-full hover:shadow-2xl transition-shadow duration-300 border-2 border-transparent hover:border-amber-200">
              <CardHeader>
                <div className="w-14 h-14 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <ClipboardList className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">Structured Form</CardTitle>
                <CardDescription className="text-base">
                  Complete independently at your own pace with team collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Multi-respondent capability</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Section-by-section progress tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">Invite team members by email</span>
                  </li>
                </ul>
                <Button
                  onClick={() => handleStartAssessment('form')}
                  disabled={isCreating}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg"
                >
                  Start Form Assessment <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* What You'll Get */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-xl"
        >
          <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">What You'll Receive</h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Instant Scoring</h4>
              <p className="text-sm text-slate-600">Overall score with color-coded status across 4 functional areas</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Benchmark Comparison</h4>
              <p className="text-sm text-slate-600">See how you compare to industry standards in your segment</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Professional PDF</h4>
              <p className="text-sm text-slate-600">Comprehensive scorecard with gap analysis and consulting roadmap</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ArrowRight className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Cost Opportunities</h4>
              <p className="text-sm text-slate-600">Dollar estimates for potential savings and improvements</p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
