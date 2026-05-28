const base = 'http://localhost:3045'

const fail = (msg) => {
  console.error(`SMOKE FAIL: ${msg}`)
  process.exit(1)
}

const expectOk = async (res, label) => {
  if (!res) fail(`${label}: no response`)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    fail(`${label}: HTTP ${res.status} ${text.slice(0, 500)}`)
  }
  const json = await res.json().catch(() => null)
  return json
}

const postJson = async (path, body, token) => {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => null)
  return expectOk(res, `POST ${path}`)
}

const patchJson = async (path, body) => {
  const res = await fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  return expectOk(res, `PATCH ${path}`)
}

const getJson = async (path, token) => {
  const res = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).catch(() => null)
  return expectOk(res, `GET ${path}`)
}

const run = async () => {
  const health = await fetch(`${base}/api/health`).catch(() => null)
  if (!health || !health.ok) fail('API not reachable on :3045')

  const ts = Date.now()
  const email = `smoke_${ts}@local.dev`
  const password = 'test12345'
  const slug = `smoke-shop-${ts}`

  const reg = await postJson('/api/local-sync/auth/register', { email, password, name: 'Smoke User' })
  const token = reg?.token
  if (!token) fail('local-sync register: missing token')

  const created = await postJson('/api/local-sync/shops', { name: 'Smoke Shop', category: 'general', slug }, token)
  const shop = created?.shop
  if (!shop?.id || !shop?.slug) fail('local-sync createShop: missing shop.id/slug')

  const admin = await patchJson(`/api/local-sync/admin/shops/${encodeURIComponent(shop.id)}`, { status: 'approved' })
  if (!admin?.success) fail('admin approve failed')

  const shopInfo = await getJson(`/api/local-sync/shops/${encodeURIComponent(slug)}`)
  const ownerEmail = shopInfo?.shop?.ownerEmail
  if (!ownerEmail || String(ownerEmail).toLowerCase() !== email) fail('local-sync shop ownerEmail mismatch')

  const setCredits = await postJson('/api/boosts/credits/set-dev', { email, balanceXof: 35000 })
  if (!setCredits?.success) fail('credits/set-dev failed')

  const vendorId = `local_${shop.id}`
  const purchase = await postJson('/api/boosts/purchase-with-credits-local', {
    email,
    vendorId,
    vendorKind: 'shop',
    boostKind: 'sponsored',
    durationHours: 24,
  })
  if (!purchase?.success) fail('purchase-with-credits-local failed')
  if (Number(purchase?.balanceXof) >= 35000) fail('purchase did not debit balance')

  const row = await getJson(`/api/boosts/vendor-boosts?vendorId=${encodeURIComponent(vendorId)}&vendorKind=shop`)
  if (!row?.row?.sponsored_until) fail('vendor-boosts missing sponsored_until')

  const active = await getJson('/api/boosts/vendor-boosts-active')
  const rows = Array.isArray(active?.rows) ? active.rows : []
  const hit = rows.find((r) => String(r?.vendor_id || '') === vendorId)
  if (!hit?.sponsored_until) fail('vendor-boosts-active does not include local-sync vendorId')

  const onePx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9pGJkAAAAASUVORK5CYII='
  const logo = await postJson('/api/shops/logo-upload', { slug, dataUrl: onePx })
  if (!logo?.success) fail('shops/logo-upload failed')

  const list = await getJson('/api/shops/list')
  const listHit = (Array.isArray(list?.shops) ? list.shops : []).find((s) => String(s?.slug || '') === slug)
  if (!listHit) fail('shops/list missing local-sync shop')
  if (String(listHit?.status || '') !== 'approved') fail('shops/list status not approved')
  if (!String(listHit?.logo_url || '')) fail('shops/list missing logo_url')

  console.log('SMOKE OK: local-sync approval + logo + sponsored boost + debit')
}

run().catch((e) => fail(String(e?.message || e || 'Unknown error')))

