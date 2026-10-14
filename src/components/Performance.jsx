import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { User, Shield, CheckCircle, Clock, AlertTriangle, FileText, TrendingUp, Trophy, Plane } from 'lucide-react';

export default function Performance() {
  const { currentUser, users, flightLogs, flights = [], reports, infractions, activeUsers, quotaConfig } = useApp();
  const [selectedEmail, setSelectedEmail] = useState(currentUser.email);

  const targetUser = useMemo(() => {
    return users.find(u => u.email === selectedEmail) || currentUser;
  }, [selectedEmail, users, currentUser]);

  const userFlightLogs = useMemo(() => flightLogs.filter(log => log.submitterEmail === targetUser.email), [flightLogs, targetUser]);
  const approvedFlightLogs = useMemo(() => userFlightLogs.filter(log => log.status === 'Approved'), [userFlightLogs]);
  const userReports = useMemo(() => reports.filter(r => r.reporterEmail === targetUser.email), [reports, targetUser]);
  const userInfractions = useMemo(() => infractions.filter(inf => inf.staffEmail === targetUser.email), [infractions, targetUser]);
  
  // Total completed flights: approved flight logs + flights verified Present on submitted registers
  const flightsCount = useMemo(() => {
    if (!targetUser?.email) return 0;
    const safeEmail = targetUser.email.replace(/\./g, ',');
    const flightIds = new Set();

    (approvedFlightLogs || []).forEach(log => {
      flightIds.add(log.flightId || log.id);
    });

    (flights || []).forEach(f => {
      if (f.registerSubmitted && f.attendanceRecord?.[safeEmail] === 'Present') {
        flightIds.add(f.id);
      }
    });

    return flightIds.size;
  }, [approvedFlightLogs, flights, targetUser?.email]);

  // Current flight quota progress (target: 3)
  const currentQuota = useMemo(() => {
    if (!targetUser?.email) return 0;
    const safeEmail = targetUser.email.replace(/\./g, ',');
    const resetTime = quotaConfig?.lastResetDate ? new Date(quotaConfig.lastResetDate).getTime() : 0;
    
    const countSet = new Set();
    (flights || []).forEach(f => {
      if (f.registerSubmitted && f.attendanceRecord?.[safeEmail] === 'Present') {
        const t = f.registerSubmittedAt ? new Date(f.registerSubmittedAt).getTime() : (f.date ? new Date(`${f.date}T${f.time || '00:00'}`).getTime() : 0);
        if (t >= resetTime) countSet.add(f.id);
      }
    });

    (approvedFlightLogs || []).forEach(l => {
      const t = l.timestamp ? new Date(l.timestamp).getTime() : 0;
      if (t >= resetTime) countSet.add(l.flightId || l.id);
    });

    if (targetUser.quotaFlights !== undefined && resetTime > 0 && targetUser.lastQuotaReset === quotaConfig?.lastResetDate) {
      return Number(targetUser.quotaFlights);
    }
    return countSet.size;
  }, [flights, approvedFlightLogs, targetUser?.email, targetUser?.quotaFlights, targetUser?.lastQuotaReset, quotaConfig?.lastResetDate]);

  // Calculate badges
  let badge = 'Unranked';
  let badgeColor = '#9ca3af'; // gray
  if (flightsCount >= 50) { badge = 'Platinum'; badgeColor = '#e5e7eb'; }
  else if (flightsCount >= 30) { badge = 'Gold'; badgeColor = '#fbbf24'; }
  else if (flightsCount >= 20) { badge = 'Silver'; badgeColor = '#9ca3af'; }
  else if (flightsCount >= 10) { badge = 'Bronze'; badgeColor = '#b45309'; }

  const sotwWins = targetUser.sotwWins || 0;

  // Compute a simple activity graph (last 7 days of logs + reports)
  const activityData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
      
      const logsToday = userFlightLogs.filter(l => {
        if (!l.timestamp) return false;
        const logTime = new Date(l.timestamp).getTime();
        return logTime >= startOfDay && logTime < endOfDay;
      }).length;
      
      const reportsToday = userReports.filter(r => {
        if (!r.timestamp) return false;
        const repTime = new Date(r.timestamp).getTime();
        return repTime >= startOfDay && repTime < endOfDay;
      }).length;
      
      data.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), count: logsToday + reportsToday });
    }
    return data;
  }, [userFlightLogs, userReports]);
  const maxActivity = Math.max(...activityData.map(d => d.count), 1);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h3 style={styles.title}>Performance Dashboard</h3>
          <p style={styles.subtitle}>Track activity, badges, and staff statistics.</p>
        </div>
        {currentUser.isAdmin && (
          <select 
            style={styles.select} 
            value={selectedEmail} 
            onChange={(e) => setSelectedEmail(e.target.value)}
          >
            <option value={currentUser.email}>My Performance ({currentUser.firstName})</option>
            {activeUsers.filter(u => u.email !== currentUser.email).map(u => (
              <option key={u.email} value={u.email}>{u.firstName} {u.lastName} (@{u.robloxUsername})</option>
            ))}
          </select>
        )}
      </div>

      <div style={styles.topCards}>
        <div className="glass-panel" style={{ ...styles.card, borderColor: currentQuota >= 3 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)' }}>
          <div style={styles.cardIcon}><Plane size={24} color={currentQuota >= 3 ? "#10b981" : "#3b82f6"} /></div>
          <div style={styles.cardInfo}>
            <span style={styles.cardLabel}>Flight Quota</span>
            <strong style={{ ...styles.cardValue, color: currentQuota >= 3 ? '#34d399' : '#60a5fa' }}>{currentQuota} / 3 {currentQuota >= 3 ? '✓ Full' : 'Flights'}</strong>
          </div>
        </div>
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardIcon}><CheckCircle size={24} color="#10b981" /></div>
          <div style={styles.cardInfo}>
            <span style={styles.cardLabel}>Completed Flights</span>
            <strong style={styles.cardValue}>{flightsCount}</strong>
          </div>
        </div>
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardIcon}><FileText size={24} color="#3b82f6" /></div>
          <div style={styles.cardInfo}>
            <span style={styles.cardLabel}>Logs Submitted</span>
            <strong style={styles.cardValue}>{userFlightLogs.length}</strong>
          </div>
        </div>
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardIcon}><AlertTriangle size={24} color="#f59e0b" /></div>
          <div style={styles.cardInfo}>
            <span style={styles.cardLabel}>Reports Handled</span>
            <strong style={styles.cardValue}>{userReports.length}</strong>
          </div>
        </div>
        <div className="glass-panel" style={styles.card}>
          <div style={styles.cardIcon}><Shield size={24} color="#ef4444" /></div>
          <div style={styles.cardInfo}>
            <span style={styles.cardLabel}>Infractions</span>
            <strong style={styles.cardValue}>{userInfractions.length}</strong>
          </div>
        </div>
      </div>

      <div style={styles.mainGrid}>
        <div className="glass-panel" style={styles.section}>
          <h4 style={styles.sectionTitle}><TrendingUp size={18} /> Activity Graph (Last 7 Days)</h4>
          <div style={styles.chartContainer}>
            {activityData.map((d, i) => (
              <div key={i} style={styles.barWrapper}>
                <div style={{ ...styles.bar, height: `${(d.count / maxActivity) * 100}%` }}></div>
                <span style={styles.barLabel}>{d.date}</span>
                <span style={styles.barValue}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={styles.section}>
          <h4 style={styles.sectionTitle}><Trophy size={18} /> Staff Achievements</h4>
          
          <div style={styles.badgeContainer}>
            <div style={styles.badgeItem}>
              <div style={{ ...styles.badgeCircle, border: `2px solid ${badgeColor}`, color: badgeColor }}>
                <Trophy size={32} />
              </div>
              <div style={styles.badgeInfo}>
                <strong>{badge} Badge</strong>
                <span>{flightsCount} Approved Flights</span>
              </div>
            </div>
            
            <div style={styles.badgeItem}>
              <div style={{ ...styles.badgeCircle, border: '2px solid #8b5cf6', color: '#8b5cf6' }}>
                <User size={32} />
              </div>
              <div style={styles.badgeInfo}>
                <strong>Staff of the Week</strong>
                <span>Won {sotwWins} times</span>
              </div>
            </div>
          </div>

          <div style={styles.badgeLegend}>
            <p style={styles.legendTitle}>Flight Badges Requirements:</p>
            <div style={styles.legendGrid}>
              <span style={{color: '#b45309'}}>Bronze: 10</span>
              <span style={{color: '#9ca3af'}}>Silver: 20</span>
              <span style={{color: '#fbbf24'}}>Gold: 30</span>
              <span style={{color: '#e5e7eb'}}>Platinum: 50+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Attendance History Section */}
      <div className="glass-panel" style={styles.section}>
        <h4 style={styles.sectionTitle}><Plane size={18} /> Verified Flight Attendance Records ({(() => {
          const safeEmail = targetUser?.email ? targetUser.email.replace(/\./g, ',') : '';
          const list = [];
          (flights || []).forEach(f => {
            const mark = f.attendanceRecord?.[safeEmail];
            if (mark && mark !== 'Pending') {
              list.push({ flightId: f.id, flightCode: f.flightCode, date: f.date, time: f.time, location: f.location, status: mark, isSubmitted: f.registerSubmitted });
            }
          });
          (targetUser?.attendedFlights || []).forEach(af => {
            if (!list.some(r => r.flightId === af.flightId)) {
              list.push({ flightId: af.flightId, flightCode: af.flightCode, date: af.date, time: af.time, location: af.location, status: af.status, isSubmitted: true });
            }
          });
          return list.length;
        })()})</h4>
        
        {(() => {
          const safeEmail = targetUser?.email ? targetUser.email.replace(/\./g, ',') : '';
          const list = [];
          (flights || []).forEach(f => {
            const mark = f.attendanceRecord?.[safeEmail];
            if (mark && mark !== 'Pending') {
              list.push({ flightId: f.id, flightCode: f.flightCode, date: f.date, time: f.time, location: f.location, status: mark, isSubmitted: f.registerSubmitted });
            }
          });
          (targetUser?.attendedFlights || []).forEach(af => {
            if (!list.some(r => r.flightId === af.flightId)) {
              list.push({ flightId: af.flightId, flightCode: af.flightCode, date: af.date, time: af.time, location: af.location, status: af.status, isSubmitted: true });
            }
          });

          if (list.length === 0) {
            return (
              <div style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
                No flight register attendances on record yet.
              </div>
            );
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {list.map((item, idx) => (
                <div key={idx} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#fff', fontSize: '1.02rem' }}>{item.flightCode}</strong>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      background: item.status === 'Present' ? 'rgba(16, 185, 129, 0.2)' : item.status === 'Late' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: item.status === 'Present' ? '#34d399' : item.status === 'Late' ? '#fbbf24' : '#f87171',
                      border: `1px solid ${item.status === 'Present' ? '#10b981' : item.status === 'Late' ? '#f59e0b' : '#ef4444'}`
                    }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '6px' }}>
                    {item.location} &bull; {item.date} {item.time ? `at ${item.time}` : ''}
                  </div>
                  {item.isSubmitted && (
                    <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '6px', fontWeight: '600' }}>
                      ✓ Verified on Register
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' },
  subtitle: { color: 'var(--color-text-muted)' },
  select: { padding: '8px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' },
  topCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  card: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' },
  cardIcon: { padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' },
  cardInfo: { display: 'flex', flexDirection: 'column' },
  cardLabel: { fontSize: '0.85rem', color: 'var(--color-text-muted)' },
  cardValue: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' },
  section: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-main)', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  chartContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingTop: '20px' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, height: '100%', position: 'relative' },
  bar: { width: '40px', background: 'rgba(59, 130, 246, 0.5)', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s ease', alignSelf: 'flex-end' },
  barLabel: { fontSize: '0.8rem', color: 'var(--color-text-muted)' },
  barValue: { fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-main)' },
  badgeContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  badgeItem: { display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' },
  badgeCircle: { width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' },
  badgeInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  badgeLegend: { marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' },
  legendTitle: { fontSize: '0.9rem', marginBottom: '8px', color: 'var(--color-text-main)' },
  legendGrid: { display: 'flex', gap: '16px', fontSize: '0.85rem', fontWeight: '600' }
};
