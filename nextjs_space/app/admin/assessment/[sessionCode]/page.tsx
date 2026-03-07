'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  ArrowLeft,
  Download,
  Building2,
  Users,
  DollarSign,
  Cpu,
  TrendingUp,
  Mail,
  User,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

interface AssessmentDetail {
  id: string
  sessionCode: string
  mode: string
  status: string
  operationType: string | null
  revenueBand: string | null
  numEmployees: number | null
  primaryMarkets: string | null
  createdAt: string
  respondents: { id: string; name: string; email: string; role: string }[]
  responses: { questionKey: string; questionText: string; section: string; answerValue: string }[]
  result: {
    overallScore: number
    productionWorkflowScore: number
    financialVisibilityScore: number
    technologyGapScore: number
    salesServicePeopleScore: number
    topInsights: string
    costOpportunities: string
    gapAnalysis: string
  } | null
}

export default function AssessmentDetailPage() {
  const { data: session, status: authStatus } = useSession() || {}
  const router = useRouter()
  const params = useParams()
  const sessionCode = params?.sessionCode as string

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/admin/login')
    }
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === 'authenticated' && sessionCode) {
      fetchAssessment()
    }
  }, [authStatus, sessionCode])

  const fetchAssessment = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/assessment/${sessionCode}`)
      if (res.ok) {
        const data = await res.json()
        setAssessment(data)
      }
    } catch (error) {
      console.error('Error fetching assessment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true)
      const res = await fetch(`/api/assessments/${sessionCode}/generate-pdf`, {
        method: 'POST',
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `assessment-${sessionCode}.pdf`
        a.click()
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Assessment not found</p>
      </div>
    )
  }

  const radarData = assessment.result
    ? [
        { subject: 'Production', score: assessment.result.productionWorkflowScore, fullMark: 100 },
        { subject: 'Financial', score: assessment.result.financialVisibilityScore, fullMark: 100 },
        { subject: 'Technology', score: assessment.result.technologyGapScore, fullMark: 100 },
        { subject: 'Sales/People', score: assessment.result.salesServicePeopleScore, fullMark: 100 },
      ]
    : []

  const topInsights = assessment.result ? JSON.parse(assessment.result.topInsights || '[]') : []
  const costOpportunities = assessment.result ? JSON.parse(assessment.result.costOpportunities || '[]') : []
  const gapAnalysis = assessment.result ? JSON.parse(assessment.result.gapAnalysis || '[]') : []

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const groupedResponses: Record<string, { questionText: string; answerValue: string }[]> = {}
  assessment.responses?.forEach((r) => {
    if (!groupedResponses[r.section]) {
      groupedResponses[r.section] = []
    }
    groupedResponses[r.section].push({ questionText: r.questionText, answerValue: r.answerValue })
  })

  const sectionLabels: Record<string, string> = {
    profile: 'Profile & Setup',
    production: 'Production Workflow',
    financial: 'Financial Visibility',
    technology: 'Technology Gap',
    sales: 'Sales, Service & People',
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-4">
              {assessment.status === 'completed' && (
                <Button onClick={handleDownloadPDF} disabled={downloading}>
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? 'Generating...' : 'Download PDF Report'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Assessment Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">Assessment Details</h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    assessment.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {assessment.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
              <p className="text-slate-500 font-mono">{assessment.sessionCode}</p>
            </div>
            {assessment.result && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Overall Score</p>
                  <p className={`text-4xl font-bold ${getScoreColor(assessment.result.overallScore)}`}>
                    {assessment.result.overallScore}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full ${getScoreBg(assessment.result.overallScore)} flex items-center justify-center`}>
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Profile Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Operation Type</p>
                    <p className="font-semibold text-slate-900">{assessment.operationType || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Revenue Band</p>
                    <p className="font-semibold text-slate-900">{assessment.revenueBand || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employees</p>
                    <p className="font-semibold text-slate-900">{assessment.numEmployees || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Scores Radar Chart */}
          {assessment.result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="border-0 shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="text-base">Performance Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" fontSize={12} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Key Insights */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="border-0 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-base">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topInsights.length > 0 ? (
                    topInsights.slice(0, 4).map((insight: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-blue-600">{insight.area}</p>
                          <p className="text-sm text-slate-600">{insight.insight}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No insights available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cost Opportunities */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card className="border-0 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-base">Cost Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {costOpportunities.length > 0 ? (
                    costOpportunities.slice(0, 4).map((opp: any, i: number) => (
                      <div key={i} className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">{opp.area}</p>
                        <p className="text-xs text-green-600">{opp.estimatedSavings}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No opportunities identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Gap Analysis */}
        {gapAnalysis.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mb-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Gap Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Metric</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Your Value</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Benchmark</th>
                        <th className="text-left py-2 px-4 text-sm font-medium text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gapAnalysis.map((gap: any, i: number) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2 px-4 text-sm text-slate-700">{gap.metric}</td>
                          <td className="py-2 px-4 text-sm font-medium text-slate-900">{gap.yourValue}</td>
                          <td className="py-2 px-4 text-sm text-slate-600">{gap.benchmark}</td>
                          <td className="py-2 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                gap.status === 'above'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {gap.status === 'above' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {gap.status === 'above' ? 'Above' : 'Below'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Respondents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Respondents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessment.respondents?.length > 0 ? (
                  assessment.respondents.map((respondent, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{respondent.name || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">{respondent.email}</p>
                        {respondent.role && (
                          <p className="text-xs text-slate-400">{respondent.role}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No respondents recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Responses by Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">All Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedResponses).map(([section, responses]) => (
                  <div key={section}>
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {sectionLabels[section] || section}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {responses.map((r, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-500 mb-1">{r.questionText}</p>
                          <p className="text-sm font-medium text-slate-900">{r.answerValue || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
