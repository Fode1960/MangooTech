const url = 'http://localhost:3007/api/routing/route?from=48.893546,2.376986&to=48.903546,2.386986&overview=simplified&steps=0'

try {
  const res = await fetch(url)
  const text = await res.text()
  console.log({ status: res.status, ok: res.ok, len: text.length })
  console.log(text.slice(0, 200))
} catch (e) {
  console.error(e)
  process.exit(1)
}

