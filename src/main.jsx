import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { BrowserRouter } from 'react-router-dom'

const root = document.getElementById('root')
if (!root) throw new Error('Élément #root introuvable')

try {
  window.__mangootech_main_started__ = Date.now()
} catch {
}

try {
  const fallback = document.getElementById('boot-fallback')
  if (fallback) fallback.remove()
} catch {
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)

try {
  requestAnimationFrame(() => {
    try {
      window.__mangootech_app_rendered__ = Date.now()
    } catch {
    }
  })
} catch {
}
