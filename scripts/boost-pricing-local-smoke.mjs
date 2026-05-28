const base = 'http://localhost:3045/api/admin/boosts'

const getJson = async (url) => {
  const r = await fetch(url, {
    headers: { Authorization: 'Bearer demo-admin' },
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const postJson = async (url, body) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer demo-admin', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const patchJson = async (url, body) => {
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer demo-admin', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const delJson = async (url) => {
  const r = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer demo-admin' },
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const me = await getJson(`${base}/me`)
console.log('me', me.status, me.data?.success)

const seeded = await postJson(`${base}/products/seed-defaults`, {})
console.log('seed', seeded.status, (seeded.data?.products || []).length)

const created = await postJson(`${base}/products`, {
  kind: 'promo',
  duration_hours: 24,
  price_xof: 1234,
  currency: 'XOF',
  title: 'Test Promo 24h',
  description: 'Test',
  active: true,
})
console.log('create', created.status, created.data?.product?.id)

const pid = created.data?.product?.id
if (!pid) process.exit(1)

const upd = await patchJson(`${base}/products/${encodeURIComponent(pid)}`, { price_xof: 4321, active: false })
console.log('patch', upd.status, upd.data?.product?.price_xof, upd.data?.product?.active)

const list = await getJson(`${base}/products`)
console.log('list', list.status, (list.data?.products || []).length)

const del = await delJson(`${base}/products/${encodeURIComponent(pid)}`)
console.log('delete', del.status, del.data?.success)

const pricing = await fetch('http://localhost:3045/api/boosts/pricing').then((r) => r.json()).catch(() => ({}))
console.log('pricing', Array.isArray(pricing?.products) ? pricing.products.length : 0)

