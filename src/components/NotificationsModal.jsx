import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Bell, BellOff, Info, ShieldAlert, CheckCircle, Trash2, Award, Megaphone, Plane, Calendar, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsModal({ isOpen, onClose }) {
  const { userNotifications, clearUserNotifications, isDnd, toggleDnd } = useApp();

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.overlay}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={styles.modal}
          className="glass-panel"
        >
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="#3b82f6" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Notification Center</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Do Not Disturb Toggle Button */}
              <button
                type="button"
                onClick={toggleDnd}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: isDnd ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: isDnd ? '#f87171' : '#94a3b8',
                  border: `1px solid ${isDnd ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.15s ease'
                }}
                title={isDnd ? "Do Not Disturb is ON (Notifications muted)" : "Click to enable Do Not Disturb"}
              >
                {isDnd ? <BellOff size={14} color="#f87171" /> : <Bell size={14} color="#94a3b8" />}
                <span>{isDnd ? 'DND: ON' : 'Do Not Disturb'}</span>
              </button>

              <button onClick={onClose} style={styles.closeBtn}>
                <X size={20} color="#9ca3af" />
              </button>
            </div>
          </div>

          <div style={styles.content}>
            {isDnd && (
              <div style={{
                marginBottom: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BellOff size={14} color="#f87171" />
                <span>Do Not Disturb is active. Notification sounds are currently muted.</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                Showing last 30 notifications
              </span>
              {userNotifications && userNotifications.length > 0 && (
                <button onClick={clearUserNotifications} style={styles.clearBtn} className="btn-secondary">
                  <Trash2 size={16} />
                  Clear All
                </button>
              )}
            </div>

            <div style={styles.notifList}>
              {(!userNotifications || userNotifications.length === 0) ? (
                <div style={styles.emptyState}>
                  <Bell size={32} color="rgba(255,255,255,0.1)" />
                  <p>You have no notifications.</p>
                </div>
              ) : (
                userNotifications.map(notif => {
                  let Icon = Info;
                  let color = '#3b82f6';
                  let bg = 'rgba(59, 130, 246, 0.1)';
                  
                  if (notif.type === 'points' || notif.soundType === 'points' || (notif.title && notif.title.toLowerCase().includes('point'))) {
                    Icon = Award;
                    color = '#fbbf24';
                    bg = 'rgba(245, 158, 11, 0.15)';
                  } else if (notif.type === 'danger' || notif.type === 'emergency') {
                    Icon = ShieldAlert;
                    color = '#ef4444';
                    bg = 'rgba(239, 68, 68, 0.1)';
                  } else if (notif.type === 'success') {
                    Icon = CheckCircle;
                    color = '#10b981';
                    bg = 'rgba(16, 185, 129, 0.1)';
                  } else if (notif.type === 'announcement') {
                    Icon = Megaphone;
                    color = '#8b5cf6';
                    bg = 'rgba(139, 92, 246, 0.12)';
                  } else if (notif.type === 'flight') {
                    Icon = Plane;
                    color = '#06b6d4';
                    bg = 'rgba(6, 182, 212, 0.12)';
                  } else if (notif.type === 'event' || notif.type === 'meeting') {
                    Icon = Calendar;
                    color = '#3b82f6';
                    bg = 'rgba(59, 130, 246, 0.12)';
                  } else if (notif.type === 'ticket') {
                    Icon = HelpCircle;
                    color = '#ec4899';
                    bg = 'rgba(236, 72, 153, 0.12)';
                  }

                  return (
                    <div key={notif.id || Math.random()} style={{...styles.notifItem, borderLeft: `4px solid ${color}`}}>
                      <div style={{...styles.iconBox, background: bg, color}}>
                        <Icon size={18} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <h4 style={styles.notifTitle}>{notif.title}</h4>
                          {notif.soundType === 'points' && (
                            <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontWeight: '700' }}>
                              +Points
                            </span>
                          )}
                        </div>
                        <p style={styles.notifMessage}>{notif.message}</p>
                        <span style={styles.notifTime}>{new Date(notif.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  modal: {
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    overflow: 'hidden'
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(15, 23, 42, 0.6)'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s'
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '0.85rem',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  notifList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#9ca3af',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  notifItem: {
    display: 'flex',
    gap: '16px',
    background: 'rgba(255,255,255,0.03)',
    padding: '16px',
    borderRadius: '8px',
    alignItems: 'flex-start'
  },
  iconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  notifTitle: {
    margin: '0 0 4px 0',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600'
  },
  notifMessage: {
    margin: '0 0 8px 0',
    color: '#cbd5e1',
    fontSize: '0.9rem',
    lineHeight: '1.4'
  },
  notifTime: {
    fontSize: '0.75rem',
    color: '#64748b'
  }
};
