const email = 'vendeur-test@example.com'
const url = `http://localhost:3045/api/boosts/credits-balance?email=${encodeURIComponent(email)}`
const r = await fetch(url)
const data = await r.json().catch(() => ({}))
console.log('status', r.status, data)

