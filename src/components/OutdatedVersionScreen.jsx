import React, { useState } from 'react';
import { RefreshCw, HelpCircle, Mail, AlertTriangle, Sparkles, Check, Copy } from 'lucide-react';
import { CURRENT_APP_VERSION, normalizeVersion } from '../utils/versionUtils';

export default function OutdatedVersionScreen({ currentVersion = CURRENT_APP_VERSION, requiredVersion }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayCurrent = normalizeVersion(currentVersion) || currentVersion;
  const displayRequired = normalizeVersion(requiredVersion) || requiredVersion;

  const handleHardRefresh = async () => {
    setIsRefreshing(true);

    try {
      // 1. Unregister any active service workers so new files are fetched fresh
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      // 2. Clear caches to ensure no stale chunk or bundle is retained
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (err) {
      console.warn('Cache clearing error during version refresh:', err);
    }

    // 3. Force hard reload with timestamp query to bypass browser cache
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('_v_reload', Date.now().toString());
    window.location.replace(currentUrl.toString());
  };

  const handleCopyDiagnostics = () => {
    const diag = [
      `[Oxton Oportal Version Check]`,
      `Client Version: V${displayCurrent}`,
      `Required Newest Version: V${displayRequired}`,
      `Timestamp: ${new Date().toISOString()}`,
      `User Agent: ${navigator.userAgent}`
    ].join('\n');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(diag);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel slam-element" style={styles.card}>
        <div style={styles.iconCircle}>
          <Sparkles size={36} color="#60a5fa" />
        </div>

        <h1 style={styles.title}>Update Required</h1>

        <p style={styles.message}>
          A new version of the Oxton Portal is live. To maintain full data synchronization and system security, you must be on the newest version to access the portal.
        </p>

        {/* Version Badges */}
        <div style={styles.versionBadges}>
          <div style={styles.versionBadgeItem}>
            <span style={styles.badgeLabel}>Your Version</span>
            <span style={styles.badgeCurrent}>V{displayCurrent}</span>
          </div>
          <div style={styles.badgeDivider}>&rarr;</div>
          <div style={styles.versionBadgeItem}>
            <span style={styles.badgeLabel}>Newest Version</span>
            <span style={styles.badgeRequired}>V{displayRequired}</span>
          </div>
        </div>

        <div style={styles.instructionBox}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={styles.instructionText}>
            Please <strong>refresh or reopen the website</strong> to continue. If you are having any issues, please contact support.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionGroup}>
          <button
            onClick={handleHardRefresh}
            disabled={isRefreshing}
            style={styles.refreshBtn}
            className="btn-primary"
          >
            <RefreshCw
              size={18}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
            <span>{isRefreshing ? 'Refreshing Portal...' : 'Refresh Website'}</span>
          </button>

          <button
            onClick={() => setShowSupport(!showSupport)}
            style={styles.supportBtn}
            className="btn-secondary"
          >
            <HelpCircle size={18} />
            <span>{showSupport ? 'Hide Support' : 'Contact Support'}</span>
          </button>
        </div>

        {/* Support Drawer */}
        {showSupport && (
          <div style={styles.supportBox} className="slam-element">
            <h4 style={styles.supportTitle}>Need Technical Assistance?</h4>
            <p style={styles.supportDesc}>
              If refreshing does not load the newest version, you may have a persistent cached session or need app assistance.
            </p>

            <div style={styles.supportContactGrid}>
              <a
                href="mailto:evanm.100000@gmail.com?subject=Oxton%20Portal%20Update%20Help"
                style={styles.contactLink}
              >
                <Mail size={16} color="#60a5fa" />
                <span>Email Management: evanm.100000@gmail.com</span>
              </a>
            </div>

            <button
              onClick={handleCopyDiagnostics}
              style={styles.copyDiagBtn}
              type="button"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Diagnostics to Clipboard!' : 'Copy Diagnostics for Support'}</span>
            </button>
          </div>
        )}

        <p style={styles.desktopNote}>
          Using the desktop app? Please close and reopen the application to download and apply the newest version.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'radial-gradient(ellipse at top, rgba(30, 58, 138, 0.25) 0%, var(--color-bg-deep) 70%)',
    boxSizing: 'border-box'
  },
  card: {
    maxWidth: '540px',
    width: '100%',
    padding: '36px 30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: '20px',
    border: '1px solid rgba(96, 165, 250, 0.25)',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxSizing: 'border-box'
  },
  iconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.08) 100%)',
    border: '1px solid rgba(96, 165, 250, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 0 25px rgba(59, 130, 246, 0.3)'
  },
  title: {
    fontSize: '1.9rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em'
  },
  message: {
    fontSize: '0.96rem',
    color: '#9ca3af',
    lineHeight: '1.55',
    margin: '0 0 22px 0',
    maxWidth: '460px'
  },
  versionBadges: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '14px',
    marginBottom: '22px',
    padding: '12px 20px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    width: '100%',
    maxWidth: '380px',
    boxSizing: 'border-box'
  },
  versionBadgeItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  badgeLabel: {
    fontSize: '0.72rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600'
  },
  badgeCurrent: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#f87171',
    background: 'rgba(239, 68, 68, 0.15)',
    padding: '3px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  badgeDivider: {
    fontSize: '1.2rem',
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: '12px'
  },
  badgeRequired: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.15)',
    padding: '3px 10px',
    borderRadius: '6px',
    border: '1px solid rgba(16, 185, 129, 0.3)'
  },
  instructionBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    textAlign: 'left',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '24px',
    width: '100%',
    boxSizing: 'border-box'
  },
  instructionText: {
    fontSize: '0.86rem',
    color: '#fbbf24',
    margin: 0,
    lineHeight: '1.45'
  },
  actionGroup: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '0.95rem',
    fontWeight: '700',
    borderRadius: '10px',
    cursor: 'pointer',
    flex: '1 1 200px'
  },
  supportBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    borderRadius: '10px',
    cursor: 'pointer',
    flex: '1 1 160px'
  },
  supportBox: {
    width: '100%',
    marginTop: '20px',
    padding: '18px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'left',
    boxSizing: 'border-box'
  },
  supportTitle: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
    margin: '0 0 6px 0'
  },
  supportDesc: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    margin: '0 0 12px 0',
    lineHeight: '1.45'
  },
  supportContactGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '14px'
  },
  contactLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    color: '#93c5fd',
    textDecoration: 'none',
    wordBreak: 'break-all'
  },
  copyDiagBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#e2e8f0',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.78rem',
    cursor: 'pointer'
  },
  desktopNote: {
    fontSize: '0.76rem',
    color: '#64748b',
    marginTop: '20px',
    marginBottom: 0
  }
};
