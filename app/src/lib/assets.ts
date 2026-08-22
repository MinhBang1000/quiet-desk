import type { Asset, ExchangeRate } from '../types'

export interface AssetTotals {
  total: number
  byCategory: Record<string, number>
  byCurrency: Record<string, number>
  goldSilverTotal: number
  investmentsTotal: number
  receivablesTotal: number
  payablesTotal: number
  missingRates: string[]
}

const INVESTMENT_CATEGORIES = new Set(['stock', 'etf', 'fund', 'bond', 'crypto']);
const METAL_CATEGORIES = new Set(['gold', 'silver']);

export function rateFor(currency: string, rates: ExchangeRate[], baseCurrency: string): number | null {
  if (currency === baseCurrency) return 1
  return rates.find((r) => r.currency === currency)?.rateToBase ?? null
}

/**
 * Live dashboard totals — mirrors the server's snapshot computation in
 * server/routes/assets.js's computeCurrentTotals, but stays client-side
 * since this one is meant to update instantly as you edit assets or rates,
 * not freeze at a point in time the way a saved snapshot must.
 */
export function computeAssetTotals(assets: Asset[], rates: ExchangeRate[], baseCurrency: string): AssetTotals {
  let total = 0
  const byCategory: Record<string, number> = {}
  const byCurrency: Record<string, number> = {}
  let goldSilverTotal = 0
  let investmentsTotal = 0
  let receivablesTotal = 0
  let payablesTotal = 0
  const missingRates = new Set<string>()

  for (const a of assets) {
    const signed = a.category === 'payable' ? -a.estimatedValue : a.estimatedValue
    byCurrency[a.currency] = (byCurrency[a.currency] || 0) + signed
    const rate = rateFor(a.currency, rates, baseCurrency)
    if (rate == null) {
      missingRates.add(a.currency)
      continue
    }
    const valueBase = signed * rate
    total += valueBase
    byCategory[a.category] = (byCategory[a.category] || 0) + valueBase
    if (METAL_CATEGORIES.has(a.category)) goldSilverTotal += valueBase
    if (INVESTMENT_CATEGORIES.has(a.category)) investmentsTotal += valueBase
    if (a.category === 'receivable') receivablesTotal += valueBase
    if (a.category === 'payable') payablesTotal += -valueBase // report as a positive owed amount
  }

  return { total, byCategory, byCurrency, goldSilverTotal, investmentsTotal, receivablesTotal, payablesTotal, missingRates: [...missingRates] }
}
