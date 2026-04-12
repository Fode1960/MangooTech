const adminBase = 'http://localhost:3045/api/admin/boosts'
const boostsBase = 'http://localhost:3045/api/boosts'

const postJson = async (url, body) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer demo-admin', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const getJson = async (url) => {
  const r = await fetch(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer demo-admin' },
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

await postJson(`${adminBase}/products/seed-defaults`, {})

const vendorId = '1776003573109'
const vendorKind = 'shop'
const ownerEmail = 'logique@exemple.com'

await postJson(`${adminBase}/credits/grant`, { user_id: ownerEmail, amount_xof: 20000, description: 'Seed credits' })
const balance1 = await getJson(`${adminBase}/credits/balance?user_id=${encodeURIComponent(ownerEmail)}`)
console.log('balance before', balance1.status, balance1.data?.balanceXof)

const act = await postJson(`${adminBase}/vendor-boosts/activate`, {
  vendor_id: vendorId,
  vendor_kind: vendorKind,
  boost_kind: 'sponsored',
  duration_hours: 12,
  sponsored_tier: 'bronze',
})
console.log('activate', act.status, act.data?.success, act.data?.row?.sponsored_until)

const balance2 = await getJson(`${adminBase}/credits/balance?user_id=${encodeURIComponent(ownerEmail)}`)
console.log('balance after', balance2.status, balance2.data?.balanceXof)

const active = await fetch(`${boostsBase}/vendor-boosts-active`).then((r) => r.json()).catch(() => ({}))
console.log('active rows', Array.isArray(active?.rows) ? active.rows.length : 0)

