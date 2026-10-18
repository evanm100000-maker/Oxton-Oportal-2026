import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

// __BUILD_TIME__ is injected by Vite at compile time
const CLIENT_BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0;

export default function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const checkForUpdates = useCallback(async () => {
    try {
      // Extremely lightweight check (~45 bytes) with cache busting
      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!response.ok) return;

      const data = await response.json();
      if (data && data.buildTime) {
        // If server's build time is newer than client's build time, prompt update!
        if (data.buildTime > CLIENT_BUILD_TIME) {
          setNewVersion(data.version || '');
          setShowBanner(true);
        }
      }
    } catch {
      // Silent fail if network is offline
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkForUpdates();

    // Check periodically every 2 minutes
    const intervalId = setInterval(checkForUpdates, 120000);

    // Check whenever user refocuses the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkForUpdates);

    // Also listen to PWA Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowBanner(true);
            }
          });
        });
      }).catch(() => {});
    }

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkForUpdates);
    };
  }, [checkForUpdates]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Tell all service workers to skip waiting immediately
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.unregister();
        }
      }

      // 2. Clear browser cache storage
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      // 3. Clear session caches
      sessionStorage.removeItem('oxton_activeTab');
    } catch (err) {
      console.error('Cache cleanup error:', err);
    }

    // 4. Force browser to reload the page from network
    window.location.href = window.location.origin + window.location.pathname + '?_u=' + Date.now();
  };

  if (!showBanner) return null;

  return (
    <div style={styles.container} className="slam-element">
      <div style={styles.content}>
        <div style={styles.iconContainer}>
          <Sparkles size={20} color="#60a5fa" />
        </div>
        <div style={styles.textContainer}>
          <strong style={styles.title}>
            Portal Update Available {newVersion ? `(v${newVersion})` : ''}
          </strong>
          <span style={styles.description}>
            A new version with performance & speed updates is ready.
          </span>
        </div>
      </div>
      <div style={styles.actionRow}>
        <button 
          style={styles.refreshBtn} 
          className="btn-primary"
          onClick={handleUpdate}
          disabled={isUpdating}
        >
          <RefreshCw size={14} className={isUpdating ? 'spin' : ''} />
          <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
        </button>
        <button 
          style={styles.dismissBtn}
          onClick={() => setShowBanner(false)}
          title="Dismiss for now"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 99999,
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(59, 130, 246, 0.5)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.25)',
    borderRadius: '14px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    maxWidth: '480px',
    animation: 'slideUp 0.3s ease-out'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
  },
  iconContainer: {
    background: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    padding: '10px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    color: '#ffffff',
    fontSize: '0.92rem',
    fontWeight: '700',
    letterSpacing: '-0.2px',
  },
  description: {
    color: '#94a3b8',
    fontSize: '0.78rem',
    lineHeight: '1.4',
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  refreshBtn: {
    padding: '9px 16px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
    transition: 'all 0.15s ease',
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s ease',
  }
};
