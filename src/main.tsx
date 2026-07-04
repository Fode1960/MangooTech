import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

const App = lazy(() => import('./App'))

try {
  // eslint-disable-next-line no-undef
  window.__mangoo_main_loaded = true
  // eslint-disable-next-line no-undef
  window.__mangootech_main_started__ = Date.now()
} catch {
}

const syncAppHeight = () => {
  try {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
  } catch {
  }
}

syncAppHeight()
window.addEventListener('resize', syncAppHeight)
window.addEventListener('orientationchange', syncAppHeight)

try {
  const fallback = document.getElementById('boot-fallback')
  if (fallback) fallback.remove()
} catch {
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

requestAnimationFrame(() => {
  try {
    window.__mangootech_app_rendered__ = Date.now()
  } catch {
  }
})
