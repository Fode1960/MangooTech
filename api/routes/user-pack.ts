import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { getDemoUserPack, listDemoPacks } from '../services/demoBillingStore.js'

const router = express.Router()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

router.get('/current', async (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim()
    if (!userId) return res.status(400).json({ success: false, error: 'missing_user_id' })

    const demo = getDemoUserPack(userId)
    if (demo) {
      const pack = listDemoPacks().find((p) => p.id === demo.pack_id) || null
      return res.json({ success: true, mode: 'demo', userPack: demo, pack })
    }

    const { data, error } = await supabase
      .from('user_packs')
      .select('id,user_id,pack_id,status,started_at,expires_at,start_date,end_date,next_billing_date,created_at,updated_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      const msg = String(error.message || '').toLowerCase()
      const isNetwork = msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('resolve')
      if (isNetwork) {
        return res.json({ success: true, mode: 'offline', userPack: null, pack: null })
      }
      return res.status(500).json({ success: false, error: 'database_error', details: error.message })
    }

    const userPack = Array.isArray(data) && data.length ? data[0] : null

    let pack = null
    if (userPack?.pack_id) {
      const { data: packRow } = await supabase
        .from('packs')
        .select('id,name,description,price,currency,billing_period,is_active,sort_order')
        .eq('id', userPack.pack_id)
        .single()
      pack = packRow || null
    }

    return res.json({ success: true, mode: 'supabase', userPack, pack })
  } catch (e: any) {
    const msg = String(e?.message || '').toLowerCase()
    const isNetwork = msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('resolve')
    if (isNetwork) {
      return res.json({ success: true, mode: 'offline', userPack: null, pack: null })
    }
    return res.status(500).json({ success: false, error: 'internal_error', details: e?.message })
  }
})

export default router

