export interface Question {
  key: string
  text: string
  type: 'number' | 'text' | 'select' | 'multiselect'
  options?: string[]
  placeholder?: string
  unit?: string
  required?: boolean
}

export interface Section {
  id: string
  title: string
  description: string
  questions: Question[]
}

export const assessmentSections: Section[] = [
  {
    id: 'profile',
    title: 'Profile & Setup',
    description: 'Tell us about your operation',
    questions: [
      {
        key: 'operationType',
        text: 'What type of operation do you run?',
        type: 'select',
        options: ['Digital Print', 'Offset Print', 'Wide Format', 'Hybrid'],
        required: true,
      },
      {
        key: 'revenueBand',
        text: 'What is your annual revenue range?',
        type: 'select',
        options: ['$1M-$5M', '$5M-$10M', '$10M-$25M', '$25M+'],
        required: true,
      },
      {
        key: 'numEmployees',
        text: 'How many employees do you have?',
        type: 'number',
        placeholder: 'Enter number of employees',
        required: true,
      },
      {
        key: 'primaryMarkets',
        text: 'What are your primary markets served?',
        type: 'multiselect',
        options: [
          'Commercial Printing',
          'Packaging',
          'Direct Mail',
          'Marketing Collateral',
          'Publishing',
          'Labels',
          'Signage',
          'Other',
        ],
        required: true,
      },
      {
        key: 'yearsFounded',
        text: 'How many years has your business been operating?',
        type: 'number',
        placeholder: 'Years in business',
        required: false,
      },
      {
        key: 'geographicReach',
        text: 'What is your geographic reach?',
        type: 'select',
        options: ['Local (single city)', 'Regional (state)', 'National', 'International'],
        required: false,
      },
    ],
  },
  {
    id: 'production',
    title: 'Production Workflow',
    description: 'Evaluate your production efficiency',
    questions: [
      {
        key: 'laborCostPct',
        text: 'What is your labor cost as a percentage of revenue?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: true,
      },
      {
        key: 'materialWastePct',
        text: 'What is your material waste percentage?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: true,
      },
      {
        key: 'onTimeDeliveryPct',
        text: 'What is your on-time delivery rate?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: true,
      },
      {
        key: 'productionBottlenecks',
        text: 'Describe your main production bottlenecks',
        type: 'text',
        placeholder: 'E.g., prepress delays, equipment downtime, staffing issues',
        required: false,
      },
      {
        key: 'qualityControlProcess',
        text: 'What quality control processes do you have in place?',
        type: 'multiselect',
        options: [
          'Color management system',
          'Automated inspection',
          'Manual spot checks',
          'Customer approval process',
          'ISO certification',
          'None',
        ],
        required: false,
      },
      {
        key: 'equipmentAge',
        text: 'What is the average age of your primary production equipment?',
        type: 'select',
        options: ['0-3 years', '4-7 years', '8-10 years', '10+ years'],
        required: false,
      },
      {
        key: 'productionCapacityUtilization',
        text: 'What is your average production capacity utilization?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: false,
      },
      {
        key: 'shiftStructure',
        text: 'What is your shift structure?',
        type: 'select',
        options: ['Single shift', 'Two shifts', 'Three shifts', '24/7 operation'],
        required: false,
      },
    ],
  },
  {
    id: 'financial',
    title: 'Financial Visibility',
    description: 'Assess your financial tracking and reporting',
    questions: [
      {
        key: 'grossMarginPct',
        text: 'What is your gross margin percentage?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: true,
      },
      {
        key: 'jobProfitabilityTracking',
        text: 'How do you track job profitability?',
        type: 'select',
        options: [
          'Real-time job costing system',
          'Post-job analysis',
          'Monthly aggregated reports',
          'Quarterly review',
          'No formal tracking',
        ],
        required: true,
      },
      {
        key: 'financialReportingFrequency',
        text: 'How frequently do you review financial reports?',
        type: 'select',
        options: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
        required: true,
      },
      {
        key: 'costAccountingMethod',
        text: 'What cost accounting practices do you use?',
        type: 'multiselect',
        options: [
          'Activity-based costing',
          'Standard costing',
          'Job order costing',
          'Process costing',
          'No formal method',
        ],
        required: false,
      },
      {
        key: 'budgetVarianceTracking',
        text: 'Do you track budget variances?',
        type: 'select',
        options: ['Yes, monthly', 'Yes, quarterly', 'Yes, annually', 'No'],
        required: false,
      },
      {
        key: 'cashFlowManagement',
        text: 'How would you rate your cash flow management?',
        type: 'select',
        options: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
        required: false,
      },
    ],
  },
  {
    id: 'technology',
    title: 'Technology Gap',
    description: 'Evaluate your technology infrastructure',
    questions: [
      {
        key: 'misErpSystem',
        text: 'What MIS/ERP system do you currently use?',
        type: 'select',
        options: [
          'PrintSmith Vision',
          'Avanti Slingshot',
          'EFI Pace',
          'Tharstern',
          'Custom/In-house',
          'Spreadsheets',
          'None',
        ],
        required: true,
      },
      {
        key: 'misAdoptionScore',
        text: 'How would you rate your MIS adoption and usage?',
        type: 'number',
        placeholder: 'Rate from 1 (minimal) to 10 (fully integrated)',
        required: true,
      },
      {
        key: 'automationLevel',
        text: 'What is your automation level for key processes?',
        type: 'number',
        placeholder: 'Rate from 1 (all manual) to 10 (fully automated)',
        required: true,
      },
      {
        key: 'digitalWorkflowIntegration',
        text: 'Which digital workflow tools are integrated?',
        type: 'multiselect',
        options: [
          'Web-to-print',
          'Automated estimating',
          'Digital asset management',
          'Prepress automation',
          'Production scheduling',
          'Shipping integration',
          'None',
        ],
        required: false,
      },
      {
        key: 'technologyInvestmentPlans',
        text: 'What are your technology investment plans for the next 12 months?',
        type: 'multiselect',
        options: [
          'New production equipment',
          'MIS/ERP upgrade',
          'Automation software',
          'Cloud migration',
          'Cybersecurity improvements',
          'No planned investments',
        ],
        required: false,
      },
      {
        key: 'itSupport',
        text: 'What IT support structure do you have?',
        type: 'select',
        options: [
          'In-house IT team',
          'Outsourced IT support',
          'Equipment vendor support only',
          'No formal IT support',
        ],
        required: false,
      },
    ],
  },
  {
    id: 'sales',
    title: 'Sales, Service & People',
    description: 'Review your customer relationships and team',
    questions: [
      {
        key: 'customerRetentionPct',
        text: 'What is your customer retention rate?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: true,
      },
      {
        key: 'employeeTurnoverPct',
        text: 'What is your employee turnover rate?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: true,
      },
      {
        key: 'salesGrowthPct',
        text: 'What was your sales growth rate last year?',
        type: 'number',
        placeholder: 'Enter percentage (can be negative)',
        unit: '%',
        required: true,
      },
      {
        key: 'customerServicePractices',
        text: 'What customer service practices do you have?',
        type: 'multiselect',
        options: [
          'Dedicated account managers',
          'Customer portal',
          'Online order tracking',
          'Proactive communication',
          'Customer satisfaction surveys',
          'None',
        ],
        required: false,
      },
      {
        key: 'employeeTrainingPrograms',
        text: 'What employee training programs do you offer?',
        type: 'multiselect',
        options: [
          'Technical skills training',
          'Safety training',
          'Leadership development',
          'Cross-training',
          'Vendor certification programs',
          'None',
        ],
        required: false,
      },
      {
        key: 'salesTeamStructure',
        text: 'How is your sales team structured?',
        type: 'select',
        options: [
          'Inside sales only',
          'Outside sales only',
          'Hybrid inside/outside',
          'Owner-led sales',
          'No dedicated sales team',
        ],
        required: false,
      },
      {
        key: 'marketingStrategy',
        text: 'What marketing strategies do you employ?',
        type: 'multiselect',
        options: [
          'Digital marketing',
          'Trade shows',
          'Email campaigns',
          'Social media',
          'Referral programs',
          'None',
        ],
        required: false,
      },
      {
        key: 'customerConcentration',
        text: 'What percentage of revenue comes from your top 5 customers?',
        type: 'number',
        placeholder: 'Enter percentage',
        unit: '%',
        required: false,
      },
    ],
  },
]

export const getSectionById = (id: string): Section | undefined => {
  return assessmentSections.find(section => section.id === id)
}

export const getQuestionByKey = (sectionId: string, questionKey: string): Question | undefined => {
  const section = getSectionById(sectionId)
  return section?.questions?.find(q => q.key === questionKey)
}
