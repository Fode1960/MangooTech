const base = 'http://localhost:3045/api/local-sync/localplus/vendors'

const getJson = async (url) => {
  const r = await fetch(url)
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const postJson = async (url, body) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const before = await getJson(base)
console.log('Before:', before.status, Array.isArray(before.data?.vendors) ? before.data.vendors.length : 0)

const vendor = {
  id: `lp_${Date.now()}`,
  kind: 'shop',
  name: 'Local+ Smoke',
  category: 'general',
  lat: 4.0511,
  lng: 9.7679,
  status: 'open',
  live: false,
  voicePitch: 'Test',
  voiceAudio: null,
  avatar: '',
  approvalStatus: 'approved',
}

const created = await postJson(base, { vendor })
console.log('Post:', created.status, created.data?.vendor?.id)

const after = await getJson(base)
console.log('After:', after.status, Array.isArray(after.data?.vendors) ? after.data.vendors.length : 0)

