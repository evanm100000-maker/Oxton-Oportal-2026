import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Info, ShieldAlert, CheckCircle, X, Award, Megaphone, Plane, Calendar, HelpCircle } from 'lucide-react';

export default function NotificationOverlay() {
  const { notifications, removeNotification } = useApp();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div style={styles.container}>
      {notifications.map(notif => {
        let Icon = Info;
        let borderColor = 'rgba(59, 130, 246, 0.4)';
        let bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.25) 100%)';
        let iconColor = '#93c5fd';

        if (notif.type === 'points' || notif.soundType === 'points' || (notif.title && notif.title.toLowerCase().includes('point'))) {
          Icon = Award;
          borderColor = 'rgba(245, 158, 11, 0.5)';
          bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(180, 83, 9, 0.25) 100%)';
          iconColor = '#fbbf24';
        } else if (notif.type === 'danger' || notif.type === 'emergency') {
          Icon = ShieldAlert;
          borderColor = 'rgba(239, 68, 68, 0.5)';
          bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(153, 27, 27, 0.25) 100%)';
          iconColor = '#fca5a5';
        } else if (notif.type === 'success') {
          Icon = CheckCircle;
          borderColor = 'rgba(16, 185, 129, 0.5)';
          bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(6, 78, 59, 0.25) 100%)';
          iconColor = '#6ee7b7';
        } else if (notif.type === 'announcement') {
          Icon = Megaphone;
          borderColor = 'rgba(139, 92, 246, 0.5)';
          bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(109, 40, 217, 0.25) 100%)';
          iconColor = '#c4b5fd';
        } else if (notif.type === 'flight') {
          Icon = Plane;
          borderColor = 'rgba(6, 182, 212, 0.5)';
          bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(14, 116, 144, 0.25) 100%)';
          iconColor = '#67e8f9';
        } else if (notif.type === 'event' || notif.type === 'meeting') {
          Icon = Calendar;
          borderColor = 'rgba(59, 130, 246, 0.5)';
          bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(29, 78, 216, 0.25) 100%)';
          iconColor = '#93c5fd';
        } else if (notif.type === 'ticket') {
          Icon = HelpCircle;
          borderColor = 'rgba(236, 72, 153, 0.5)';
          bgGradient = 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(190, 24, 93, 0.25) 100%)';
          iconColor = '#f472b6';
        }

        return (
          <div key={notif.id} style={{ ...styles.toast, borderLeft: `4px solid ${borderColor}`, background: bgGradient }} className="glass-panel slam-element">
            <div style={styles.iconWrapper}>
              <Icon size={20} color={iconColor} />
            </div>
            <div style={styles.content}>
              <h4 style={styles.title}>{notif.title}</h4>
              <p style={styles.message}>{notif.message}</p>
            </div>
            <button onClick={() => removeNotification(notif.id)} style={styles.closeBtn}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    width: '320px',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
    gap: '12px',
    position: 'relative'
  },
  iconWrapper: {
    flexShrink: 0,
    marginTop: '2px'
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f8fafc',
    marginBottom: '4px'
  },
  message: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#cbd5e1',
    lineHeight: 1.4,
    wordBreak: 'break-word'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px'
  }
};
