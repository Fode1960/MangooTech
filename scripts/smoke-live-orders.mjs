const base = process.env.LIVE_ORDERS_BASE || 'http://localhost:3045'

async function j(url, init) {
  const res = await fetch(url, init)
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  return { ok: res.ok, status: res.status, data }
}

async function waitForServer() {
  const start = Date.now()
  while (Date.now() - start < 10_000) {
    try {
      const r = await j(`${base}/api/health`)
      if (r.ok && r.data?.success) return
    } catch {
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`server_not_ready: ${base}`)
}

async function main() {
  await waitForServer()

  const roomId = `smoke_${Date.now()}`
  const create1 = await j(`${base}/api/live-orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId,
      shopSlug: 'demo-shop',
      shopName: 'Demo Shop',
      shopCountry: 'Senegal',
      product: { id: 'p1', title: 'Produit test', priceCfa: 1000, imageUrl: '' },
      qty: 2,
      buyerId: 'anonymous',
      buyerName: 'Client',
    }),
  })
  if (!create1.ok || !create1.data?.success) throw new Error(`create_failed: ${JSON.stringify(create1)}`)
  const orderId = String(create1.data.order.id || '')
  if (!orderId) throw new Error('missing_order_id')

  const markBeforePay = await j(`${base}/api/live-orders/${encodeURIComponent(orderId)}/mark-delivered`, { method: 'POST' })
  if (markBeforePay.status !== 409 || markBeforePay.data?.error !== 'not_paid') {
    throw new Error(`expected_not_paid: ${JSON.stringify(markBeforePay)}`)
  }

  const setPay = await j(`${base}/api/live-orders/${encodeURIComponent(orderId)}/set-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'mobile_money',
      method: 'wave',
      status: 'succeeded',
      paymentId: `pay_${Date.now()}`,
      transactionId: `tx_${Date.now()}`,
      currency: 'XOF',
      amount: 2000,
      paidAt: new Date().toISOString(),
    }),
  })
  if (!setPay.ok || !setPay.data?.success) throw new Error(`set_payment_failed: ${JSON.stringify(setPay)}`)

  const markAfterPay = await j(`${base}/api/live-orders/${encodeURIComponent(orderId)}/mark-delivered`, { method: 'POST' })
  if (!markAfterPay.ok || !markAfterPay.data?.success) throw new Error(`mark_delivered_failed: ${JSON.stringify(markAfterPay)}`)

  const confirm = await j(`${base}/api/live-orders/${encodeURIComponent(orderId)}/confirm-received`, { method: 'POST' })
  if (!confirm.ok || !confirm.data?.success) throw new Error(`confirm_failed: ${JSON.stringify(confirm)}`)

  const list = await j(`${base}/api/live-orders/by-room/${encodeURIComponent(roomId)}`)
  if (!list.ok || !list.data?.success) throw new Error(`list_failed: ${JSON.stringify(list)}`)
  const orders = Array.isArray(list.data.orders) ? list.data.orders : []
  const got = orders.find((o) => String(o?.id || '') === orderId)
  if (!got || got.status !== 'escrow_released') throw new Error(`bad_final_status: ${JSON.stringify(got)}`)

  console.log('OK', { roomId, orderId, status: got.status })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

