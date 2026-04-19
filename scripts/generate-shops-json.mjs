import { createClient } from '@supabase/supabase-js'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const safeString = (v) => String(v ?? '').trim()

const parseMissingColumn = (message) => {
  const msg = String(message || '')
  const m1 = msg.match(/could not find the '([^']+)' column/)
  if (m1?.[1]) return m1[1]
  const m2 = msg.match(/column "([^"]+)" does not exist/)
  if (m2?.[1]) return m2[1]
  return ''
}

const main = async () => {
  const url = safeString(process.env.SUPABASE_URL)
  const key = safeString(process.env.SUPABASE_SERVICE_ROLE_KEY)

  const outPath = path.join(process.cwd(), 'dist', 'api', 'shops', 'list')
  await mkdir(path.dirname(outPath), { recursive: true })

  if (!url || !key) {
    await writeFile(outPath, JSON.stringify({ success: false, shops: [], error: 'missing_supabase_env' }))
    return
  }

  const supabase = createClient(url, key)

  const baseCols = [
    'id',
    'name',
    'slug',
    'category',
    'status',
    'owner_email',
    'owner_name',
    'email',
    'logo_url',
    'city',
    'country',
    'created_at',
    'updated_at',
  ]

  let cols = baseCols.slice()
  let lastError = null
  for (let i = 0; i < 8; i++) {
    const r = await supabase
      .from('shops')
      .select(cols.join(','))
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    if (!r?.error) {
      await writeFile(outPath, JSON.stringify({ success: true, shops: Array.isArray(r?.data) ? r.data : [] }))
      return
    }
    lastError = r.error
    const missing = parseMissingColumn(String(r.error.message || ''))
    if (!missing) break
    cols = cols.filter((c) => c !== missing)
    if (!cols.length) break
  }

  await writeFile(outPath, JSON.stringify({ success: false, shops: [], error: String(lastError?.message || 'server_error') }))
}

main().catch(async (e) => {
  const outPath = path.join(process.cwd(), 'dist', 'api', 'shops', 'list')
  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, JSON.stringify({ success: false, shops: [], error: String(e?.message || e || 'server_error') }))
  process.exitCode = 0
})
