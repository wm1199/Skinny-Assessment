import fs from 'fs'
import path from 'path'
import { parse } from 'csv/sync'

export interface BenchmarkData {
  OpType: string
  RevenueBand: string
  AvgLaborCostPct: number
  AvgMaterialWastePct: number
  AvgOnTimeDeliveryPct: number
  AvgGrossMarginPct: number
  AvgJobProfitabilityScore: number
  AvgMISAdoptionScore: number
  AvgAutomationScore: number
  AvgCustomerRetentionPct: number
  AvgEmployeeTurnoverPct: number
  AvgSalesGrowthPct: number
}

let cachedBenchmarks: BenchmarkData[] | null = null

export function loadBenchmarks(): BenchmarkData[] {
  if (cachedBenchmarks) {
    return cachedBenchmarks
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'print_industry_benchmarks.csv')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    // Parse CSV, skipping comment lines
    const lines = fileContent.split('\n').filter(line => !line?.startsWith('#') && line?.trim())
    const csvContent = lines?.join('\n')
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        // Convert numeric columns to numbers
        if (context?.column !== 'OpType' && context?.column !== 'RevenueBand') {
          return parseFloat(value || '0')
        }
        return value
      },
    })
    
    cachedBenchmarks = records
    return records
  } catch (error) {
    console.error('Error loading benchmarks:', error)
    return []
  }
}

export function getBenchmark(
  operationType: string,
  revenueBand: string
): BenchmarkData | null {
  const benchmarks = loadBenchmarks()
  
  const benchmark = benchmarks?.find(
    b => b?.OpType === operationType && b?.RevenueBand === revenueBand
  )
  
  return benchmark || null
}

export function calculateGap(
  userValue: number,
  benchmarkValue: number,
  lowerIsBetter: boolean = false
): {
  gap: number
  gapPercent: number
  status: 'above' | 'below' | 'at'
} {
  const gap = userValue - benchmarkValue
  const gapPercent = benchmarkValue !== 0 ? (gap / benchmarkValue) * 100 : 0
  
  let status: 'above' | 'below' | 'at' = 'at'
  if (Math.abs(gap) > 0.1) {
    status = gap > 0 ? 'above' : 'below'
  }
  
  return { gap, gapPercent, status }
}
