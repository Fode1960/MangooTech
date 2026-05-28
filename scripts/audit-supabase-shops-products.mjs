import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim()
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const safeString = (v) => String(v || '').trim()

const main = async () => {
  const { data: shops, error: shopsErr } = await supabase
    .from('shops')
    .select('id,slug,name,status,contact_email,email,created_at')
    .order('created_at', { ascending: false })
    .limit(2000)

  if (shopsErr) {
    console.error(shopsErr.message || shopsErr)
    process.exit(1)
  }

  const list = Array.isArray(shops) ? shops : []
  const out = []
  let failures = 0

  for (const s of list) {
    const shopId = safeString(s?.id)
    const slug = safeString(s?.slug)
    if (!shopId || !slug) continue

    const { count, error: cntErr } = await supabase
      .from('products')
      .select('id', { head: true, count: 'exact' })
      .eq('shop_id', shopId)

    if (cntErr) {
      failures += 1
      out.push({
        slug,
        name: safeString(s?.name),
        status: safeString(s?.status),
        email: safeString(s?.contact_email || s?.email),
        products_count: null,
        error: safeString(cntErr.message || cntErr),
      })
      continue
    }

    out.push({
      slug,
      name: safeString(s?.name),
      status: safeString(s?.status),
      email: safeString(s?.contact_email || s?.email),
      products_count: Number.isFinite(count) ? count : 0,
    })
  }

  out.sort((a, b) => Number(b.products_count || 0) - Number(a.products_count || 0))
  console.log(JSON.stringify({ success: failures === 0, shops: out, failures }, null, 2))
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(String(e?.message || e || 'Unknown error'))
  process.exit(1)
})

