import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim()
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const safeString = (v) => String(v || '').trim()
const safeLower = (v) => safeString(v).toLowerCase()

const isMissingTable = (msg) => {
  const m = safeLower(msg)
  if (!m.includes('connect_plus_entries')) return false
  return m.includes('does not exist') || m.includes('relation') || m.includes('schema cache')
}

const randomPin = (len = 6) => {
  const digits = Math.max(4, Math.min(6, Math.floor(Number(len || 4))))
  const max = 10 ** digits
  const n = crypto.randomInt(0, max)
  return String(n).padStart(digits, '0')
}

const randomToken = () => crypto.randomBytes(16).toString('hex')

async function fetchAllShopSlugs() {
  const slugs = []
  let from = 0
  const pageSize = 1000

  for (;;) {
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('shops')
      .select('slug')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(String(error.message || error))

    const batch = Array.isArray(data) ? data : []
    for (const row of batch) {
      const slug = safeLower(row?.slug)
      if (slug) slugs.push(slug)
    }

    if (batch.length < pageSize) break
    from += pageSize
  }

  return Array.from(new Set(slugs))
}

async function getActiveEntries(shopSlug) {
  const { data, error } = await supabase
    .from('connect_plus_entries')
    .select('id,pin,shop_slug,is_active,expires_at,created_at')
    .eq('shop_slug', shopSlug)
    .eq('is_active', true)

  if (error) {
    if (isMissingTable(String(error.message || error))) {
      throw new Error('Missing connect_plus_entries table. Apply the migration first.')
    }
    throw new Error(String(error.message || error))
  }

  return Array.isArray(data) ? data : []
}

async function deactivateOtherEntries(shopSlug, keepId) {
  const { error } = await supabase
    .from('connect_plus_entries')
    .update({ is_active: false })
    .eq('shop_slug', shopSlug)
    .eq('is_active', true)
    .neq('id', keepId)

  if (error) throw new Error(String(error.message || error))
}

async function insertEntry(shopSlug, preferredPinLen = 6) {
  const start = Math.max(4, Math.min(6, Math.floor(Number(preferredPinLen || 4))))
  for (let pinLen = start; pinLen <= 6; pinLen += 1) {
    const attemptsForLen = pinLen === 4 ? 60 : pinLen === 5 ? 40 : 25
    for (let i = 0; i < attemptsForLen; i += 1) {
      const pin = randomPin(pinLen)
      const token = randomToken()
      const { data, error } = await supabase
        .from('connect_plus_entries')
        .insert({ shop_slug: shopSlug, pin, token, is_active: true, expires_at: null })
        .select('id,shop_slug,pin,token')
        .single()

      if (!error) return data

      const msg = safeLower(error.message || error)
      const isUnique = msg.includes('duplicate key') || msg.includes('unique') || msg.includes('idx_connect_plus_entries')
      if (isUnique) continue
      if (isMissingTable(msg)) throw new Error('Missing connect_plus_entries table. Apply the migration first.')
      throw new Error(String(error.message || error))
    }
  }

  throw new Error(`Unable to generate unique entry for ${shopSlug}`)
}

const main = async () => {
  const slugs = await fetchAllShopSlugs()
  let created = 0
  let upgraded = 0
  let skipped = 0
  let failures = 0
  const errors = []

  for (const slug of slugs) {
    try {
      const entries = await getActiveEntries(slug)
      const compliant = entries.find((row) => String(row?.pin || '').replace(/[^\d]/g, '').length === 6)
      if (compliant) {
        skipped += 1
        continue
      }

      const inserted = await insertEntry(slug, 6)
      await deactivateOtherEntries(slug, inserted?.id)

      if (entries.length > 0) upgraded += 1
      else created += 1
    } catch (e) {
      failures += 1
      errors.push({ slug, error: String(e?.message || e || 'Unknown error') })
    }
  }

  console.log(JSON.stringify({ success: failures === 0, totalShops: slugs.length, created, upgraded, skipped, failures, errors }, null, 2))
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(String(e?.message || e || 'Unknown error'))
  process.exit(1)
})
