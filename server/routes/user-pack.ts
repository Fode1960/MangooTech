import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { getDemoUserPack, listDemoPacks } from '../services/demoBillingStore.js'

const router = express.Router()

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim()
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim())

const parseMissingColumn = (message: string): string => {
  const msg = String(message || '')
  const m1 = msg.match(/could not find the '([^']+)' column/i)
  if (m1?.[1]) return m1[1]
  const m2 = msg.match(/column "([^"]+)" does not exist/i)
  if (m2?.[1]) return m2[1]
  const m3 = msg.match(/column\s+(?:[a-z0-9_]+\.)?([a-z0-9_]+)\s+does not exist/i)
  if (m3?.[1]) return m3[1]
  return ''
}

router.get('/current', async (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim()
    if (!userId) return res.status(400).json({ success: false, error: 'missing_user_id' })

    const demo = getDemoUserPack(userId)
    if (demo) {
      const pack = listDemoPacks().find((p) => p.id === demo.pack_id) || null
      return res.json({ success: true, mode: 'demo', userPack: demo, pack })
    }

    if (!supabase) {
      return res.json({ success: true, mode: 'offline', userPack: null, pack: null })
    }

    if (!isUuid(userId)) {
      return res.json({ success: true, mode: 'offline', userPack: null, pack: null })
    }

    let cols = [
      'id',
      'user_id',
      'pack_id',
      'status',
      'started_at',
      'expires_at',
      'start_date',
      'end_date',
      'next_billing_date',
      'created_at',
      'updated_at',
    ]

    let data: any = null
    let error: any = null
    for (let i = 0; i < 6; i++) {
      const r: any = await supabase
        .from('user_packs')
        .select(cols.join(','))
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
      data = r?.data ?? null
      error = r?.error ?? null
      if (!error) break
      const missing = parseMissingColumn(String(error?.message || ''))
      if (!missing) break
      cols = cols.filter((c) => c !== missing)
      if (!cols.length) break
    }

    if (error) {
      const msg = String(error.message || '').toLowerCase()
      const isNetwork = msg.includes('fetch failed') || msg.includes('getaddrinfo') || msg.includes('resolve')
      const isMissing =
        msg.includes('does not exist') ||
        msg.includes('relation') ||
        msg.includes('schema cache') ||
        msg.includes('could not find') ||
        msg.includes('column')
      if (isNetwork) {
        return res.json({ success: true, mode: 'offline', userPack: null, pack: null })
      }
      if (isMissing) {
        return res.json({ success: true, mode: 'offline', userPack: null, pack: null })
      }
      return res.status(500).json({ success: false, error: 'database_error', details: error.message })
    }

    const userPack = Array.isArray(data) && data.length ? data[0] : null

    let pack = null
    if (userPack?.pack_id) {
      let packCols = [
        'id',
        'name',
        'description',
        'price',
        'currency',
        'billing_period',
        'is_active',
        'sort_order',
      ]
      let packRow: any = null
      for (let i = 0; i < 6; i++) {
        const r: any = await supabase
          .from('packs')
          .select(packCols.join(','))
          .eq('id', userPack.pack_id)
          .maybeSingle()
        if (!r?.error) {
          packRow = r?.data || null
          break
        }
        const missing = parseMissingColumn(String(r?.error?.message || ''))
        if (!missing) break
        packCols = packCols.filter((c) => c !== missing)
        if (!packCols.length) break
      }
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

