import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// In production, API lives at /admin_backend/api/
// In dev, Vite proxy handles /api/ -> localhost
if (import.meta.env.PROD) {
  axios.defaults.baseURL = '/admin_backend';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
