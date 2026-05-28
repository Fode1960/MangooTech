import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const argv = process.argv.slice(2)
const hasFlag = (name) => argv.includes(name)
const getArgValue = (name) => {
  const i = argv.indexOf(name)
  if (i === -1) return null
  return argv[i + 1] ?? null
}

const dryRun = hasFlag('--dry-run')
const force = hasFlag('--force')
const onlyApproved = hasFlag('--only-approved')
const limitRaw = getArgValue('--limit')
const limit = limitRaw ? Math.max(0, Number(limitRaw)) : null

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim()
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const dbPath = path.resolve(process.cwd(), 'server', 'data', 'local-sync.json')
const raw = fs.existsSync(dbPath) ? fs.readFileSync(dbPath, 'utf8') : ''
const parsed = raw ? JSON.parse(raw) : null
const db = parsed && typeof parsed === 'object' ? parsed : {}
const vendorsAll = Array.isArray(db.localPlusVendors) ? db.localPlusVendors : []

const normalizeEmail = (v) => String(v || '').trim().toLowerCase()
const normalizeStatus = (v) => {
  const s = String(v || '').trim().toLowerCase()
  if (s === 'approved' || s === 'rejected' || s === 'pending' || s === 'suspended') return s
  return 'pending'
}
const safeString = (v) => String(v || '').trim()
const slugify = (value) => {
  return safeString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

const providersAll = vendorsAll.filter((v) => String(v?.kind || '').trim().toLowerCase() === 'provider')
const providers = (onlyApproved ? providersAll.filter((v) => normalizeStatus(v?.approvalStatus) === 'approved') : providersAll).slice(
  0,
  limit && Number.isFinite(limit) ? limit : undefined
)

let scanned = 0
let inserted = 0
let updated = 0
let skipped = 0
let failed = 0

for (const v of providers) {
  scanned += 1
  const name = safeString(v?.name)
  let slug = slugify(v?.slug || name)
  if (!slug) slug = `provider-${Date.now()}`

  const status = normalizeStatus(v?.approvalStatus)
  const email = normalizeEmail(v?.ownerEmail || v?.email || '')
  const category = safeString(v?.category)
  const lat = Number(v?.lat)
  const lng = Number(v?.lng)

  const services = category ? [{ name: category, slug: slugify(category) || 'service' }] : []
  const zones = Number.isFinite(lat) && Number.isFinite(lng) ? [{ lat, lng }] : []
  const portfolio = [{
    type: 'localplus',
    source: {
      id: safeString(v?.id),
      live: Boolean(v?.live),
      status: safeString(v?.status),
      voicePitch: safeString(v?.voicePitch),
      voiceAudio: safeString(v?.voiceAudio),
      avatar: safeString(v?.avatar),
    },
    at: new Date().toISOString(),
  }]

  const { data: existing, error: existingErr } = await supabase
    .from('providers')
    .select('id,slug,name,status,email,services,portfolio,zones,is_visible')
    .eq('slug', slug)
    .maybeSingle()

  if (existingErr) {
    failed += 1
    console.error(`Fetch failed for providers.slug=${slug}: ${existingErr.message || existingErr}`)
    continue
  }

  const isVisible = status === 'approved'

  if (!existing) {
    const insertPayload = {
      name: name || slug,
      slug,
      status,
      is_visible: isVisible,
      email: email || null,
      services,
      zones,
      portfolio,
    }

    if (dryRun) {
      console.log(`[DRY] insert providers.slug=${slug} status=${status} email=${email || '-'}`)
      inserted += 1
      continue
    }

    const { error: insErr } = await supabase.from('providers').insert(insertPayload)
    if (insErr) {
      failed += 1
      console.error(`Insert failed for providers.slug=${slug}: ${insErr.message || insErr}`)
      continue
    }
    inserted += 1
    continue
  }

  if (!force) {
    const existingEmail = normalizeEmail(existing?.email || '')
    if (existingEmail && email && existingEmail !== email) {
      skipped += 1
      console.log(`[SKIP] providers.slug=${slug} existing_email=${existingEmail} local_email=${email}`)
      continue
    }
  }

  const patch = {}
  if (force || !safeString(existing?.name)) patch.name = name || slug
  if (force || !safeString(existing?.email)) patch.email = email || null
  if (force) patch.status = status
  else if (normalizeStatus(existing?.status) !== 'approved' && status === 'approved') patch.status = 'approved'
  if (force || existing?.is_visible !== isVisible) patch.is_visible = isVisible
  patch.services = services
  patch.zones = zones
  patch.portfolio = portfolio

  const keys = Object.keys(patch)
  if (!keys.length) {
    skipped += 1
    continue
  }

  if (dryRun) {
    console.log(`[DRY] update providers.slug=${slug} keys=${keys.join(',')}`)
    updated += 1
    continue
  }

  const { error: upErr } = await supabase.from('providers').update(patch).eq('id', existing.id)
  if (upErr) {
    failed += 1
    console.error(`Update failed for providers.slug=${slug}: ${upErr.message || upErr}`)
    continue
  }
  updated += 1
}

console.log(
  JSON.stringify(
    {
      success: failed === 0,
      dryRun,
      onlyApproved,
      scanned,
      inserted,
      updated,
      skipped,
      failed,
      sourcePath: dbPath,
    },
    null,
    2
  )
)

process.exit(failed === 0 ? 0 : 1)

