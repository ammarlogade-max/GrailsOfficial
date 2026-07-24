import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { reportError } from './lib/reportError.ts'

// Catches errors React's own error boundary can't see — rejected promises
// and async errors that don't happen during render (e.g. a failed
// background fetch nobody awaited).
window.addEventListener('unhandledrejection', (event) => {
  reportError(event.reason?.message || String(event.reason), { stack: event.reason?.stack, component: 'unhandledrejection' });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error('Service worker registration failed:', err));
  });
}
