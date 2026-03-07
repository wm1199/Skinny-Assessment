'use client'

import { BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface AssessmentHeaderProps {
  sessionCode?: string
  showProgress?: boolean
  currentSection?: string
  completedSections?: string[]
}

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'production', label: 'Production' },
  { id: 'financial', label: 'Financial' },
  { id: 'technology', label: 'Technology' },
  { id: 'sales', label: 'Sales & People' },
]

export function AssessmentHeader({
  sessionCode,
  showProgress = true,
  currentSection,
  completedSections = [],
}: AssessmentHeaderProps) {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900">Gimbel & Associates</h1>
              <p className="text-xs text-slate-600">Assessment in Progress</p>
            </div>
          </Link>
          {sessionCode && (
            <div className="text-sm text-slate-600">
              Session: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{sessionCode}</span>
            </div>
          )}
        </div>
        
        {showProgress && (
          <div className="flex items-center space-x-2">
            {sections?.map((section, index) => (
              <div key={section?.id} className="flex items-center flex-1">
                <div
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    completedSections?.includes(section?.id)
                      ? 'bg-green-500'
                      : currentSection === section?.id
                      ? 'bg-blue-500'
                      : 'bg-slate-200'
                  }`}
                  title={section?.label}
                />
                {index < sections?.length - 1 && (
                  <div className="w-1 h-2 bg-slate-200 mx-0.5" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
