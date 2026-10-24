import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { IS_DEMO, ensureDemoSession } from './services/demoApi'

if (IS_DEMO) ensureDemoSession()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)