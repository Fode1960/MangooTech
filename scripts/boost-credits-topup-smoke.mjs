const url = 'http://localhost:3045/api/boosts/credits/topup-local'

const r = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'vendeur-test@example.com', amount_xof: 2000 }),
})

const data = await r.json().catch(() => ({}))
console.log(r.status, data)

