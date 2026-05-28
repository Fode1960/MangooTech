export function getRealtimeHost(): string {
  const envHost = String(import.meta.env.VITE_REALTIME_HOST || '').trim()
  if (envHost) return envHost
  try {
    return String(window.location.hostname || '').trim() || 'localhost'
  } catch {
    return 'localhost'
  }
}

export function getWsProtocol(): 'ws' | 'wss' {
  const forced = String(import.meta.env.VITE_REALTIME_WS_PROTOCOL || '').trim().toLowerCase()
  if (forced === 'ws' || forced === 'wss') return forced
  try {
    return window.location.protocol === 'https:' ? 'wss' : 'ws'
  } catch {
    return 'ws'
  }
}

export function getHttpProtocol(): 'http' | 'https' {
  const forced = String(import.meta.env.VITE_REALTIME_HTTP_PROTOCOL || '').trim().toLowerCase()
  if (forced === 'http' || forced === 'https') return forced
  try {
    return window.location.protocol === 'https:' ? 'https' : 'http'
  } catch {
    return 'http'
  }
}

export function getWsUrl(port: number, path = ''): string {
  const host = getRealtimeHost()
  const proto = getWsProtocol()
  const p = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`
  const suffix = path ? p : ''
  if (port <= 0) {
    try {
      const originHost = String(window.location.host || '').trim()
      if (originHost) return `${proto}://${originHost}${suffix}`
    } catch {}
    return `${proto}://${host}${suffix}`
  }
  return `${proto}://${host}:${port}${suffix}`
}

export function getHttpUrl(port: number, path = ''): string {
  const host = getRealtimeHost()
  const proto = getHttpProtocol()
  const p = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`
  const suffix = path ? p : ''
  if (port <= 0) {
    try {
      const originHost = String(window.location.host || '').trim()
      if (originHost) return `${proto}://${originHost}${suffix}`
    } catch {}
    return `${proto}://${host}${suffix}`
  }
  return `${proto}://${host}:${port}${suffix}`
}
