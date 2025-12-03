// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

// Remove loading screen
const loading = document.getElementById('loading')
if (loading) {
  loading.style.display = 'none'
  document.body.classList.remove('loading')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
