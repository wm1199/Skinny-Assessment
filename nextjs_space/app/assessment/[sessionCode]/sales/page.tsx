'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { AssessmentHeader } from '@/components/assessment-header'
import { AssessmentForm } from '@/components/assessment-form'
import { Button } from '@/components/ui/button'
import { assessmentSections } from '@/lib/questions'
import { useToast } from '@/hooks/use-toast'

export default function SalesSection({ params }: { params: { sessionCode: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [sessionCode, setSessionCode] = useState<string>('')
  const [values, setValues] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completedSections, setCompletedSections] = useState<string[]>([])
  
  const section = assessmentSections?.[4]

  useEffect(() => {
    const code = params?.sessionCode
    setSessionCode(code || '')
    
    if (code) {
      fetch(`/api/assessments/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data?.success) {
            const completed = data?.assessment?.sectionProgress
              ?.filter((sp: any) => sp?.isCompleted)
              ?.map((sp: any) => sp?.section) ?? []
            setCompletedSections(completed)
          }
        })
        .catch(err => console.error('Failed to fetch assessment:', err))
    }
  }, [params?.sessionCode])

  const handleChange = (key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    const requiredQuestions = section?.questions?.filter(q => q?.required) ?? []
    const missingFields = requiredQuestions?.filter(q => !values?.[q?.key])
    
    if (missingFields?.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields before continuing.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const responses = section?.questions?.map(q => ({
        key: q?.key,
        text: q?.text,
        value: values?.[q?.key],
        type: q?.type,
      })) ?? []

      // Submit this final section
      const response = await fetch(`/api/assessments/${sessionCode}/submit-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: section?.id,
          responses,
          respondent: {
            name: 'Primary User',
            email: 'user@company.com',
            role: 'Sales Director',
          },
        }),
      })

      const data = await response.json()
      
      if (data?.success) {
        toast({
          title: 'Assessment Complete!',
          description: 'Generating your scorecard...',
        })
        
        // Trigger scoring calculation
        router.push(`/assessment/${sessionCode}/results`)
      } else {
        throw new Error(data?.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Error submitting section:', error)
      toast({
        title: 'Error',
        description: 'Failed to save section. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <AssessmentHeader
        sessionCode={sessionCode}
        currentSection="sales"
        completedSections={completedSections}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-3xl font-bold text-blue-900">{section?.title}</h2>
                <span className="bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full font-medium">
                  Final Section
                </span>
              </div>
              <p className="text-slate-600">{section?.description}</p>
            </div>
            
            <AssessmentForm
              questions={section?.questions ?? []}
              values={values}
              onChange={handleChange}
            />
            
            <div className="mt-8 flex justify-between">
              <Button
                onClick={() => router.push(`/assessment/${sessionCode}/technology`)}
                variant="outline"
                className="px-8 py-6 text-lg"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Technology
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    Complete Assessment
                    <CheckCircle className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
