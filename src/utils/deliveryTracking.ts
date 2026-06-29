export function buildPremiumDeliveryTrackingUrl(deliveryJobId: unknown): string | null {
  const jobId = String(deliveryJobId || '').trim()
  if (!jobId) return null

  try {
    const base = typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : ''
    const url = new URL('/mangoo-local.html', base || 'http://localhost')
    url.searchParams.set('track', jobId)
    url.hash = 'suivi'
    return base ? url.toString() : `${url.pathname}${url.search}${url.hash}`
  } catch {
    return `/mangoo-local.html?track=${encodeURIComponent(jobId)}#suivi`
  }
}
