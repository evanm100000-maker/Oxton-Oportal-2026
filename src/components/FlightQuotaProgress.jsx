import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plane, Users, CheckCircle, Clock, AlertCircle, RotateCcw, Search, User, Shield, Trophy, ExternalLink, Plus, Minus, X } from 'lucide-react';

const escapeEmail = (email) => (email ? email.replace(/\./g, ',') : '');

export default function FlightQuotaProgress() {
  const { 
    users, 
    activeUsers, 
    onlineUsers, 
    flights = [], 
    flightLogs = [], 
    loaRequests = [], 
    currentUser, 
    quotaConfig, 
    resetAllFlightQuotas, 
    resetStaffQuota, 
    adjustStaffQuota 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('All');
  const [sortBy, setSortBy] = useState('progress_desc'); // 'progress_desc', 'progress_asc', 'name'
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [selectedStaffProfile, setSelectedStaffProfile] = useState(null);

  const quotaTarget = 3;
  const resetTime = quotaConfig?.lastResetDate ? new Date(quotaConfig.lastResetDate).getTime() : 0;

  // Compute flight statistics for a specific staff member
  const getStaffStats = (user) => {
    if (!user?.email) return { currentQuota: 0, lifetimeFlights: 0, cycleFlightCodes: [], isOnLoa: false, isSuspended: false };
    const email = user.email;
    const safeEmail = escapeEmail(email);

    // Lifetime flights
    const lifetimeSet = new Set();
    const cycleSet = new Set();
    const cycleCodes = [];

    // Submitted flight registers
    (flights || []).forEach(f => {
      const mark = f.attendanceRecord?.[safeEmail];
      if ((mark === 'Present' || mark === 'Late') && f.registerSubmitted) {
        lifetimeSet.add(f.id);
        const flightTime = f.registerSubmittedAt 
          ? new Date(f.registerSubmittedAt).getTime() 
          : (f.date ? new Date(`${f.date}T${f.time || '00:00'}`).getTime() : 0);
        if (flightTime >= resetTime) {
          cycleSet.add(f.id);
          cycleCodes.push(f.flightCode || f.id);
        }
      }
    });

    // Approved flight logs
    (flightLogs || []).forEach(log => {
      if (log.status === 'Approved' && log.submitterEmail === email) {
        const id = log.flightId || log.id;
        lifetimeSet.add(id);
        const logTime = log.timestamp ? new Date(log.timestamp).getTime() : 0;
        if (logTime >= resetTime) {
          cycleSet.add(id);
          cycleCodes.push(log.flightCode || id);
        }
      }
    });

    // Check user.quotaFlights if explicitly set/adjusted
    let currentQuota = cycleSet.size;
    if (user.quotaFlights !== undefined && resetTime > 0 && user.lastQuotaReset === quotaConfig?.lastResetDate) {
      currentQuota = Number(user.quotaFlights);
    } else if (user.quotaFlights !== undefined && resetTime === 0) {
      currentQuota = Math.max(cycleSet.size, Number(user.quotaFlights));
    }

    const isOnLoa = loaRequests.some(l => l.userEmail === email && l.status === 'Approved');
    const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now();

    return {
      currentQuota,
      lifetimeFlights: lifetimeSet.size,
      cycleFlightCodes: cycleCodes,
      isOnLoa,
      isSuspended
    };
  };

  // Build the list of active staff with their quota progress
  const staffQuotaList = useMemo(() => {
    return activeUsers.map(user => {
      const stats = getStaffStats(user);
      const percent = Math.min(100, Math.round((stats.currentQuota / quotaTarget) * 100));
      const isCompleted = stats.currentQuota >= quotaTarget;

      return {
        ...user,
        stats,
        percent,
        isCompleted
      };
    });
  }, [activeUsers, flights, flightLogs, loaRequests, quotaConfig, resetTime]);

  // Overall KPI statistics
  const totalStaffCount = staffQuotaList.length;
  const completedCount = staffQuotaList.filter(s => s.isCompleted).length;
  const inProgressCount = staffQuotaList.filter(s => !s.isCompleted && s.stats.currentQuota > 0).length;
  const zeroCount = staffQuotaList.filter(s => s.stats.currentQuota === 0).length;
  const loaCount = staffQuotaList.filter(s => s.stats.isOnLoa).length;
  const completionPercentage = totalStaffCount > 0 ? Math.round((completedCount / totalStaffCount) * 100) : 0;

  // Filter and sort staff
  const filteredStaff = staffQuotaList.filter(member => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = `${member.firstName} ${member.lastName} ${member.robloxUsername} ${member.email}`.toLowerCase().includes(query);
    if (!matchesSearch) return false;

    if (filterTab === 'Completed') return member.isCompleted;
    if (filterTab === 'InProgress') return !member.isCompleted && member.stats.currentQuota > 0;
    if (filterTab === 'Zero') return member.stats.currentQuota === 0;
    if (filterTab === 'LOA') return member.stats.isOnLoa;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'progress_desc') return b.stats.currentQuota - a.stats.currentQuota;
    if (sortBy === 'progress_asc') return a.stats.currentQuota - b.stats.currentQuota;
    if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    return 0;
  });

  const handleResetAll = () => {
    const confirmPrompt = 'Are you sure you want to reset all staff flight quota progress to 0?\n\nThis will clear current quota progress for all staff to begin a new quota cycle.\n(Lifetime flight attendance on staff profiles will NOT be deleted).';
    if (window.confirm(confirmPrompt)) {
      resetAllFlightQuotas();
      setFeedbackMsg('All staff flight quota progress has been cleared to 0.');
      setTimeout(() => setFeedbackMsg(''), 5000);
    }
  };

  const handleResetSingle = (member) => {
    if (window.confirm(`Reset flight quota progress for ${member.firstName} ${member.lastName} to 0?`)) {
      resetStaffQuota(member.email);
      setFeedbackMsg(`Reset flight quota for ${member.firstName} ${member.lastName}.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    }
  };

  const handleAdjustSingle = (member, delta) => {
    adjustStaffQuota(member.email, delta);
    setFeedbackMsg(`Adjusted flight quota for ${member.firstName} ${member.lastName} by ${delta > 0 ? `+${delta}` : delta}.`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  return (
    <div style={styles.container}>
      {/* Top Header Banner with the Reset Button */}
      <div style={styles.headerCard} className="glass-panel">
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={styles.pageTitle}>
            <Plane size={28} color="#3b82f6" />
            Staff Flight Quota Management
          </h2>
          <p style={styles.pageSubtitle}>
            Monitor all staff flight quota compliance. Each staff member needs <strong>{quotaTarget} completed flights</strong> per quota cycle (via verified flight register attendance or approved flight logs).
          </p>
          {quotaConfig?.lastResetDate && (
            <div style={styles.lastResetNote}>
              <Clock size={14} color="#9ca3af" />
              <span>
                Current Quota Cycle Started: <strong>{new Date(quotaConfig.lastResetDate).toLocaleDateString()} at {new Date(quotaConfig.lastResetDate).toLocaleTimeString()}</strong> {quotaConfig.resetByName ? `by ${quotaConfig.resetByName}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* The prominent RESET button on the top which clears all quota progress */}
        <div style={styles.resetWrap}>
          <button
            type="button"
            onClick={handleResetAll}
            className="btn-primary"
            style={styles.resetBtn}
            title="Reset flight quota progress to 0 for all staff members"
          >
            <RotateCcw size={18} />
            Reset All Staff Quotas
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div style={styles.feedbackBanner}>
          <CheckCircle size={18} color="#10b981" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={styles.kpiGrid}>
        <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
          <span style={styles.kpiLabel}>Total Active Staff</span>
          <div style={styles.kpiValueRow}>
            <strong style={{ ...styles.kpiVal, color: '#60a5fa' }}>{totalStaffCount}</strong>
            <Users size={24} color="#3b82f6" opacity={0.6} />
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <span style={styles.kpiLabel}>Quota Completed (3+ Flights)</span>
          <div style={styles.kpiValueRow}>
            <strong style={{ ...styles.kpiVal, color: '#34d399' }}>{completedCount}</strong>
            <span style={styles.kpiSubBadge}>{completionPercentage}%</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <span style={styles.kpiLabel}>In Progress (1-2 Flights)</span>
          <div style={styles.kpiValueRow}>
            <strong style={{ ...styles.kpiVal, color: '#fbbf24' }}>{inProgressCount}</strong>
            <Clock size={24} color="#f59e0b" opacity={0.6} />
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <span style={styles.kpiLabel}>Zero Flights (0 / 3)</span>
          <div style={styles.kpiValueRow}>
            <strong style={{ ...styles.kpiVal, color: '#f87171' }}>{zeroCount}</strong>
            <AlertCircle size={24} color="#ef4444" opacity={0.6} />
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(139, 92, 246, 0.3)' }}>
          <span style={styles.kpiLabel}>On Approved LOA (Excused)</span>
          <div style={styles.kpiValueRow}>
            <strong style={{ ...styles.kpiVal, color: '#c084fc' }}>{loaCount}</strong>
            <Shield size={24} color="#8b5cf6" opacity={0.6} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={styles.controlBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search staff by name, Roblox username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterPills}>
          {[
            { id: 'All', label: `All Staff (${totalStaffCount})` },
            { id: 'Completed', label: `Quota Met (${completedCount})` },
            { id: 'InProgress', label: `In Progress (${inProgressCount})` },
            { id: 'Zero', label: `0 Flights (${zeroCount})` },
            { id: 'LOA', label: `On LOA (${loaCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              style={{
                ...styles.pillBtn,
                background: filterTab === tab.id ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                borderColor: filterTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                color: filterTab === tab.id ? '#60a5fa' : '#9ca3af'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={styles.sortWrapper}>
          <label style={styles.sortLabel}>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
            style={styles.sortSelect}
          >
            <option value="progress_desc">Quota (Highest First)</option>
            <option value="progress_asc">Quota (Lowest First)</option>
            <option value="name">Staff Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Staff Quota Table */}
      {filteredStaff.length === 0 ? (
        <div style={styles.emptyState} className="glass-panel">
          <Plane size={48} color="rgba(255,255,255,0.2)" />
          <p style={{ margin: '8px 0 0 0', color: '#9ca3af' }}>No staff members match the selected filter.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper} className="glass-panel">
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Staff Member</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Current Quota Progress</th>
                <th style={styles.th}>Cycle Flights</th>
                <th style={styles.th}>Lifetime</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(member => {
                const isOnline = member.email && onlineUsers[member.email.replace(/\./g, ',')];
                const stats = member.stats;

                return (
                  <tr key={member.email} style={styles.trBody}>
                    {/* Staff Member */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.avatarWrap}>
                          {member.profilePicture ? (
                            <img src={member.profilePicture} alt="Avatar" style={styles.avatarImg} />
                          ) : (
                            <span>{member.firstName?.charAt(0) || 'U'}</span>
                          )}
                          {isOnline && <div style={styles.onlineDot} title="Online" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--color-text-main)' }}>
                            {member.firstName} {member.lastName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                            @{member.robloxUsername || 'N/A'} &bull; {member.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={styles.td}>
                      <span style={styles.roleBadge}>{member.customRole || member.role || 'Staff'}</span>
                    </td>

                    {/* Status */}
                    <td style={styles.td}>
                      {stats.isOnLoa ? (
                        <span style={{ ...styles.statusTag, background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', borderColor: 'rgba(139, 92, 246, 0.4)' }}>
                          LOA (Excused)
                        </span>
                      ) : stats.isSuspended ? (
                        <span style={{ ...styles.statusTag, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                          Suspended
                        </span>
                      ) : member.isCompleted ? (
                        <span style={{ ...styles.statusTag, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                          <CheckCircle size={13} /> Quota Met
                        </span>
                      ) : stats.currentQuota > 0 ? (
                        <span style={{ ...styles.statusTag, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                          <Clock size={13} /> In Progress
                        </span>
                      ) : (
                        <span style={{ ...styles.statusTag, background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                          No Flights
                        </span>
                      )}
                    </td>

                    {/* Current Quota Progress */}
                    <td style={{ ...styles.td, minWidth: '220px' }}>
                      <div style={styles.quotaCell}>
                        <div style={styles.quotaTextRow}>
                          <span style={{ fontWeight: '700', color: member.isCompleted ? '#34d399' : 'var(--color-text-main)', fontSize: '0.9rem' }}>
                            {stats.currentQuota} / {quotaTarget} Flights
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: member.isCompleted ? '#34d399' : stats.currentQuota > 0 ? '#60a5fa' : '#9ca3af' }}>
                            {member.percent}%
                          </span>
                        </div>
                        <div style={styles.progressBarTrack}>
                          <div
                            style={{
                              ...styles.progressBarFill,
                              width: `${member.percent}%`,
                              background: member.isCompleted ? '#10b981' : stats.currentQuota > 0 ? '#3b82f6' : '#4b5563',
                              boxShadow: member.isCompleted ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Cycle Flights */}
                    <td style={styles.td}>
                      {stats.cycleFlightCodes.length === 0 ? (
                        <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>None</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {stats.cycleFlightCodes.slice(0, 3).map((code, idx) => (
                            <span key={idx} style={styles.flightPill}>{code}</span>
                          ))}
                          {stats.cycleFlightCodes.length > 3 && (
                            <span style={{ ...styles.flightPill, background: 'rgba(255,255,255,0.08)' }}>+{stats.cycleFlightCodes.length - 3}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Lifetime Total */}
                    <td style={styles.td}>
                      <span style={{ fontWeight: '700', color: '#cbd5e1', fontSize: '0.9rem' }}>
                        {stats.lifetimeFlights} flights
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {/* +1 Flight button */}
                        <button
                          type="button"
                          onClick={() => handleAdjustSingle(member, 1)}
                          title="Manually credit +1 flight towards quota"
                          style={styles.iconMiniBtn}
                        >
                          <Plus size={14} color="#34d399" />
                        </button>

                        {/* -1 Flight button */}
                        <button
                          type="button"
                          disabled={stats.currentQuota <= 0}
                          onClick={() => handleAdjustSingle(member, -1)}
                          title="Deduct 1 flight from quota"
                          style={{ ...styles.iconMiniBtn, opacity: stats.currentQuota <= 0 ? 0.3 : 1 }}
                        >
                          <Minus size={14} color="#f87171" />
                        </button>

                        {/* Reset individual quota */}
                        <button
                          type="button"
                          onClick={() => handleResetSingle(member)}
                          title="Reset this staff member's quota progress back to 0"
                          style={styles.iconMiniBtn}
                        >
                          <RotateCcw size={14} color="#fbbf24" />
                        </button>

                        {/* View Attendance details modal */}
                        <button
                          type="button"
                          onClick={() => setSelectedStaffProfile(member)}
                          title="View flight attendance records"
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Profile Flight Attendance Modal */}
      {selectedStaffProfile && (
        <div style={styles.modalOverlay}>
          <div className="glass-panel" style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Plane size={22} color="#3b82f6" />
                <h3 style={styles.modalTitle}>Flight Quota Details: {selectedStaffProfile.firstName} {selectedStaffProfile.lastName}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedStaffProfile(null)}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Summary Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>Current Quota</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: selectedStaffProfile.isCompleted ? '#34d399' : '#60a5fa', marginTop: '2px' }}>
                    {selectedStaffProfile.stats.currentQuota} / {quotaTarget} Flights
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>Lifetime Completed</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
                    {selectedStaffProfile.stats.lifetimeFlights} Flights
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700' }}>Status</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: selectedStaffProfile.isCompleted ? '#34d399' : '#fbbf24', marginTop: '4px' }}>
                    {selectedStaffProfile.isCompleted ? '✓ Completed' : 'In Progress'}
                  </div>
                </div>
              </div>

              {/* Attendance list */}
              <h4 style={{ color: '#fff', fontSize: '0.98rem', margin: '0 0 10px 0' }}>Flight Register Records on Profile</h4>
              {(() => {
                const safeEmail = escapeEmail(selectedStaffProfile.email);
                const list = [];
                (flights || []).forEach(f => {
                  const mark = f.attendanceRecord?.[safeEmail];
                  if (mark && mark !== 'Pending') {
                    list.push({
                      flightId: f.id,
                      flightCode: f.flightCode,
                      date: f.date,
                      time: f.time,
                      location: f.location,
                      status: mark,
                      isSubmitted: f.registerSubmitted,
                      submittedAt: f.registerSubmittedAt
                    });
                  }
                });
                (selectedStaffProfile.attendedFlights || []).forEach(af => {
                  if (!list.some(r => r.flightId === af.flightId)) {
                    list.push({
                      flightId: af.flightId,
                      flightCode: af.flightCode,
                      date: af.date,
                      time: af.time,
                      location: af.location,
                      status: af.status,
                      isSubmitted: true,
                      submittedAt: af.submittedAt
                    });
                  }
                });

                if (list.length === 0) {
                  return (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                      No flight attendance records found for this staff member.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                    {list.map((rec, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>{rec.flightCode}</div>
                          <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: '2px' }}>
                            {rec.location} &bull; {rec.date} {rec.time ? `(${rec.time})` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            background: rec.status === 'Present' ? 'rgba(16, 185, 129, 0.2)' : rec.status === 'Late' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: rec.status === 'Present' ? '#34d399' : rec.status === 'Late' ? '#fbbf24' : '#f87171',
                            border: `1px solid ${rec.status === 'Present' ? '#10b981' : rec.status === 'Late' ? '#f59e0b' : '#ef4444'}`
                          }}>
                            {rec.status}
                          </span>
                          {rec.isSubmitted && <span style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: '600' }}>✓ Verified</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  headerCard: {
    padding: '24px 28px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    border: '1px solid rgba(255,255,255,0.08)'
  },
  pageTitle: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  pageSubtitle: {
    margin: '8px 0 0 0',
    fontSize: '0.92rem',
    color: '#9ca3af',
    lineHeight: '1.5'
  },
  lastResetNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '10px',
    fontSize: '0.82rem',
    color: '#9ca3af'
  },
  resetWrap: {
    display: 'flex',
    alignItems: 'center'
  },
  resetBtn: {
    padding: '12px 24px',
    borderRadius: '10px',
    background: '#ef4444',
    borderColor: '#dc2626',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.92rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 0 18px rgba(239, 68, 68, 0.35)',
    transition: 'all 0.2s ease'
  },
  feedbackBanner: {
    padding: '12px 18px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    fontSize: '0.92rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  kpiCard: {
    padding: '18px 20px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid'
  },
  kpiLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  kpiValueRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  kpiVal: {
    fontSize: '1.9rem',
    fontWeight: '800'
  },
  kpiSubBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    fontSize: '0.82rem',
    fontWeight: '700'
  },
  controlBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    flex: 1,
    minWidth: '260px'
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--color-text-main)',
    width: '100%',
    fontSize: '0.92rem'
  },
  filterPills: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  pillBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.84rem',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  sortWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sortLabel: {
    fontSize: '0.82rem',
    color: '#9ca3af',
    fontWeight: '600'
  },
  sortSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem'
  },
  tableWrapper: {
    borderRadius: '14px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  table: {
    width: '100%',
    minWidth: '820px',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  trHead: {
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  th: {
    padding: '14px 18px',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  trBody: {
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  td: {
    padding: '16px 18px',
    fontSize: '0.92rem',
    verticalAlign: 'middle'
  },
  avatarWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    position: 'relative'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  onlineDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#10b981',
    border: '2px solid #111827',
    position: 'absolute',
    bottom: 0,
    right: 0
  },
  roleBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(59, 130, 246, 0.12)',
    color: '#60a5fa',
    fontSize: '0.82rem',
    fontWeight: '600'
  },
  statusTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
    border: '1px solid'
  },
  quotaCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  quotaTextRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressBarTrack: {
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  flightPill: {
    padding: '2px 8px',
    borderRadius: '4px',
    background: 'rgba(59, 130, 246, 0.15)',
    color: '#93c5fd',
    fontSize: '0.78rem',
    fontWeight: '600'
  },
  iconMiniBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    padding: '20px'
  },
  modalContent: {
    width: '100%',
    maxWidth: '650px',
    maxHeight: '90vh',
    borderRadius: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  modalHeader: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  modalTitle: {
    margin: 0,
    color: '#fff',
    fontSize: '1.25rem',
    fontWeight: '700'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '24px'
  }
};
