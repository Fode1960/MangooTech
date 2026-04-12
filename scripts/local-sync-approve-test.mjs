const base = 'http://localhost:3045/api/local-sync'

const getJson = async (url) => {
  const r = await fetch(url)
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const patchJson = async (url, body) => {
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const all1 = await getJson(`${base}/shops`)
const list1 = Array.isArray(all1.data?.shops) ? all1.data.shops : []
const target = list1.find((s) => String(s?.slug || '') === 'boutique-logique')

console.log('Before:', target?.slug, target?.id, target?.status)

if (!target?.id) {
  console.log('Target not found')
  process.exit(1)
}

const upd = await patchJson(`${base}/admin/shops/${encodeURIComponent(String(target.id))}`, { status: 'approved' })
console.log('Patch:', upd.status, upd.data?.shop?.status)

const all2 = await getJson(`${base}/shops`)
const list2 = Array.isArray(all2.data?.shops) ? all2.data.shops : []
const target2 = list2.find((s) => String(s?.slug || '') === 'boutique-logique')
console.log('After:', target2?.slug, target2?.id, target2?.status)

