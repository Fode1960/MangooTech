import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

const url = String(process.env.SUPABASE_URL || '').trim()
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim()

if (!url || !anon) {
  console.log('missing_supabase_env')
  process.exit(0)
}

const supabase = createClient(url, anon, { auth: { persistSession: false } })

const email = 'vendor@example.com'
const password = 'vendor123'

const auth = await supabase.auth.signInWithPassword({ email, password })
if (auth?.error || !auth?.data?.session?.access_token) {
  console.log('signin_failed')
  process.exit(0)
}

const token = auth.data.session.access_token

const orClause = `owner_email.eq.${email},email.eq.${email}`
const shopRes = await supabase
  .from('shops')
  .select('slug')
  .or(orClause)
  .order('created_at', { ascending: false })
  .limit(1)

const slug = shopRes?.data?.[0]?.slug
if (!slug) {
  console.log('no_shop_for_user')
  process.exit(0)
}

const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3ZK0YAAAAASUVORK5CYII='

const up = await fetch('http://localhost:3045/api/shops/logo-upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ slug, dataUrl: tinyPng }),
})
const upJson = await up.json().catch(() => null)
console.log('logo_upload', up.status, Boolean(upJson?.success), Boolean(upJson?.logo_url))

const upd = await fetch('http://localhost:3045/api/shops/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ slug, category: 'tech' }),
})
const updJson = await upd.json().catch(() => null)
console.log('update', upd.status, Boolean(updJson?.success))

const list = await fetch('http://localhost:3045/api/shops/list')
const listJson = await list.json().catch(() => null)
const found = (Array.isArray(listJson?.shops) ? listJson.shops : []).find((s) => String(s?.slug || '') === String(slug))
console.log('list_has_logo_url', Boolean(found?.logo_url), 'category', found?.category || null)

