import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppkitProvider } from './Provider/AppkitProvider.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ContractProvider } from './Provider/ContractProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <AppkitProvider>
      <ContractProvider>
     <BrowserRouter>
    <App />
    </BrowserRouter>
    </ContractProvider>
    </AppkitProvider>
  </StrictMode>,
)
