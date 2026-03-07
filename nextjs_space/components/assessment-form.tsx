'use client'

import { useState } from 'react'
import { Question } from '@/lib/questions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Select from 'react-select'

interface AssessmentFormProps {
  questions: Question[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
}

export function AssessmentForm({ questions, values, onChange }: AssessmentFormProps) {
  return (
    <div className="space-y-6">
      {questions?.map((question) => (
        <div key={question?.key} className="space-y-2">
          <Label htmlFor={question?.key} className="text-base font-medium text-slate-700">
            {question?.text}
            {question?.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {question?.type === 'number' && (
            <div className="flex items-center space-x-2">
              <Input
                id={question?.key}
                type="number"
                step="0.01"
                placeholder={question?.placeholder}
                value={values?.[question?.key] ?? ''}
                onChange={(e) => onChange(question?.key, e?.target?.value)}
                className="flex-1"
              />
              {question?.unit && (
                <span className="text-slate-600 text-sm">{question?.unit}</span>
              )}
            </div>
          )}
          
          {question?.type === 'text' && (
            <Textarea
              id={question?.key}
              placeholder={question?.placeholder}
              value={values?.[question?.key] ?? ''}
              onChange={(e) => onChange(question?.key, e?.target?.value)}
              rows={3}
            />
          )}
          
          {question?.type === 'select' && (
            <Select
              id={question?.key}
              options={question?.options?.map(opt => ({ value: opt, label: opt })) ?? []}
              value={
                values?.[question?.key]
                  ? { value: values?.[question?.key], label: values?.[question?.key] }
                  : null
              }
              onChange={(selected) => onChange(question?.key, selected?.value ?? '')}
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select an option..."
              isClearable
            />
          )}
          
          {question?.type === 'multiselect' && (
            <Select
              id={question?.key}
              isMulti
              options={question?.options?.map(opt => ({ value: opt, label: opt })) ?? []}
              value={
                Array.isArray(values?.[question?.key])
                  ? values?.[question?.key]?.map((val: string) => ({ value: val, label: val }))
                  : []
              }
              onChange={(selected) => 
                onChange(question?.key, selected?.map((s: any) => s?.value) ?? [])
              }
              className="react-select-container"
              classNamePrefix="react-select"
              placeholder="Select options..."
            />
          )}
        </div>
      ))}
    </div>
  )
}
