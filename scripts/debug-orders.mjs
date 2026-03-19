const urls = [
  { label: 'created_unassigned', url: 'http://localhost:3045/api/orders?status=created&unassigned=1' },
  { label: 'all', url: 'http://localhost:3045/api/orders' },
]

try {
  for (const q of urls) {
    const res = await fetch(q.url)
    const data = await res.json()
    const list = Array.isArray(data?.orders) ? data.orders : []
    const by = list.reduce((acc, o) => {
      const k = String(o.status || 'unknown')
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})

    console.log('\n===', q.label, '===')
    console.log('status', res.status)
    console.log('count', data?.count)
    console.log('by_status', by)
    console.log('sample', list.slice(0, 5).map((o) => ({ id: o.id, status: o.status, region: o.region, userId: o.userId, assignedToUserId: o.assignedToUserId })))
  }
} catch (e) {
  console.error(e)
  process.exit(1)
}
