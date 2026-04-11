import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

if (typeof window !== 'undefined') {
  try {
    try {
      const url = new URL(window.location.href)
      if (url.hostname === 'www.mangoo.tech') {
        url.hostname = 'mangoo.tech'
        window.location.replace(url.toString())
      }
    } catch {
    }
    const w = window as any
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      }).catch(() => {})
    }
    if (w?.caches?.keys) {
      w.caches.keys().then((keys: string[]) => {
        keys.forEach((k: string) => {
          w.caches.delete(k)
        })
      }).catch(() => {})
    }
  } catch {
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
