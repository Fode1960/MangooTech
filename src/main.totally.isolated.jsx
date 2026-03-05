import React from 'react'
import ReactDOM from 'react-dom/client'
import AppTotallyIsolated from './AppTotallyIsolated.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppTotallyIsolated />
  </React.StrictMode>,
)