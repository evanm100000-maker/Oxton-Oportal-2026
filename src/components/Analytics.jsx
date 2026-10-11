import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart2, Activity, Users, Shield, Server, FileText } from 'lucide-react';

export default function Analytics() {
  const { users, activeUsers, onlineUsers, flightLogs, reports, flights } = useApp();

  // Compute logs per day (last 7 days)
  const logsPerDayData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
      
      const count = flightLogs.filter(l => {
        if (!l.timestamp) return false;
        const logTime = new Date(l.timestamp).getTime();
        return logTime >= startOfDay && logTime < endOfDay;
      }).length;
      
      data.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), count });
    }
    return data;
  }, [flightLogs]);
  const maxLogs = Math.max(...logsPerDayData.map(d => d.count), 1);

  // Compute reports per week (last 4 weeks)
  const reportsPerWeekData = useMemo(() => {
    const data = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - (i * 7 + 7));
      const end = new Date();
      end.setDate(end.getDate() - (i * 7));
      
      const count = reports.filter(r => {
        const rDate = new Date(r.timestamp);
        return rDate >= start && rDate < end;
      }).length;
      
      data.push({ week: `Week -${i}`, count });
    }
    return data;
  }, [reports]);
  const maxReports = Math.max(...reportsPerWeekData.map(d => d.count), 1);

  // Compute total historical allocations based on unique flight codes
  const totalAllocations = useMemo(() => {
    const codes = new Set();
    flights.forEach(f => {
      if (f.flightCode) codes.add(f.flightCode);
    });
    flightLogs.forEach(l => {
      if (l.flightCode) codes.add(l.flightCode);
    });
    return Math.max(codes.size, flights.length); // Ensure it's at least the current active count
  }, [flights, flightLogs]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h3 style={styles.title}>System Analytics</h3>
          <p style={styles.subtitle}>Server-wide statistics and staff activity.</p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div className="glass-panel" style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa'}}><Users size={24}/></div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Total Active Staff</span>
            <strong style={styles.statValue}>{activeUsers.length}</strong>
          </div>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399'}}><Activity size={24}/></div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Currently Online</span>
            <strong style={styles.statValue}>{Object.keys(onlineUsers).filter(k => onlineUsers[k]).length}</strong>
          </div>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa'}}><FileText size={24}/></div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Total Flight Logs</span>
            <strong style={styles.statValue}>{flightLogs.length}</strong>
          </div>
        </div>
        <div className="glass-panel" style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24'}}><Server size={24}/></div>
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Total Allocations</span>
            <strong style={styles.statValue}>{totalAllocations}</strong>
          </div>
        </div>
      </div>

      <div style={styles.chartsGrid}>
        <div className="glass-panel" style={styles.chartCard}>
          <h4 style={styles.chartTitle}><BarChart2 size={18}/> Logs Submitted (Last 7 Days)</h4>
          <div style={styles.chartContainer}>
            {logsPerDayData.map((d, i) => (
              <div key={i} style={styles.barWrapper}>
                <div style={{...styles.bar, height: `${(d.count / maxLogs) * 100}%`, background: 'rgba(96, 165, 250, 0.5)'}}></div>
                <span style={styles.barLabel}>{d.date}</span>
                <span style={styles.barValue}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={styles.chartCard}>
          <h4 style={styles.chartTitle}><Shield size={18}/> Reports Handled (Last 4 Weeks)</h4>
          <div style={styles.chartContainer}>
            {reportsPerWeekData.map((d, i) => (
              <div key={i} style={styles.barWrapper}>
                <div style={{...styles.bar, height: `${(d.count / maxReports) * 100}%`, background: 'rgba(248, 113, 113, 0.5)'}}></div>
                <span style={styles.barLabel}>{d.week}</span>
                <span style={styles.barValue}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' },
  headerText: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' },
  subtitle: { color: 'var(--color-text-muted)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  statCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '24px' },
  statIcon: { padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statInfo: { display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '0.85rem', color: '#9ca3af' },
  statValue: { fontSize: '1.5rem', fontWeight: '700', color: '#fff' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' },
  chartCard: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  chartTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' },
  chartContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '220px', paddingTop: '20px' },
  barWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, height: '100%', position: 'relative' },
  bar: { width: '40px', borderRadius: '4px 4px 0 0', minHeight: '4px', transition: 'height 0.3s ease', alignSelf: 'flex-end' },
  barLabel: { fontSize: '0.8rem', color: '#9ca3af' },
  barValue: { fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', position: 'absolute', top: '-24px' }
};
