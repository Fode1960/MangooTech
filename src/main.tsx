import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

const App = lazy(() => import('./App'))

try {
  // eslint-disable-next-line no-undef
  window.__mangoo_main_loaded = true
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
