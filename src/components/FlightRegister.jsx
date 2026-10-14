import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, CheckCircle, XCircle, Clock, ShieldCheck, Plane, Search, Calendar, UserPlus, Trash2, RotateCcw, AlertTriangle, Check, Shield } from 'lucide-react';

const escapeEmail = (email) => (email ? email.replace(/\./g, ',') : '');
const unescapeEmail = (email) => (email ? email.replace(/,/g, '.') : '');

export default function FlightRegister() {
  const { 
    flights, 
    users, 
    currentUser, 
    markFlightAttendance, 
    submitFlightRegister, 
    reopenFlightRegister, 
    allocateStaffDirectly, 
    deallocateStaffDirectly 
  } = useApp();

  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [staffToAdd, setStaffToAdd] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.siteRole === 'Admin' || currentUser?.siteRole === 'Owner' || currentUser?.siteRole === 'Moderator');

  // Sort flights descending by date/time
  const sortedFlights = [...flights].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time || '00:00'}`).getTime() || 0;
    const db = new Date(`${b.date}T${b.time || '00:00'}`).getTime() || 0;
    return db - da;
  });

  const activeFlight = flights.find(f => f.id === (selectedFlightId || sortedFlights[0]?.id)) || sortedFlights[0];

  // Eligible crew assigned or allocated to this flight (from allocatedStaff OR staffStatus === 'Attending')
  const allocatedCrewEmails = React.useMemo(() => {
    if (!activeFlight) return [];
    const set = new Set();
    
    // Direct allocatedStaff who have not explicitly marked themselves Absent or Undecided
    (activeFlight.allocatedStaff || []).forEach(e => {
      const safe = escapeEmail(e);
      const st = activeFlight.staffStatus?.[safe] || activeFlight.staffStatus?.[e];
      if (st !== 'Absent' && st !== 'Undecided') {
        set.add(e);
      }
    });

    // Any staff whose staffStatus is marked 'Attending'
    if (activeFlight.staffStatus) {
      Object.keys(activeFlight.staffStatus).forEach(k => {
        if (activeFlight.staffStatus[k] === 'Attending') {
          set.add(unescapeEmail(k));
        }
      });
    }

    return Array.from(set);
  }, [activeFlight]);

  const allocatedCrew = allocatedCrewEmails.map(email => {
    const u = users.find(user => user.email === email);
    const safe = escapeEmail(email);
    const mark = (activeFlight?.attendanceRecord && activeFlight.attendanceRecord[safe]) || 'Pending';
    return {
      email,
      name: u ? `${u.firstName} ${u.lastName}` : email,
      robloxUsername: u?.robloxUsername || '',
      profilePicture: u?.profilePicture || '',
      customRole: u?.customRole || u?.role || 'Staff',
      mark
    };
  });

  const filteredCrew = allocatedCrew.filter(member => {
    const matchesSearch = `${member.name} ${member.robloxUsername} ${member.email}`.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'Present') return member.mark === 'Present';
    if (statusFilter === 'Late') return member.mark === 'Late';
    if (statusFilter === 'Absent') return member.mark === 'Absent';
    if (statusFilter === 'Pending') return member.mark === 'Pending' || !member.mark;
    return true;
  });

  const presentCount = allocatedCrew.filter(c => c.mark === 'Present').length;
  const lateCount = allocatedCrew.filter(c => c.mark === 'Late').length;
  const absentCount = allocatedCrew.filter(c => c.mark === 'Absent').length;
  const pendingCount = allocatedCrew.filter(c => c.mark !== 'Present' && c.mark !== 'Late' && c.mark !== 'Absent').length;

  const unallocatedCrew = (users || []).filter(u => 
    u && u.email && !allocatedCrewEmails.includes(u.email)
  ).sort((a, b) => `${a.firstName || ''} ${a.lastName || ''}`.localeCompare(`${b.firstName || ''} ${b.lastName || ''}`));

  const handleSubmit = () => {
    if (!activeFlight) return;
    const confirmText = `Submit attendance register for flight ${activeFlight.flightCode}? This will record flight attendance onto staff profiles, credit completed flight quotas, and award points.`;
    if (window.confirm(confirmText)) {
      submitFlightRegister(activeFlight.id);
      setFeedbackMsg(`Flight register for ${activeFlight.flightCode} submitted successfully! Attendance recorded to staff profiles.`);
      setTimeout(() => setFeedbackMsg(''), 5000);
    }
  };

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
            When staff allocate as attending, they appear on this register. Mark staff as Present, Late, or Absent and submit the register to credit completed flights onto their profile and quota.
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
                {f.flightCode} &mdash; {f.location} ({f.date} {f.time}) {f.registerSubmitted ? '✓ [Submitted]' : '[Draft]'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedbackMsg && (
        <div style={styles.feedbackBanner}>
          <CheckCircle size={18} color="#10b981" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {!activeFlight ? (
        <div style={styles.emptyState}>
          <Plane size={48} color="rgba(255,255,255,0.2)" />
          <p>No flights scheduled in the system.</p>
        </div>
      ) : (
        <>
          {/* Submission Status Banner & Primary Submit Button */}
          {activeFlight.registerSubmitted ? (
            <div style={styles.submittedBanner} className="glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={styles.submittedIconWrap}>
                  <CheckCircle size={26} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontWeight: '800', color: '#34d399', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Flight Register Submitted & Recorded to Profiles
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '4px' }}>
                    Submitted by <strong>{activeFlight.registerSubmittedBy || 'Admin'}</strong> on {activeFlight.registerSubmittedAt ? new Date(activeFlight.registerSubmittedAt).toLocaleString() : 'N/A'}. Staff marked Present or Late have received +7 points and completed flight log credit towards their quota.
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                  >
                    <Check size={14} style={{ marginRight: '6px' }} /> Update & Re-submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Reopen register as draft? Staff marks can then be re-edited.")) {
                        reopenFlightRegister(activeFlight.id);
                        setFeedbackMsg("Flight register reopened as draft.");
                        setTimeout(() => setFeedbackMsg(''), 4000);
                      }
                    }}
                    className="btn-secondary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                  >
                    <RotateCcw size={14} style={{ marginRight: '6px' }} /> Reopen Draft
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.draftBanner} className="glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div style={styles.draftIconWrap}>
                  <Clock size={26} color="#fbbf24" />
                </div>
                <div>
                  <div style={{ fontWeight: '800', color: '#fbbf24', fontSize: '1.05rem' }}>
                    Flight Register In Progress (Draft)
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '4px' }}>
                    Mark crew as Present, Late, or Absent below. Once marked Present or Late and the register is submitted, it goes onto their profile and completes their flight quota.
                  </div>
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  disabled={allocatedCrew.length === 0}
                  onClick={handleSubmit}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontSize: '0.92rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#10b981',
                    borderColor: '#059669',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: allocatedCrew.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)',
                    opacity: allocatedCrew.length === 0 ? 0.5 : 1
                  }}
                >
                  <CheckCircle size={18} /> Submit Flight Register
                </button>
              )}
            </div>
          )}

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
            <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <span style={styles.kpiLabel}>Late</span>
              <strong style={{ ...styles.kpiVal, color: '#fbbf24' }}>{lateCount}</strong>
            </div>
            <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <span style={styles.kpiLabel}>Absent</span>
              <strong style={{ ...styles.kpiVal, color: '#f87171' }}>{absentCount}</strong>
            </div>
            <div className="glass-panel" style={{ ...styles.kpiCard, borderColor: 'rgba(156, 163, 175, 0.3)' }}>
              <span style={styles.kpiLabel}>Unverified</span>
              <strong style={{ ...styles.kpiVal, color: '#cbd5e1' }}>{pendingCount}</strong>
            </div>
          </div>

          {/* Admin manual crew addition */}
          {isAdmin && (
            <div style={styles.addCrewBar} className="glass-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#3b82f6" />
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-main)' }}>Manually Add Staff to Register:</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                <select
                  value={staffToAdd}
                  onChange={(e) => setStaffToAdd(e.target.value)}
                  className="input-field"
                  style={{ flex: 1, minWidth: '220px', padding: '8px 12px', fontSize: '0.88rem' }}
                >
                  <option value="">-- Select staff to add to this flight --</option>
                  {unallocatedCrew.map(u => (
                    <option key={u.email} value={u.email}>
                      {u.firstName} {u.lastName} (@{u.robloxUsername || 'N/A'}) &mdash; {u.customRole || u.role || 'Staff'}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!staffToAdd}
                  onClick={() => {
                    if (staffToAdd && activeFlight) {
                      allocateStaffDirectly(activeFlight.id, staffToAdd);
                      setStaffToAdd('');
                    }
                  }}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={15} /> Add to Flight
                </button>
              </div>
            </div>
          )}

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
              {['All', 'Present', 'Late', 'Absent', 'Pending'].map(tab => (
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
                  ? 'No staff have allocated themselves to this flight yet. When a person marks "Attending" on this flight, they will immediately appear on this register.'
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
                    <th style={styles.th}>Attendance Mark</th>
                    {isAdmin && <th style={{ ...styles.th, textAlign: 'right' }}>Admin Verification (Present / Late / Absent)</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCrew.map(member => {
                    const isPresent = member.mark === 'Present';
                    const isLate = member.mark === 'Late';
                    const isAbsent = member.mark === 'Absent';
                    const isPending = !isPresent && !isLate && !isAbsent;

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
                          {isLate && (
                            <span style={{ ...styles.statusTag, background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                              <Clock size={14} /> Late
                            </span>
                          )}
                          {isAbsent && (
                            <span style={{ ...styles.statusTag, background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                              <XCircle size={14} /> Absent
                            </span>
                          )}
                          {isPending && (
                            <span style={{ ...styles.statusTag, background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', borderColor: 'rgba(156, 163, 175, 0.3)' }}>
                              <Clock size={14} /> Pending
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                              {/* Present Button */}
                              <button
                                type="button"
                                onClick={() => markFlightAttendance(activeFlight.id, member.email, 'Present')}
                                title="Mark Present (+7 pts & Quota Credit on Submit)"
                                style={{
                                  ...styles.actionBtn,
                                  background: isPresent ? '#10b981' : 'rgba(16, 185, 129, 0.15)',
                                  color: isPresent ? '#ffffff' : '#34d399',
                                  borderColor: isPresent ? '#10b981' : 'rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                <CheckCircle size={14} /> Present
                              </button>

                              {/* Late Button */}
                              <button
                                type="button"
                                onClick={() => markFlightAttendance(activeFlight.id, member.email, 'Late')}
                                title="Mark Late"
                                style={{
                                  ...styles.actionBtn,
                                  background: isLate ? '#f59e0b' : 'rgba(245, 158, 11, 0.15)',
                                  color: isLate ? '#ffffff' : '#fbbf24',
                                  borderColor: isLate ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'
                                }}
                              >
                                <Clock size={14} /> Late
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => markFlightAttendance(activeFlight.id, member.email, 'Absent')}
                                title="Mark Absent"
                                style={{
                                  ...styles.actionBtn,
                                  background: isAbsent ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                                  color: isAbsent ? '#ffffff' : '#f87171',
                                  borderColor: isAbsent ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'
                                }}
                              >
                                <XCircle size={14} /> Absent
                              </button>

                              {/* Reset to Pending */}
                              {!isPending && (
                                <button
                                  type="button"
                                  onClick={() => markFlightAttendance(activeFlight.id, member.email, 'Pending')}
                                  title="Reset status back to Pending"
                                  style={{
                                    ...styles.iconActionBtn,
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#fbbf24',
                                    borderColor: 'rgba(245, 158, 11, 0.3)'
                                  }}
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}

                              {/* Remove from flight */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Remove ${member.name} from this flight register?`)) {
                                    deallocateStaffDirectly(activeFlight.id, member.email);
                                  }
                                }}
                                title="Remove staff member from flight"
                                style={{
                                  ...styles.iconActionBtn,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  color: '#9ca3af',
                                  borderColor: 'rgba(255, 255, 255, 0.1)'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Bottom Submit Action Bar */}
              {isAdmin && (
                <div style={styles.bottomSubmitBar}>
                  <div style={{ color: '#9ca3af', fontSize: '0.88rem' }}>
                    {presentCount} Present &bull; {lateCount} Late &bull; {absentCount} Absent &bull; {pendingCount} Pending
                  </div>
                  <button
                    type="button"
                    disabled={allocatedCrew.length === 0}
                    onClick={handleSubmit}
                    className="btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: '0.92rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#10b981',
                      borderColor: '#059669',
                      color: '#ffffff',
                      fontWeight: '700',
                      cursor: allocatedCrew.length === 0 ? 'not-allowed' : 'pointer',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <CheckCircle size={18} /> {activeFlight.registerSubmitted ? 'Update & Re-submit Register' : 'Submit Flight Register'}
                  </button>
                </div>
              )}
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
  submittedBanner: {
    padding: '18px 22px',
    borderRadius: '14px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    flexWrap: 'wrap'
  },
  submittedIconWrap: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  draftBanner: {
    padding: '18px 22px',
    borderRadius: '14px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    flexWrap: 'wrap'
  },
  draftIconWrap: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'rgba(245, 158, 11, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    gap: '8px',
    flexWrap: 'wrap'
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
  addCrewBar: {
    padding: '14px 18px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    flexWrap: 'wrap',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    background: 'rgba(59, 130, 246, 0.05)'
  },
  tableWrapper: {
    borderRadius: '14px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    border: '1px solid rgba(255,255,255,0.06)'
  },
  table: {
    width: '100%',
    minWidth: '760px',
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
  },
  iconActionBtn: {
    padding: '7px 9px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },
  bottomSubmitBar: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexWrap: 'wrap',
    gap: '12px'
  }
};
