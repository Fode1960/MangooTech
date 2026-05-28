const cases = [
  {
    name: 'France (fallback attendu) ',
    from: '48.893605,2.376952',
    to: '48.903605,2.386952',
  },
  {
    name: 'Cameroun (CM)',
    from: '4.051056,9.767869',
    to: '4.052000,9.768000',
  },
  {
    name: "Côte d'Ivoire (CI)",
    from: '5.3600,-4.0083',
    to: '5.3700,-4.0000',
  },
  {
    name: 'Sénégal (SN)',
    from: '14.6928,-17.4467',
    to: '14.7000,-17.4200',
  },
]

for (const c of cases) {
  const url = `http://localhost:3045/api/routing/route?from=${encodeURIComponent(c.from)}&to=${encodeURIComponent(c.to)}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    console.log(c.name, {
      ok: res.ok,
      success: data?.success,
      region: data?.region,
      requested_source: data?.requested_source,
      source: data?.source,
      fallback: data?.fallback,
      distance_m: data?.distance_m,
    })
  } catch (e) {
    console.error(c.name, e)
    process.exit(1)
  }
}
