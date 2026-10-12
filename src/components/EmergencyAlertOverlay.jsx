import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Volume2, VolumeX, ShieldAlert, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { startAlarmSiren, stopAlarmSiren, resumeAlarmSiren } from '../utils/sirenAudio';

export default function EmergencyAlertOverlay() {
  const { emergencyAlertConfig } = useApp();
  const [dismissedId, setDismissedId] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [isSilenced, setIsSilenced] = useState(false);

  // Read dismissed alert id from sessionStorage so user isn't re-prompted within the session if dismissed
  useEffect(() => {
    const savedId = sessionStorage.getItem('dismissedEmergencyAlertId');
    if (savedId) {
      setDismissedId(savedId);
    }
  }, []);

  const alertActive = emergencyAlertConfig?.isActive && emergencyAlertConfig?.id && emergencyAlertConfig.id !== dismissedId;

  // Persist silence state per alert ID across page refreshes
  useEffect(() => {
    if (alertActive && emergencyAlertConfig?.id) {
      const silencedId = sessionStorage.getItem('silencedEmergencyAlertId');
      setIsSilenced(silencedId === emergencyAlertConfig.id);

      // Persist countdown lockout across page refresh
      const lockoutKey = `alertLockoutUntil_${emergencyAlertConfig.id}`;
      const savedLockoutUntil = sessionStorage.getItem(lockoutKey);
      const now = Date.now();

      if (savedLockoutUntil) {
        const remainingSeconds = Math.max(0, Math.ceil((parseInt(savedLockoutUntil, 10) - now) / 1000));
        setCountdown(remainingSeconds);
      } else {
        const lockoutUntil = now + 10000;
        sessionStorage.setItem(lockoutKey, lockoutUntil.toString());
        setCountdown(10);
      }
    }
  }, [emergencyAlertConfig?.id, alertActive]);

  // Track if browser has blocked audio autoplay on reload until first user interaction
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);

  // 10 second countdown timer
  useEffect(() => {
    if (!alertActive) return;
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [alertActive, countdown]);

  const isSevere = (emergencyAlertConfig?.soundType === 'severe') || (emergencyAlertConfig?.header || '').toLowerCase().includes('severe');

  // Trigger alarm siren reliably via multi-layered sirenAudio engine
  useEffect(() => {
    if (!alertActive || isSilenced) {
      stopAlarmSiren();
      return;
    }

    startAlarmSiren(isSevere ? 'severe' : 'standard');

    return () => {
      stopAlarmSiren();
    };
  }, [alertActive, isSilenced, isSevere, emergencyAlertConfig?.id]);

  // Proactively resume alarm on any user movement, hover, key, or window focus
  useEffect(() => {
    if (!alertActive || isSilenced) return;

    const resumeSound = () => {
      setIsAudioBlocked(false);
      resumeAlarmSiren();
    };

    window.addEventListener('click', resumeSound, { passive: true });
    window.addEventListener('keydown', resumeSound, { passive: true });
    window.addEventListener('touchstart', resumeSound, { passive: true });
    window.addEventListener('pointerdown', resumeSound, { passive: true });
    window.addEventListener('mousemove', resumeSound, { passive: true, once: true });
    window.addEventListener('focus', resumeSound, { passive: true });

    return () => {
      window.removeEventListener('click', resumeSound);
      window.removeEventListener('keydown', resumeSound);
      window.removeEventListener('touchstart', resumeSound);
      window.removeEventListener('pointerdown', resumeSound);
      window.removeEventListener('mousemove', resumeSound);
      window.removeEventListener('focus', resumeSound);
    };
  }, [alertActive, isSilenced]);

  const handleSilence = () => {
    setIsSilenced(prev => {
      const next = !prev;
      if (next) {
        stopAlarmSiren();
        if (emergencyAlertConfig?.id) {
          sessionStorage.setItem('silencedEmergencyAlertId', emergencyAlertConfig.id);
        }
      } else {
        startAlarmSiren(isSevere ? 'severe' : 'standard');
        if (emergencyAlertConfig?.id) {
          sessionStorage.removeItem('silencedEmergencyAlertId');
        }
      }
      return next;
    });
  };

  const handleDismiss = () => {
    if (countdown > 0) return;
    stopAlarmSiren();
    if (emergencyAlertConfig?.id) {
      setDismissedId(emergencyAlertConfig.id);
      sessionStorage.setItem('dismissedEmergencyAlertId', emergencyAlertConfig.id);
      sessionStorage.removeItem(`alertLockoutUntil_${emergencyAlertConfig.id}`);
      sessionStorage.removeItem('silencedEmergencyAlertId');
    }
  };

  const triggerAudioResume = () => {
    setIsAudioBlocked(false);
    resumeAlarmSiren();
    if (!isSilenced && alertActive) {
      startAlarmSiren(isSevere ? 'severe' : 'standard');
    }
  };

  if (!alertActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.backdrop}
        onClick={triggerAudioResume}
      >
        {isAudioBlocked && !isSilenced && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={styles.unmuteBanner}
            onClick={triggerAudioResume}
          >
            <Volume2 size={20} className="animate-bounce" />
            <span>Browser paused audio after reload &mdash; <strong>Click anywhere to resume alarm siren</strong></span>
          </motion.div>
        )}

        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            ...styles.card,
            borderColor: isSevere ? '#dc2626' : '#ea580c',
            boxShadow: isSevere 
              ? '0 0 50px rgba(220, 38, 38, 0.4), inset 0 0 20px rgba(220, 38, 38, 0.2)' 
              : '0 0 50px rgba(234, 88, 12, 0.4), inset 0 0 20px rgba(234, 88, 12, 0.2)'
          }}
          onClick={(e) => {
            // Also resume audio when clicking anywhere inside card
            triggerAudioResume();
          }}
        >
          {/* Header Banner */}
          <div style={{
            ...styles.headerBar,
            background: isSevere
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(185, 28, 28, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(234, 88, 12, 0.3) 0%, rgba(194, 65, 12, 0.15) 100%)'
          }}>
            <div style={{
              ...styles.iconPulse,
              backgroundColor: isSevere ? 'rgba(220, 38, 38, 0.25)' : 'rgba(234, 88, 12, 0.25)',
              color: isSevere ? '#ef4444' : '#f97316'
            }}>
              <ShieldAlert size={36} />
            </div>
            <div style={styles.headerTexts}>
              <span style={{
                ...styles.badge,
                backgroundColor: isSevere ? '#dc2626' : '#ea580c',
              }}>
                {isSevere ? 'PRIORITY 1 BROADCAST' : 'SYSTEM BROADCAST'}
              </span>
              <h1 style={styles.title}>{emergencyAlertConfig?.header || 'Emergency Alert'}</h1>
              {emergencyAlertConfig?.senderName && (
                <span style={styles.author}>Dispatched by: {emergencyAlertConfig.senderName}</span>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div style={styles.body}>
            <div style={styles.messageBox}>
              <p style={styles.messageText}>
                {emergencyAlertConfig?.message || 'A priority alert has been issued for all personnel.'}
              </p>
            </div>
            {emergencyAlertConfig?.timestamp && (
              <div style={styles.timestampRow}>
                <span>Issued at: {new Date(emergencyAlertConfig.timestamp).toLocaleTimeString()} ({new Date(emergencyAlertConfig.timestamp).toLocaleDateString()})</span>
              </div>
            )}
          </div>

          {/* Control Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={handleSilence}
              style={{
                ...styles.silenceBtn,
                background: isSilenced ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                borderColor: isSilenced ? '#10b981' : '#ef4444',
                color: isSilenced ? '#34d399' : '#f87171'
              }}
            >
              {isSilenced ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span>{isSilenced ? 'Alarm Silenced' : 'Silence Sound'}</span>
            </button>

            <button
              type="button"
              disabled={countdown > 0}
              onClick={handleDismiss}
              style={{
                ...styles.dismissBtn,
                opacity: countdown > 0 ? 0.5 : 1,
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                background: countdown > 0 ? '#334155' : (isSevere ? '#dc2626' : '#ea580c')
              }}
            >
              <CheckCircle size={18} />
              <span>{countdown > 0 ? `Dismiss Alert (${countdown}s)` : 'Dismiss Alert'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 99999,
    backgroundColor: 'rgba(5, 7, 13, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box'
  },
  unmuteBanner: {
    position: 'fixed',
    top: '24px',
    zIndex: 100000,
    background: '#dc2626',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5), 0 0 15px rgba(220, 38, 38, 0.5)',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.01em',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    userSelect: 'none'
  },
  card: {
    width: '100%',
    maxWidth: '680px',
    background: '#0f172a',
    borderRadius: '16px',
    border: '2px solid',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  headerBar: {
    padding: '24px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  iconPulse: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  headerTexts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  badge: {
    alignSelf: 'flex-start',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.06em',
    color: '#ffffff',
    textTransform: 'uppercase'
  },
  title: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.02em',
    lineHeight: '1.2'
  },
  author: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.65)'
  },
  body: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  messageBox: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '20px',
    minHeight: '120px',
    maxHeight: '40vh',
    overflowY: 'auto'
  },
  messageText: {
    margin: 0,
    fontSize: '1.1rem',
    lineHeight: '1.6',
    color: '#f8fafc',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  timestampRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '0.82rem',
    color: '#94a3b8'
  },
  actions: {
    padding: '20px 28px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap'
  },
  silenceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    borderRadius: '10px',
    border: '1px solid',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dismissBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '700',
    letterSpacing: '0.02em',
    transition: 'all 0.2s ease',
    marginLeft: 'auto'
  }
};
