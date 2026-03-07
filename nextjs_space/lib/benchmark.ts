import fs from 'fs'
import path from 'path'

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
    
    // Parse CSV manually, skipping comment lines (lines starting with #) and empty lines
    const lines = fileContent.split('\n').filter(line => {
      const trimmed = line?.trim()
      return trimmed && !trimmed.startsWith('#')
    })
    
    if (lines.length < 2) {
      console.error('Benchmark file has insufficient data rows')
      return []
    }
    
    // First line is headers
    const headers = lines[0].split(',').map(h => h.trim())
    
    // Parse data rows
    const records: BenchmarkData[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length >= headers.length) {
        const record: any = {}
        headers.forEach((header, idx) => {
          if (header === 'OpType' || header === 'RevenueBand') {
            record[header] = values[idx]
          } else {
            const parsed = parseFloat(values[idx] || '0')
            record[header] = isNaN(parsed) ? 0 : parsed
          }
        })
        records.push(record as BenchmarkData)
      }
    }
    
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
