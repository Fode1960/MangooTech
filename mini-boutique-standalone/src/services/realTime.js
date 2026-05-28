export function connectRealTime({ onMessage }) {
  let closed = false
  // En développement, basculer directement en mode simulation pour éviter les erreurs WS/SSE
  if (import.meta.env && import.meta.env.DEV) {
    return simulate()
  }
  const trySSE = () => {
    try {
      const es = new EventSource('/api/events')
      es.onmessage = (e) => {
        if (closed) return
        try { onMessage(JSON.parse(e.data)) } catch {}
      }
      es.onerror = () => { es.close(); tryWS() }
      return { close: () => { closed = true; es.close() } }
    } catch { return tryWS() }
  }
  const tryWS = () => {
    try {
      const ws = new WebSocket('ws://localhost:3001/ws')
      ws.onmessage = (e) => {
        if (closed) return
        try { onMessage(JSON.parse(e.data)) } catch {}
      }
      ws.onerror = () => { ws.close(); simulate() }
      return { close: () => { closed = true; ws.close() } }
    } catch { return simulate() }
  }
  const simulate = () => {
    const i = setInterval(() => {
      if (closed) return
      const samples = [
        { type: 'order', title: 'Nouvelle commande', data: { total: Math.round(Math.random()*100)+20 } },
        { type: 'stock_low', title: 'Stock faible', data: { product: 'Produit', remaining: Math.floor(Math.random()*3)+1 } }
      ]
      onMessage(samples[Math.floor(Math.random()*samples.length)])
    }, 30000)
    return { close: () => { closed = true; clearInterval(i) } }
  }
  return trySSE()
}