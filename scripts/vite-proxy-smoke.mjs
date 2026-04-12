const base = 'http://localhost:3015'

const urls = [
  `${base}/api/boosts/pricing`,
  `${base}/api/boosts/credits-balance?email=${encodeURIComponent('vendeur-test@example.com')}`,
  `${base}/api/local-sync/localplus/vendors`,
]

for (const url of urls) {
  const r = await fetch(url)
  const txt = await r.text().catch(() => '')
  console.log(url, r.status, txt.slice(0, 120))
}

try {
  const pricing = await fetch(`${base}/api/boosts/pricing`).then((r) => r.json()).catch(() => null)
  const products = Array.isArray(pricing?.products) ? pricing.products : []
  const sponsor = products.filter((p) => p.kind === 'sponsored')
  const durs = sponsor.map((p) => p.durationHours).sort((a, b) => a - b)
  console.log('sponsored durations', durs)
} catch {
}
