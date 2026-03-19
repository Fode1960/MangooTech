const base = 'http://localhost:3045'

async function json(res) {
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

async function run() {
  const create = await fetch(base + '/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'u_conc',
      note: 'test concurrence',
      delivery: {
        source: 'current',
        capturedAt: new Date().toISOString(),
        position: { latitude: 4.051056, longitude: 9.767869 },
      },
    }),
  })
  const created = await json(create)
  if (!created.ok) {
    console.log('create failed', created)
    process.exit(1)
  }

  const id = created.data?.order?.id
  if (!id) {
    console.log('missing id', created)
    process.exit(1)
  }

  const [a, b] = await Promise.all([
    fetch(base + `/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', courierId: 'courier_a' }),
    }).then(json),
    fetch(base + `/api/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', courierId: 'courier_b' }),
    }).then(json),
  ])

  console.log('start A', { ok: a.ok, status: a.status, assignedTo: a.data?.order?.assignedToUserId, error: a.data?.error })
  console.log('start B', { ok: b.ok, status: b.status, assignedTo: b.data?.order?.assignedToUserId, error: b.data?.error })
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

