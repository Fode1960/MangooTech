import express from 'express'
import fs from 'fs'
import path from 'path'

const router = express.Router()

type PricingFeePolicy = {
  rate?: number
  fixedCfa?: number
}

type PricingPolicyConfig = {
  version?: number
  commissionRateByCountry?: Record<string, number>
  feeByCountryMethod?: Record<string, Record<string, PricingFeePolicy | number>>
}

const DEFAULT_PRICING_POLICY_CONFIG: PricingPolicyConfig = {
  version: 1,
  commissionRateByCountry: { sn: 0.05, cm: 0.05, ci: 0.05, default: 0.05 },
  feeByCountryMethod: {
    sn: {
      wave: { rate: 0.01, fixedCfa: 0 },
      orange_money: { rate: 0.015, fixedCfa: 0 },
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
    cm: {
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      orange_money: { rate: 0.015, fixedCfa: 0 },
      wave: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
    ci: {
      orange_money: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      wave: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
    default: {
      orange_money: { rate: 0.015, fixedCfa: 0 },
      mtn_momo: { rate: 0.015, fixedCfa: 0 },
      wave: { rate: 0.015, fixedCfa: 0 },
      moov_money: { rate: 0.015, fixedCfa: 0 },
      free_mobile: { rate: 0.015, fixedCfa: 0 },
      _default: { rate: 0.015, fixedCfa: 0 },
    },
  },
}

const STORE_PATH = path.resolve(process.cwd(), 'server', 'data', 'pricing-policy.json')

function readConfig(): PricingPolicyConfig {
  try {
    if (!fs.existsSync(STORE_PATH)) return DEFAULT_PRICING_POLICY_CONFIG
    const raw = fs.readFileSync(STORE_PATH, 'utf8')
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return DEFAULT_PRICING_POLICY_CONFIG
    return parsed as PricingPolicyConfig
  } catch {
    return DEFAULT_PRICING_POLICY_CONFIG
  }
}

router.get('/', (req, res) => {
  const cfg = readConfig()
  res.json({ success: true, data: cfg })
})

export default router
