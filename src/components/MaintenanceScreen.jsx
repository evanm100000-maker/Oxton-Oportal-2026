import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert } from 'lucide-react';

export default function MaintenanceScreen({ onBypass, allowBypass }) {
  const { maintenanceConfig } = useApp();

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
        <h1 style={styles.title}>Site Under Maintenance</h1>
        <p style={styles.message}>
          {maintenanceConfig?.message || 'The system is currently undergoing scheduled maintenance. Please check back later.'}
        </p>
        
        {allowBypass && (
          <button 
            onClick={onBypass} 
            style={{ ...styles.bypassBtn, marginTop: '24px' }}
          >
            Admin Login Bypass
          </button>
        )}
      </div>
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
    background: 'var(--color-bg-deep)',
  },
  card: {
    maxWidth: '500px',
    width: '100%',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    marginBottom: '16px',
  },
  message: {
    fontSize: '1.1rem',
    color: '#9ca3af',
    lineHeight: '1.5',
  },
  bypassBtn: {
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#9ca3af',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  }
};
