const payload = {
  userId: 'test-user-1',
  consentGiven: true,
  consentTimestamp: new Date().toISOString(),
  locationData: {
    latitude: 4.051056,
    longitude: 9.767869,
    accuracy: 42,
    timestamp: new Date().toISOString(),
  },
}

try {
  const create = await fetch('http://localhost:3045/api/geolocation/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const created = await create.json()
  console.log('create', { ok: create.ok, ...created })

  const get = await fetch('http://localhost:3045/api/geolocation/consent/test-user-1')
  const got = await get.json()
  console.log('get', { ok: get.ok, ...got })
} catch (e) {
  console.error(e)
  process.exit(1)
}

