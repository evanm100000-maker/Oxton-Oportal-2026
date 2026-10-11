import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, LogOut } from 'lucide-react';

export default function SuspendedScreen() {
  const { currentUser, logout } = useApp();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!currentUser?.suspendedUntil) return;
      const suspendTime = new Date(currentUser.suspendedUntil).getTime();
      const now = new Date().getTime();
      const diff = suspendTime - now;

      if (diff <= 0) {
        // Automatically reload to lift suspension if timer expired
        window.location.reload();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <div style={styles.container}>
      <div className="glass-panel slam-element" style={styles.card}>
        <Lock size={64} color="#ef4444" style={{ marginBottom: '20px' }} />
        <h1 style={styles.title}>Account Suspended</h1>
        <p style={styles.message}>
          You have been temporarily suspended for: <strong>{currentUser?.suspendedReason || 'Disciplinary Infraction'}</strong>. 
          <br/><br/>
          The suspension will expire in:
        </p>
        <div style={styles.timerBox}>
          <span style={styles.timerLabel}>Time Remaining:</span>
          <span style={styles.timerValue}>{timeLeft}</span>
        </div>
        <button onClick={logout} className="btn-secondary" style={styles.logoutBtn}>
          <LogOut size={16} /> Sign Out
        </button>
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
    color: '#ef4444',
    marginBottom: '16px',
  },
  message: {
    fontSize: '1.1rem',
    color: '#9ca3af',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  timerBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    width: '100%',
  },
  timerLabel: {
    fontSize: '0.9rem',
    color: '#fca5a5',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  timerValue: {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    fontVariantNumeric: 'tabular-nums',
  },
  logoutBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }
};
