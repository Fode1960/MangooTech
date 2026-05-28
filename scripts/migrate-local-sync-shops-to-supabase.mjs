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
const includeDev = hasFlag('--include-dev')
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
const users = Array.isArray(db.users) ? db.users : []
const shopsAll = Array.isArray(db.shops) ? db.shops : []

const normalizeEmail = (v) => String(v || '').trim().toLowerCase()
const normalizeStatus = (v) => {
  const s = String(v || '').trim().toLowerCase()
  if (s === 'approved' || s === 'rejected' || s === 'pending' || s === 'suspended') return s
  return 'pending'
}
const isoOrNull = (v) => {
  const s = String(v || '').trim()
  if (!s) return null
  const t = Date.parse(s)
  if (!Number.isFinite(t)) return null
  return new Date(t).toISOString()
}
const pickNonEmptyString = (v) => {
  const s = String(v || '').trim()
  return s ? s : null
}

const isDevSeed = (slug, email) => {
  const s = String(slug || '').trim().toLowerCase()
  const e = normalizeEmail(email || '')
  if (!s && !e) return false
  if (e.endsWith('@local.dev')) return true
  if (e.startsWith('smoke_') || e.startsWith('test_') || e.startsWith('logo_')) return true
  if (s.includes('smoke') || s.startsWith('smoke-') || s.startsWith('boutique-smoke')) return true
  return false
}

const usersById = new Map()
for (const u of users) {
  const id = String(u?.id || '').trim()
  if (!id) continue
  usersById.set(id, u)
}

const shops = (onlyApproved ? shopsAll.filter((s) => normalizeStatus(s?.status) === 'approved') : shopsAll).slice(
  0,
  limit && Number.isFinite(limit) ? limit : undefined
)

let scanned = 0
let inserted = 0
let updated = 0
let skipped = 0
let failed = 0

for (const s of shops) {
  scanned += 1
  const slug = String(s?.slug || '').trim()
  const name = String(s?.name || '').trim()
  if (!slug || !name) {
    skipped += 1
    continue
  }

  const localUserId = String(s?.userId || '').trim()
  const localUser = localUserId ? usersById.get(localUserId) : null
  const ownerEmail = normalizeEmail(localUser?.email || '')

  if (!includeDev && isDevSeed(slug, ownerEmail)) {
    skipped += 1
    continue
  }

  const localStatus = normalizeStatus(s?.status)
  const localLogoUrl = pickNonEmptyString(s?.logo_url)
  const localCategory = pickNonEmptyString(s?.category)
  const localCreatedAt = isoOrNull(s?.createdAt)
  const localUpdatedAt = isoOrNull(s?.updatedAt)

  const { data: existing, error: existingErr } = await supabase
    .from('shops')
    .select('id,slug,name,status,logo_url,contact_email,category,settings,created_at,updated_at')
    .eq('slug', slug)
    .maybeSingle()

  if (existingErr) {
    failed += 1
    console.error(`Fetch failed for slug=${slug}: ${existingErr.message || existingErr}`)
    continue
  }

  const settingsPatch = {
    ...(existing?.settings && typeof existing.settings === 'object' ? existing.settings : {}),
    local_sync: {
      id: String(s?.id || ''),
      userId: localUserId,
      migratedAt: new Date().toISOString(),
    },
  }

  if (!existing) {
    const insertPayload = {
      name,
      slug,
      status: localStatus,
      logo_url: localLogoUrl,
      contact_email: ownerEmail || null,
      category: localCategory,
      settings: settingsPatch,
      created_at: localCreatedAt || undefined,
      updated_at: localUpdatedAt || undefined,
    }

    if (dryRun) {
      console.log(`[DRY] insert shops.slug=${slug} status=${localStatus} email=${ownerEmail || '-'}`)
      inserted += 1
      continue
    }

    const { error: insErr } = await supabase.from('shops').insert(insertPayload)
    if (insErr) {
      failed += 1
      console.error(`Insert failed for slug=${slug}: ${insErr.message || insErr}`)
      continue
    }
    inserted += 1
    continue
  }

  if (!force) {
    const existingEmail = normalizeEmail(existing?.contact_email || '')
    if (existingEmail && ownerEmail && existingEmail !== ownerEmail) {
      skipped += 1
      console.log(`[SKIP] slug=${slug} existing_email=${existingEmail} local_email=${ownerEmail}`)
      continue
    }
  }

  const patch = {}
  if (force || !String(existing?.name || '').trim()) patch.name = name
  if (force || !String(existing?.contact_email || '').trim()) patch.contact_email = ownerEmail || null
  if (force || !String(existing?.logo_url || '').trim()) patch.logo_url = localLogoUrl
  if (force || !String(existing?.category || '').trim()) patch.category = localCategory

  const existingStatus = normalizeStatus(existing?.status)
  if (force) patch.status = localStatus
  else if (existingStatus !== 'approved' && localStatus === 'approved') patch.status = 'approved'

  patch.settings = settingsPatch
  if (localUpdatedAt) patch.updated_at = localUpdatedAt

  const patchKeys = Object.keys(patch)
  if (!patchKeys.length) {
    skipped += 1
    continue
  }

  if (dryRun) {
    console.log(`[DRY] update shops.slug=${slug} keys=${patchKeys.join(',')}`)
    updated += 1
    continue
  }

  const { error: upErr } = await supabase.from('shops').update(patch).eq('id', existing.id)
  if (upErr) {
    failed += 1
    console.error(`Update failed for slug=${slug}: ${upErr.message || upErr}`)
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
      includeDev,
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
