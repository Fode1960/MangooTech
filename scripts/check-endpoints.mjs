const urls = [
  'https://mangoo.tech/api/health',
  'https://mangoo.tech/api/health.ts',
  'https://mangoo.tech/api/shops/list',
  'https://mangoo.tech/api/shops/list.ts',
  'https://mangoo.tech/api/shops/list.js',
  'https://mangoo.tech/api/shops-list',
  'https://mangoo.tech/api/shops-list.js',
  'https://www.mangoo.tech/api/health',
  'https://www.mangoo.tech/api/health.ts',
  'https://www.mangoo.tech/api/shops/list',
  'https://www.mangoo.tech/api/shops/list.ts',
  'https://www.mangoo.tech/api/shops/list.js',
  'https://www.mangoo.tech/api/shops-list',
  'https://www.mangoo.tech/api/shops-list.js',
]

for (const url of urls) {
  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
      },
      redirect: 'manual',
    })
    const ct = res.headers.get('content-type')
    const vercelId = res.headers.get('x-vercel-id')
    const matched = res.headers.get('x-matched-path')
    const cache = res.headers.get('x-vercel-cache')
    const location = res.headers.get('location')
    const body = await res.text()
    const bodyStart = body.slice(0, 180).replace(/\s+/g, ' ').trim()
    console.log('---')
    console.log(url)
    console.log('status', res.status)
    if (location) console.log('location', location)
    console.log('content-type', ct)
    if (matched) console.log('x-matched-path', matched)
    if (cache) console.log('x-vercel-cache', cache)
    if (vercelId) console.log('x-vercel-id', vercelId)
    console.log('bodyStart', bodyStart)
  } catch (e) {
    console.log('---')
    console.log(url)
    console.log('error', String(e?.message || e))
  }
}
