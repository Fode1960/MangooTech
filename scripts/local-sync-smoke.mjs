const res = await fetch('http://localhost:3045/api/health').catch(() => null)
if (!res) {
  console.log('Server not reachable')
  process.exit(1)
}
console.log('Health status:', res.status)

const email = `test_${Date.now()}@local.dev`
const password = 'test12345'
const name = 'Test User'

const postJson = async (url, body, token) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const getJson = async (url, token) => {
  const r = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  const data = await r.json().catch(() => ({}))
  return { status: r.status, data }
}

const reg = await postJson('http://localhost:3045/api/local-sync/auth/register', { email, password, name })
console.log('Register:', reg.status, Boolean(reg.data?.token))
const token = reg.data?.token
if (!token) process.exit(1)

const created = await postJson('http://localhost:3045/api/local-sync/shops', { name: 'Boutique Smoke', category: 'general' }, token)
console.log('Create shop:', created.status, created.data?.shop?.slug)

const mine = await getJson('http://localhost:3045/api/local-sync/shops/mine', token)
console.log('My shops:', mine.status, Array.isArray(mine.data?.shops) ? mine.data.shops.length : 0)

const all = await getJson('http://localhost:3045/api/local-sync/shops')
console.log('All shops:', all.status, Array.isArray(all.data?.shops) ? all.data.shops.length : 0)
