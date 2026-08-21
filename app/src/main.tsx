import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { AuthGate } from './components/AuthGate.tsx'
import { PortfolioPublicView } from './views/PortfolioPublicView.tsx'

const publicMatch = window.location.pathname.match(/^\/p\/([^/]+)\/?$/)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {publicMatch ? (
      <PortfolioPublicView token={publicMatch[1]} />
    ) : (
      <AuthGate>
        <App />
      </AuthGate>
    )}
  </StrictMode>,
)
