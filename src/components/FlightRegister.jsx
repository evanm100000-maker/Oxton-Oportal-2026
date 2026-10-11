import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, CheckCircle, XCircle, Clock, ShieldCheck, Plane, Search, Calendar } from 'lucide-react';

const escapeEmail = (email) => (email ? email.replace(/\./g, ',') : '');

export default function FlightRegister() {
  const { flights, users, currentUser, markFlightAttendance } = useApp();
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sort flights descending by date/time
  const sortedFlights = [...flights].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time || '00:00'}`).getTime() || 0;
    const db = new Date(`${b.date}T${b.time || '00:00'}`).getTime() || 0;
    return db - da;
  });

  const activeFlight = flights.find(f => f.id === (selectedFlightId || sortedFlights[0]?.id)) || sortedFlights[0];

  // Eligible crew assigned or allocated to this flight
  const allocatedCrew = (activeFlight?.allocatedStaff || []).map(email => {
    const u = users.find(user => user.email === email);
    const safe = escapeEmail(email);
    const mark = (activeFlight?.attendanceRecord && activeFlight.attendanceRecord[safe]) || 'Pending';
    return {
      email,
      name: u ? `${u.firstName} ${u.lastName}` : email,
      robloxUsername: u?.robloxUsername || '',
      profilePicture: u?.profilePicture || '',
      customRole: u?.customRole || '',
      mark
    };
  });

  const filteredCrew = allocatedCrew.filter(member => {
    const matchesSearch = `${member.name} ${member.robloxUsername} ${member.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'Present') return member.mark === 'Present';
    if (statusFilter === 'Absent') return member.mark === 'Absent';
    if (statusFilter === 'Pending') return member.mark === 'Pending' || !member.mark;
    return true;
  });

  const presentCount = allocatedCrew.filter(c => c.mark === 'Present').length;
  const absentCount = allocatedCrew.filter(c => c.mark === 'Absent').length;
  const pendingCount = allocatedCrew.filter(c => c.mark !== 'Present' && c.mark !== 'Absent').length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerBanner} className="glass-panel">
        <div>
          <h2 style={styles.pageTitle}>
            <Users size={26} color="#3b82f6" />
            Flight Attendance Register
          </h2>
          <p style={styles.pageSubtitle}>
            View allocated flight crew and mark attendance as Present or Absent. Verified Present marks complete staff flight quotas.
          </p>
        </div>

        {/* Flight Picker */}
        <div style={styles.flightPickerWrap}>
          <label style={styles.pickerLabel}>Selected Flight:</label>
          <select
            value={activeFlight?.id || ''}
            onChange={(e) => setSelectedFlightId(e.target.value)}
            className="input-field"
            style={styles.flightSelect}
          >
            {sortedFlights.map(f => (
              <option key={f.id} value={f.id}>
                {f.flightCode} &mdash; {f.location} ({f.date} {f.time})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!activeFlight ? (
        <div style={styles.emptyState}>
          <Plane size={48} color="rgba(255,255,255,0.2)" />
          <p>No flights scheduled in the system.</p>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
          <div style={styles.kpiRow}>
            <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <span style={styles.kpiLabel}>Allocated Crew</span>
              <strong style={{ ...styles.kpiVal, color: '#60a5fa' }}>{allocatedCrew.length}</strong>
            </div>
            <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <span style={styles.kpiLabel}>Present</span>
              <strong style={{ ...styles.kpiVal, color: '#34d399' }}>{presentCount}</strong>
            </div>
            <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <span style={styles.kpiLabel}>Absent</span>
              <strong style={{ ...styles.kpiVal, color: '#f87171' }}>{absentCount}</strong>
            </div>
            <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <span style={styles.kpiLabel}>Pending Verification</span>
              <strong style={{ ...styles.kpiVal, color: '#fbbf24' }}>{pendingCount}</strong>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={18} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search crew by name or roblox username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.filterPills}>
              {['All', 'Present', 'Absent', 'Pending'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  style={{
                    ...styles.pillBtn,
                    background: statusFilter === tab ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                    borderColor: statusFilter === tab ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                    color: statusFilter === tab ? '#60a5fa' : '#9ca3af'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Crew List / Register Table */}
          {filteredCrew.length === 0 ? (
            <div style={styles.emptyCrewState} className="glass-panel">
              <Users size={40} color="rgba(255,255,255,0.2)" />
              <p style={{ color: '#9ca3af', margin: '8px 0 0 0' }}>
                {allocatedCrew.length === 0
                  ? 'No staff have allocated themselves to this flight yet. Once staff allocate via Operations, they appear on this register.'
                  : 'No staff match the selected filter.'}
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper} className="glass-panel">
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Staff Member</th>
                    <th style={styles.th}>Roblox Username</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    {currentUser.isAdmin && <th style={{ ...styles.th, textAlign: 'right' }}>Admin Verification</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCrew.map(member => {
                    const isPresent = member.mark === 'Present';
                    const isAbsent = member.mark === 'Absent';
                    const isPending = !isPresent && !isAbsent;

                    return (
                      <tr key={member.email} style={styles.trBody}>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={styles.avatar}>
                              {member.profilePicture ? (
                                <img src={member.profilePicture} alt="PFP" style={styles.avatarImg} />
                              ) : (
                                <span>{member.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{member.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.robloxBadge}>@{member.robloxUsername || 'N/A'}</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.roleBadge}>{member.customRole || 'Crew'}</span>
                        </td>
                        <td style={styles.td}>
                          {isPresent && (
                            <span style={{ ...styles.statusTag, background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                              <CheckCircle size={14} /> Present
                            </span>
                          )}
                          {isAbsent && (
                            <span style={{ ...styles.statusTag, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                              <XCircle size={14} /> Absent
                            </span>
                          )}
                          {isPending && (
                            <span style={{ ...styles.statusTag, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                              <Clock size={14} /> Pending
                            </span>
                          )}
                        </td>
                        {currentUser.isAdmin && (
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => markFlightAttendance(activeFlight.id, member.email, 'Present')}
                                style={{
                                  ...styles.actionBtn,
                                  background: isPresent ? '#10b981' : 'rgba(16, 185, 129, 0.15)',
                                  color: isPresent ? '#ffffff' : '#34d399',
                                  borderColor: isPresent ? '#10b981' : 'rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                <CheckCircle size={14} /> Present
                              </button>
                              <button
                                type="button"
                                onClick={() => markFlightAttendance(activeFlight.id, member.email, 'Absent')}
                                style={{
                                  ...styles.actionBtn,
                                  background: isAbsent ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                                  color: isAbsent ? '#ffffff' : '#f87171',
                                  borderColor: isAbsent ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'
                                }}
                              >
                                <XCircle size={14} /> Absent
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  headerBanner: {
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap'
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
    margin: '6px 0 0 0',
    fontSize: '0.92rem',
    color: '#9ca3af'
  },
  flightPickerWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '280px'
  },
  pickerLabel: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase'
  },
  flightSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--color-text-main)',
    border: '1px solid var(--color-border)',
    fontSize: '0.9rem'
  },
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  kpiCard: {
    padding: '18px 20px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    border: '1px solid'
  },
  kpiLabel: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase'
  },
  kpiVal: {
    fontSize: '1.8rem',
    fontWeight: '800'
  },
  filterBar: {
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
    gap: '8px'
  },
  pillBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.2s ease'
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#9ca3af',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  emptyCrewState: {
    padding: '50px 20px',
    borderRadius: '14px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  tableWrapper: {
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  trHead: {
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  th: {
    padding: '14px 18px',
    fontSize: '0.82rem',
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
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    overflow: 'hidden'
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  robloxBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.05)',
    color: '#cbd5e1',
    fontSize: '0.82rem',
    fontFamily: 'monospace'
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
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '0.82rem',
    fontWeight: '700',
    border: '1px solid'
  },
  actionBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    border: '1px solid',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s ease'
  }
};
