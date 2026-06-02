import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialize theme from localStorage (light/dark)
const initTheme = () => {
  try {
    const t = localStorage.getItem('theme');
    if (t === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
  } catch (e) {
    // ignore
  }
};

initTheme();
