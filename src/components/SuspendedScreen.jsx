import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, LogOut, MessageSquareWarning, CheckCircle2, Send } from 'lucide-react';

export default function SuspendedScreen() {
  const { currentUser, infractions = [], logout, liftExpiredSuspension, submitSuspensionAppeal } = useApp();
  const [timeLeft, setTimeLeft] = useState('');
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealError, setAppealError] = useState('');
  const [appealJustSubmitted, setAppealJustSubmitted] = useState(false);

  const latestSuspensionInfraction = useMemo(() => {
    if (!currentUser?.email) return null;
    const normalized = currentUser.email.toLowerCase().trim();
    return (infractions || [])
      .filter(inf =>
        inf &&
        inf.staffEmail?.toLowerCase().trim() === normalized &&
        (inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension'))
      )
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))[0] || null;
  }, [infractions, currentUser?.email]);

  const existingAppeal = latestSuspensionInfraction?.appeal || currentUser?.suspensionAppeal || null;

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!currentUser?.suspendedUntil) return;
      const suspendTime = new Date(currentUser.suspendedUntil).getTime();
      const now = new Date().getTime();
      const diff = suspendTime - now;

      if (diff <= 0) {
        if (liftExpiredSuspension && currentUser?.email) {
          liftExpiredSuspension(currentUser.email);
        } else {
          window.location.reload();
        }
      } else {
        const totalHours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(days > 0 ? `${days}d ${hours}h ${mins}m ${secs}s` : `${hours}h ${mins}m ${secs}s`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [currentUser, liftExpiredSuspension]);

  const handleSubmitAppeal = (e) => {
    e.preventDefault();
    const cleaned = appealText.trim();
    if (cleaned.length < 10) {
      setAppealError('Please provide at least 10 characters explaining your appeal.');
      return;
    }
    const ok = submitSuspensionAppeal ? submitSuspensionAppeal(cleaned) : false;
    if (!ok) {
      setAppealError('Could not submit your appeal right now. Please try again.');
      return;
    }
    setAppealText('');
    setAppealError('');
    setShowAppealForm(false);
    setAppealJustSubmitted(true);
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel slam-element" style={styles.card}>
        <Lock size={58} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h1 style={styles.title}>Account Suspended</h1>
        <p style={styles.message}>
          You have been temporarily suspended for: <strong>{currentUser?.suspendedReason || 'Disciplinary Infraction'}</strong>.
          <br /><br />
          The suspension will expire in:
        </p>

        <div style={styles.timerBox}>
          <span style={styles.timerLabel}>Time Remaining:</span>
          <span style={styles.timerValue}>{timeLeft}</span>
        </div>

        {/* Appeal Section */}
        <div style={styles.appealSection}>
          {existingAppeal ? (
            <div style={styles.appealSubmittedBox}>
              <div style={styles.appealSubmittedHeader}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: '700', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} />
                  Appeal Submitted
                </span>
                <span style={styles.pendingPill}>Pending Admin Review</span>
              </div>
              <p style={styles.appealBodyText}>{existingAppeal.text}</p>
              {existingAppeal.date && (
                <div style={styles.appealDateText}>
                  Submitted {new Date(existingAppeal.date).toLocaleString()}
                </div>
              )}
              {appealJustSubmitted && (
                <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '6px', fontWeight: '600' }}>
                  Your appeal has been sent to administration for review.
                </div>
              )}
            </div>
          ) : showAppealForm ? (
            <form onSubmit={handleSubmitAppeal} style={styles.appealForm}>
              <div style={styles.appealFormHeader}>
                <MessageSquareWarning size={16} color="#60a5fa" />
                <span>Appeal Your Suspension</span>
              </div>
              <textarea
                required
                rows="3"
                value={appealText}
                onChange={e => {
                  setAppealText(e.target.value);
                  setAppealError('');
                }}
                placeholder="Explain clearly why you are appealing this suspension and what steps you will take moving forward..."
                className="input-field"
                style={{ width: '100%', textAlign: 'left', resize: 'vertical' }}
              />
              {appealError && (
                <div style={styles.errorText}>{appealError}</div>
              )}
              <div style={styles.appealBtnRow}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAppealForm(false);
                    setAppealError('');
                  }}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.84rem', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.84rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} /> Submit Appeal
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAppealForm(true)}
              className="btn-secondary"
              style={styles.appealTriggerBtn}
            >
              <MessageSquareWarning size={16} /> Appeal Suspension
            </button>
          )}
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
    maxWidth: '540px',
    width: '100%',
    padding: '36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#ef4444',
    marginBottom: '14px',
  },
  message: {
    fontSize: '1.05rem',
    color: 'var(--color-text-muted)',
    lineHeight: '1.5',
    marginBottom: '22px',
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
    marginBottom: '20px',
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
  appealSection: {
    width: '100%',
    marginBottom: '20px',
  },
  appealTriggerBtn: {
    width: '100%',
    padding: '11px 18px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    color: '#60a5fa',
  },
  appealForm: {
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    textAlign: 'left',
  },
  appealFormHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    fontSize: '0.9rem',
    color: '#60a5fa',
  },
  appealBtnRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  errorText: {
    fontSize: '0.8rem',
    color: '#f87171',
    fontWeight: '600',
  },
  appealSubmittedBox: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    textAlign: 'left',
  },
  appealSubmittedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '8px',
  },
  pendingPill: {
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '999px',
    background: 'rgba(245, 158, 11, 0.18)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.35)',
  },
  appealBodyText: {
    margin: 0,
    fontSize: '0.88rem',
    color: 'var(--color-text-main)',
    lineHeight: '1.45',
    whiteSpace: 'pre-wrap',
  },
  appealDateText: {
    marginTop: '6px',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
  },
  logoutBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }
};
