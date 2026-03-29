import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { BrowserRouter } from 'react-router-dom'

console.log('Main.jsx starting...');

try {
  window.__mangootech_main_started__ = true
} catch {
}

try {
  const fallback = document.getElementById('boot-fallback')
  if (fallback) fallback.remove()
} catch {
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
