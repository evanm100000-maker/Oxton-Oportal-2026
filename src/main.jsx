import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Automatically reload if a dynamic chunk fails to load due to a new deployment
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  console.warn('Vite preload error encountered, reloading page with fresh assets...');
  window.location.reload();
});

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled Portal Crash:', error, info);
  }

  handleHardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        for (const key of cacheKeys) {
          await caches.delete(key);
        }
      }
      sessionStorage.clear();
    } catch (e) {
      console.error('Cache cleanup error:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: "'Outfit', sans-serif",
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            fontSize: '28px',
            marginBottom: '16px'
          }}>
            ⚠
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: '#f8fafc' }}>
            Portal Update Detected
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '440px', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5' }}>
            A new version of the Oxton Portal was deployed. Click below to load the latest version.
          </p>
          <button 
            type="button"
            onClick={this.handleHardReset}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
            }}
          >
            Update & Refresh Portal
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)
