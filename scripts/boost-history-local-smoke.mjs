const base = 'http://localhost:3015'
const email = 'vendeur-test@example.com'

const pricing = await fetch(`${base}/api/boosts/pricing`).then((r) => r.json())
const products = Array.isArray(pricing?.products) ? pricing.products : []
const target = { vendorId: '1776003573109', vendorKind: 'shop' }

const sponsored24 = products.find((p) => p.kind === 'sponsored' && p.durationHours === 24)
if (!sponsored24) throw new Error('Missing sponsored 24h')

await fetch(`${base}/api/boosts/credits/topup-local`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, amount_xof: 10000 }),
}).then((r) => r.json())

const buy = await fetch(`${base}/api/boosts/purchase-with-credits-local`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    ...target,
    boostKind: sponsored24.kind,
    durationHours: sponsored24.durationHours,
  }),
}).then((r) => r.json())

console.log('buy', buy?.success, buy?.balanceXof)

const qs = new URLSearchParams({ email, ...target }).toString()
const hist = await fetch(`${base}/api/boosts/my-orders-local?${qs}`).then((r) => r.json())
console.log('orders', Array.isArray(hist?.orders) ? hist.orders.length : 0)
if (Array.isArray(hist?.orders) && hist.orders[0]) console.log('last', hist.orders[0])

