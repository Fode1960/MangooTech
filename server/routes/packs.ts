import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { listDemoPacks } from '../services/demoBillingStore.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

router.get('/', async (req, res) => {
  try {
    if (String(req.query?.source || '').toLowerCase() === 'demo') {
      return res.json({ success: true, packs: listDemoPacks(), demo: true })
    }

    const { data, error } = await supabase
      .from('packs')
      .select('id,name,description,price,currency,billing_period,is_popular,is_active,sort_order,created_at,updated_at')
      .order('sort_order', { ascending: true })

    if (error) {
      const msg = String(error.message || '').toLowerCase()
      const shouldFallback = msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('resolve')
      if (shouldFallback) {
        return res.json({ success: true, packs: listDemoPacks(), demo: true })
      }
      return res.status(500).json({ success: false, error: 'database_error', details: error.message })
    }

    res.json({ success: true, packs: data || [] })
  } catch (e: any) {
    const msg = String(e?.message || '').toLowerCase()
    const shouldFallback = msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('resolve')
    if (shouldFallback) {
      return res.json({ success: true, packs: listDemoPacks(), demo: true })
    }
    res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

export default router
