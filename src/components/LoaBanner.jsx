import React from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, X } from 'lucide-react';

export default function LoaBanner() {
  const { currentUser, loaRequests, requestEndLoaEarly } = useApp();

  if (!currentUser) return null;

  // Find if user has an active LOA
  const activeLoa = loaRequests.find(req => {
    if (req.userEmail !== currentUser.email) return false;
    if (req.status !== 'Approved') return false;
    
    // Check if current date is within LOA dates
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const start = new Date(req.startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(req.endDate);
    end.setHours(23, 59, 59, 999);
    
    return now >= start && now <= end;
  });

  if (!activeLoa) return null;

  return (
    <div style={styles.container}>
      <div style={styles.banner} className="glass-panel slam-element">
        <div style={styles.iconContainer}>
          <Calendar size={24} color="#3b82f6" />
        </div>
        <div style={styles.content}>
          <h3 style={styles.title}>You are currently on Leave of Absence</h3>
          <p style={styles.text}>Your LOA is scheduled from {activeLoa.startDate} to {activeLoa.endDate}.</p>
        </div>
        <div style={styles.actions}>
          <button 
            type="button" 
            onClick={() => {
              if (window.confirm('Are you sure you want to request to end your LOA early?')) {
                requestEndLoaEarly(activeLoa.id);
                alert('Request sent to admins.');
              }
            }}
            className="btn-primary" 
            style={styles.button}
          >
            Request to End Early
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '16px 24px 0 24px',
    maxWidth: '1200px',
    margin: '0 auto',
    zIndex: 50,
    position: 'relative'
  },
  banner: {
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)',
    padding: '16px 20px',
    gap: '16px',
    borderRadius: '12px'
  },
  iconContainer: {
    background: 'rgba(59, 130, 246, 0.2)',
    padding: '12px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#bfdbfe',
    marginBottom: '4px'
  },
  text: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.9rem'
  },
  actions: {
    flexShrink: 0
  },
  button: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.9rem'
  }
};
