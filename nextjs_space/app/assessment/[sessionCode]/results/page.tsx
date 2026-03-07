'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Download, Mail, ArrowRight, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { AssessmentHeader } from '@/components/assessment-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useToast } from '@/hooks/use-toast'

export default function ResultsPage({ params }: { params: { sessionCode: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [sessionCode, setSessionCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    const code = params?.sessionCode
    setSessionCode(code || '')
    
    if (code) {
      // Calculate scores
      fetch(`/api/assessments/${code}/calculate-scores`, {
        method: 'POST',
      })
        .then(res => res.json())
        .then(data => {
          if (data?.success) {
            setResult(data?.result)
          } else {
            toast({
              title: 'Error',
              description: data?.error || 'Failed to calculate scores',
              variant: 'destructive',
            })
          }
        })
        .catch(err => {
          console.error('Failed to calculate scores:', err)
          toast({
            title: 'Error',
            description: 'Failed to calculate scores',
            variant: 'destructive',
          })
        })
        .finally(() => setIsLoading(false))
    }
  }, [params?.sessionCode, toast])

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const response = await fetch(`/api/assessments/${sessionCode}/generate-pdf`, {
        method: 'POST',
      })
      
      if (response?.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `assessment-${sessionCode}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'PDF Downloaded',
          description: 'Your assessment scorecard has been downloaded.',
        })
      } else {
        throw new Error('Failed to generate PDF')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600">Calculating your scores...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Unable to calculate assessment scores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const overallScore = result?.overallScore ?? 0
  const scoreColor = overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-amber-600' : 'text-red-600'
  const scoreBgColor = overallScore >= 80 ? 'bg-green-100' : overallScore >= 60 ? 'bg-amber-100' : 'bg-red-100'
  const scoreStatus = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'

  const radarData = [
    {
      area: 'Production',
      score: result?.productionWorkflowScore ?? 0,
    },
    {
      area: 'Financial',
      score: result?.financialVisibilityScore ?? 0,
    },
    {
      area: 'Technology',
      score: result?.technologyGapScore ?? 0,
    },
    {
      area: 'Sales & People',
      score: result?.salesServicePeopleScore ?? 0,
    },
  ]

  const topInsights = JSON.parse(result?.topInsights ?? '[]')
  const costOpportunities = JSON.parse(result?.costOpportunities ?? '[]')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <AssessmentHeader sessionCode={sessionCode} showProgress={false} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Overall Score */}
          <Card className="bg-white shadow-2xl border-2">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl text-blue-900">Assessment Complete!</CardTitle>
              <CardDescription className="text-base">Your comprehensive operational scorecard</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className={`inline-flex items-center justify-center w-40 h-40 rounded-full ${scoreBgColor} mb-4`}>
                <div className="text-center">
                  <div className={`text-5xl font-bold ${scoreColor}`}>{overallScore}</div>
                  <div className="text-sm text-slate-600 mt-1">out of 100</div>
                </div>
              </div>
              <div className={`text-2xl font-semibold ${scoreColor} mb-6`}>{scoreStatus}</div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Download PDF Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Functional Area Scores */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Functional Area Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis 
                      dataKey="area" 
                      tick={{ fontSize: 11, fill: '#475569' }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10 }}
                    />
                    <Radar 
                      name="Score" 
                      dataKey="score" 
                      stroke="#2563eb" 
                      fill="#3b82f6" 
                      fillOpacity={0.6} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Production Workflow (20%)</span>
                    <span className="font-semibold">{result?.productionWorkflowScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Financial Visibility (20%)</span>
                    <span className="font-semibold">{result?.financialVisibilityScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Technology Gap (15%)</span>
                    <span className="font-semibold">{result?.technologyGapScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Sales & People (45%)</span>
                    <span className="font-semibold">{result?.salesServicePeopleScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Top Insights</CardTitle>
                <CardDescription>Key findings from your assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topInsights?.length > 0 ? (
                  topInsights?.slice(0, 3)?.map((insight: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className={
                        insight?.impact === 'high'
                          ? 'w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0'
                          : insight?.impact === 'medium'
                          ? 'w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0'
                          : 'w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0'
                      } />
                      <div>
                        <div className="font-medium text-sm text-blue-900">{insight?.area}</div>
                        <div className="text-sm text-slate-600">{insight?.insight}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm">No significant issues identified.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cost Opportunities */}
          {costOpportunities?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Cost Saving Opportunities</CardTitle>
                <CardDescription>Potential areas for improvement and estimated savings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {costOpportunities?.map((opp: any, index: number) => (
                    <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-semibold text-green-900 mb-2">{opp?.area}</div>
                      <div className="text-sm text-slate-700 mb-2">{opp?.opportunity}</div>
                      <div className="text-lg font-bold text-green-600">{opp?.estimatedSavings}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Ready to Take Action?</CardTitle>
              <CardDescription className="text-blue-100">
                Download your comprehensive PDF scorecard with detailed gap analysis and consulting roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                variant="secondary"
                className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-6 text-lg"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Get Full PDF Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
