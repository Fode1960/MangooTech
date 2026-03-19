const createPayload = {
  userId: 'u1',
  vendorId: 'vendor_1',
  note: 'Commande démo',
  delivery: {
    source: 'current',
    capturedAt: new Date().toISOString(),
    position: {
      latitude: 48.893546,
      longitude: 2.376986,
      accuracy: 20,
    },
  },
}

try {
  const create = await fetch('http://localhost:3045/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createPayload),
  })
  const created = await create.json()
  console.log('create', { ok: create.ok, success: created?.success, id: created?.order?.id })

  const list = await fetch('http://localhost:3045/api/orders?userId=u1')
  const listed = await list.json()
  console.log('list', { ok: list.ok, count: listed?.count })
} catch (e) {
  console.error(e)
  process.exit(1)
}

