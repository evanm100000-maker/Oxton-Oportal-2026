import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Plane, Calendar, Clock, MapPin, ExternalLink, Users, UserPlus, UserMinus, Trash2, Lock, Unlock, Link, Check } from 'lucide-react';
import { getRankWeight } from '../context/AppContext';
import { formatFlightTimeLocal, formatFlightDateLocal } from '../utils/timeUtils';

const escapeEmail = (email) => email ? email.replace(/\./g, ',') : '';
const unescapeEmail = (email) => email ? email.replace(/,/g, '.') : '';

export default function AllocationRequests() {
  const { 
    flights, 
    currentUser, 
    setAllocationStatus, 
    allocateStaffDirectly, 
    deallocateStaffDirectly,
    removeFlight,
    users,
    activeUsers,
    toggleFlightLock,
    editFlight
  } = useApp();

  const [activeRegisterFlight, setActiveRegisterFlight] = useState(null);
  const [directAssignEmail, setDirectAssignEmail] = useState({});
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' or 'previous'

  const [absenceModal, setAbsenceModal] = useState({ show: false, flightId: null, email: null, currentSelected: null });
  const [absenceReason, setAbsenceReason] = useState('');
  const [viewReasonModal, setViewReasonModal] = useState({ show: false, email: null, reason: null });

  // Calculate today's date in local time for fair comparison
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const upcomingFlights = flights.filter(f => f.date >= todayStr);
  const previousFlights = flights.filter(f => f.date < todayStr);
  const displayedFlights = viewMode === 'upcoming' ? upcomingFlights : previousFlights;

  const targetFlightId = new URLSearchParams(window.location.search).get('flightId');

  useEffect(() => {
    if (targetFlightId) {
      setTimeout(() => {
        const el = document.getElementById(`flight-${targetFlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [targetFlightId, flights]);

  const handleCopyLink = (flightId) => {
    const url = new URL(window.location.href);
    url.pathname = '/allocation-requests';
    url.searchParams.delete('tab');
    url.searchParams.set('flightId', flightId);
    navigator.clipboard.writeText(url.toString());
    setCopiedId(flightId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getMyStatus = (flight, email) => {
    const safeEmail = escapeEmail(email);
    if (flight.staffStatus) {
      if (flight.staffStatus[safeEmail]) return flight.staffStatus[safeEmail];
      if (flight.staffStatus[email]) return flight.staffStatus[email];
    }
    if ((flight.allocatedStaff || []).includes(email)) return 'Attending';
    return 'Undecided';
  };

  const getStaffList = (flight, targetStatus) => {
    let list = [];
    if (targetStatus === 'Attending') {
      (flight.allocatedStaff || []).forEach(e => {
        if (!list.includes(e)) {
          const safeEmail = escapeEmail(e);
          const status = flight.staffStatus 
            ? (flight.staffStatus[safeEmail] || flight.staffStatus[e]) 
            : null;
          if (status === 'Attending' || !status) {
            list.push(e);
          }
        }
      });
    }
    if (flight.staffStatus) {
      Object.keys(flight.staffStatus).forEach(k => {
        const email = unescapeEmail(k);
        const status = flight.staffStatus[k];
        if (status === targetStatus && !list.includes(email)) {
          list.push(email);
        }
      });
    }
    return list;
  };

  const getStaffNameByEmail = (email) => {
    const user = users.find(u => u.email === email);
    if (!user) return email;
    const rolePart = user.customRole ? ` (${user.customRole})` : '';
    return `${user.firstName} ${user.lastName} (@${user.robloxUsername})${rolePart}`;
  };

  const handleDirectAssign = (flightId) => {
    const email = directAssignEmail[flightId];
    if (!email) return;
    allocateStaffDirectly(flightId, email);
    setDirectAssignEmail(prev => ({ ...prev, [flightId]: '' }));
  };

  const eligibleStaff = activeUsers;

  
  if (activeRegisterFlight) {
    const flight = activeRegisterFlight;
    const attending = getStaffList(flight, 'Attending').filter(email => activeUsers.some(user => user.email === email));
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)', padding: '20px' }}>
        <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
            <div>
              <h2 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
                <Users size={24} /> Attendance Register
              </h2>
              <p style={{ margin: '6px 0 0 0', color: '#9ca3af', fontSize: '0.95rem' }}>{flight.flightCode} • {flight.location}</p>
            </div>
            <button onClick={() => setActiveRegisterFlight(null)} className="btn-secondary" style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff' }}>✕</button>
          </div>

          <div style={{ padding: '24px', flex: 1 }}>
            {attending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontSize: '1.1rem' }}>No staff attending to mark.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {attending.map(email => {
                  const user = activeUsers.find(u => u.email === email);
                  if (!user) return null;
                  
                  const currentMark = (flight.attendanceRecord && flight.attendanceRecord[escapeEmail(email)]) || 'Pending';
                  
                  return (
                    <div key={`modal-register-${email}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', flexWrap: 'wrap', gap: '16px' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#374151', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                          {user.profilePicture ? (
                             <img 
                              src={user.profilePicture} 
                              alt="PFP" 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                            />
                          ) : (
                             <span style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>
                               {user.firstName ? user.firstName.charAt(0) : '?'}
                             </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#f3f4f6', fontSize: '1.05rem' }}>{user.firstName} {user.lastName}</div>
                          <div style={{ color: '#9ca3af', fontSize: '0.85rem', marginTop: '2px' }}>@{user.robloxUsername}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {['Present', 'Late', 'Absent'].map(mark => {
                          const isActive = currentMark === mark;
                          const activeColor = mark === 'Present' ? '#10b981' : mark === 'Late' ? '#f59e0b' : '#ef4444';
                          
                          return (
                            <button
                              key={mark}
                              onClick={() => {
                                const newRecord = { ...(flight.attendanceRecord || {}) };
                                newRecord[escapeEmail(email)] = mark;
                                editFlight(flight.id, { attendanceRecord: newRecord });
                                
                                flight.attendanceRecord = newRecord;
                                setActiveRegisterFlight({...flight});
                              }}
                              style={{
                                padding: '8px 18px',
                                fontSize: '0.9rem',
                                fontWeight: isActive ? '600' : '500',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: isActive ? `1px solid ${activeColor}` : '1px solid rgba(255,255,255,0.1)',
                                background: isActive ? activeColor : 'rgba(255,255,255,0.03)',
                                color: isActive ? '#fff' : '#9ca3af',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 0 15px ${activeColor}30` : 'none'
                              }}
                            >
                              {mark}
                            </button>
                          );
                        })}
                        <input
                           type="text"
                           placeholder="Other..."
                           maxLength={10}
                           value={['Present', 'Late', 'Absent', 'Pending'].includes(currentMark) ? '' : currentMark}
                           onChange={(e) => {
                                const val = e.target.value;
                                const newRecord = { ...(flight.attendanceRecord || {}) };
                                newRecord[escapeEmail(email)] = val;
                                editFlight(flight.id, { attendanceRecord: newRecord });
                                flight.attendanceRecord = newRecord;
                                setActiveRegisterFlight({...flight});
                           }}
                           style={{
                               padding: '8px',
                               fontSize: '0.9rem',
                               borderRadius: '8px',
                               border: !['Present', 'Late', 'Absent', 'Pending'].includes(currentMark) && currentMark ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                               background: 'rgba(255,255,255,0.03)',
                               color: '#fff',
                               width: '100px',
                               outline: 'none'
                           }}
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ ...styles.introHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <p style={styles.introText}>
          Review scheduled flights, request crew allocation, or launch server instances.
        </p>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            onClick={() => setViewMode('upcoming')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'upcoming' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: viewMode === 'upcoming' ? '#60a5fa' : '#9ca3af', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
          >
            Upcoming Flights
          </button>
          <button 
            onClick={() => setViewMode('previous')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'previous' ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: viewMode === 'previous' ? '#60a5fa' : '#9ca3af', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}
          >
            Previous Flights
          </button>
        </div>
      </div>

      {displayedFlights.length === 0 ? (
        <div style={styles.emptyState}>
          <Plane size={48} color="rgba(255,255,255,0.15)" />
          <p style={styles.emptyText}>No {viewMode === 'upcoming' ? 'upcoming' : 'previous'} flights found.</p>
        </div>
      ) : (
        <div style={styles.flightGrid}>
          {[...displayedFlights].sort((a, b) => {
             const diff = new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
             return viewMode === 'upcoming' ? diff : -diff;
          }).map((flight) => {
            const myStatus = getMyStatus(flight, currentUser.email);
            const currentSelected = selectedStatuses[flight.id] !== undefined
              ? selectedStatuses[flight.id]
              : myStatus;
            const hasChanged = currentSelected !== myStatus;
            return (
              <div 
                id={`flight-${flight.id}`} 
                key={flight.id} 
                style={{
                  ...styles.flightCard, 
                  border: targetFlightId === flight.id ? '2px solid #3b82f6' : undefined,
                  boxShadow: targetFlightId === flight.id ? '0 0 20px rgba(59, 130, 246, 0.3)' : undefined
                }} 
                className="glass-panel"
              >
                <div style={styles.flightHeader}>
                  <div style={styles.badgeContainer}>
                    <span style={styles.flightCode}>{flight.flightCode}</span>
                    <span style={styles.locationBadge}>
                      <MapPin size={12} /> {flight.location}
                    </span>
                    {flight.locked && (
                      <span style={{...styles.locationBadge, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
                        <Lock size={12} /> Locked
                      </span>
                    )}
                  </div>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(flight.id)}
                      className="btn-secondary"
                      style={{...styles.deleteBtn, background: 'rgba(255,255,255,0.05)', color: copiedId === flight.id ? '#10b981' : '#9ca3af', borderColor: 'rgba(255,255,255,0.1)'}}
                      title="Copy Link to Request"
                    >
                      {copiedId === flight.id ? <Check size={16} /> : <Link size={16} />}
                    </button>
                    {getRankWeight(currentUser) >= 60 && (
                      <button
                        type="button"
                        onClick={() => toggleFlightLock(flight.id, !flight.locked)}
                        className={flight.locked ? "btn-secondary" : "btn-primary"}
                        style={{...styles.deleteBtn, background: flight.locked ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.15)', color: flight.locked ? '#fff' : '#ef4444', borderColor: flight.locked ? 'rgba(255,255,255,0.2)' : 'rgba(239, 68, 68, 0.3)'}}
                        title={flight.locked ? "Unlock Allocation" : "Lock Allocation"}
                      >
                        {flight.locked ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                    )}
                    {currentUser.isAdmin && (
                      <button
                        type="button"
                        onClick={() => removeFlight(flight.id)}
                        className="btn-danger"
                        style={styles.deleteBtn}
                        title="Cancel Flight"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.detailsSection}>
                  <div style={styles.detailRow}>
                    <Calendar size={16} color="#3b82f6" />
                    <span>{formatFlightDateLocal(flight.date, flight.time) || flight.date}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <Clock size={16} color="#3b82f6" />
                    <span>{flight.time} BST</span>
                  </div>
                </div>

                <div style={styles.crewSection}>
                  <div style={styles.crewHeader}>
                    <Users size={16} color="#06b6d4" />
                    <span style={styles.crewTitle}>Crew Allocation</span>
                  </div>
                  
                  {(() => {
                    const attending = getStaffList(flight, 'Attending').filter(email => activeUsers.some(user => user.email === email));
                    const absent = getStaffList(flight, 'Absent').filter(email => activeUsers.some(user => user.email === email));

                    if (attending.length === 0 && absent.length === 0) {
                      return <p style={styles.emptyCrewText}>No crew responses yet.</p>;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {attending.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                              Attending ({attending.length})
                            </div>
                            <div style={styles.crewList}>
                              {attending.map((email) => {
                                const mark = flight.attendanceRecord && flight.attendanceRecord[escapeEmail(email)];
                                const markDisplay = mark && mark !== 'Pending' ? ` - ${mark}` : '';
                                return (
                                <div key={`att-${email}`} style={styles.crewBadge}>
                                  <span style={styles.crewBadgeText}>{getStaffNameByEmail(email)}{markDisplay}</span>
                                  {currentUser.isAdmin && !flight.locked && (
                                    <button
                                      type="button"
                                      onClick={() => deallocateStaffDirectly(flight.id, email)}
                                      style={styles.removeCrewBtn}
                                      title="Deallocate Staff"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {absent.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#ef4444', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                              Absent ({absent.length})
                            </div>
                            <div style={styles.crewList}>
                              {absent.map((email) => {
                                const mark = flight.attendanceRecord && flight.attendanceRecord[escapeEmail(email)];
                                const markDisplay = mark && mark !== 'Pending' ? ` - ${mark}` : '';
                                return (
                                <div 
                                  key={`abs-${email}`} 
                                  style={{...styles.crewBadge, background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', cursor: 'pointer'}}
                                  onClick={() => {
                                    const reason = flight.absenceReasons ? flight.absenceReasons[escapeEmail(email)] : null;
                                    setViewReasonModal({ show: true, email, reason });
                                  }}
                                  title="Click to view absence reason"
                                >
                                  <span style={{...styles.crewBadgeText, color: '#fca5a5'}}>{getStaffNameByEmail(email)}{markDisplay}</span>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Attendance Register Section (Only for Hosts or Admins) */}
                {(currentUser.isAdmin || currentUser.email === flight.host) && (
                  <button type="button" onClick={() => setActiveRegisterFlight(flight)} className="btn-primary" style={{marginTop: '12px', marginBottom: '12px', width: '100%', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <Users size={16} style={{marginRight: '8px'}} />
                    Open Attendance Register
                  </button>
                )}

                <div style={styles.actionContainer}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1.3 }}>
                    <div style={{...styles.statusButtonsContainer, opacity: flight.locked ? 0.5 : 1, pointerEvents: flight.locked ? 'none' : 'auto'}}>
                      <button
                        type="button"
                        onClick={() => setSelectedStatuses(prev => ({ ...prev, [flight.id]: 'Attending' }))}
                        style={{
                          ...styles.statusBtn,
                          background: currentSelected === 'Attending' ? '#10b981' : 'rgba(255,255,255,0.05)',
                          color: currentSelected === 'Attending' ? '#fff' : '#e5e7eb',
                          border: currentSelected === 'Attending' ? '1px solid #059669' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        Attending
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStatuses(prev => ({ ...prev, [flight.id]: 'Undecided' }))}
                        style={{
                          ...styles.statusBtn,
                          background: currentSelected === 'Undecided' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                          color: currentSelected === 'Undecided' ? '#fff' : '#e5e7eb',
                          border: currentSelected === 'Undecided' ? '1px solid #2563eb' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        Not yet decided
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStatuses(prev => ({ ...prev, [flight.id]: 'Absent' }))}
                        style={{
                          ...styles.statusBtn,
                          background: currentSelected === 'Absent' ? '#ef4444' : 'rgba(255,255,255,0.05)',
                          color: currentSelected === 'Absent' ? '#fff' : '#e5e7eb',
                          border: currentSelected === 'Absent' ? '1px solid #dc2626' : '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        Absent
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!hasChanged || flight.locked}
                      onClick={() => {
                        if (currentSelected === 'Absent') {
                          setAbsenceModal({ show: true, flightId: flight.id, email: currentUser.email, currentSelected });
                        } else {
                          setAllocationStatus(flight.id, currentUser.email, currentSelected);
                          setSelectedStatuses(prev => {
                            const updated = { ...prev };
                            delete updated[flight.id];
                            return updated;
                          });
                        }
                      }}
                      style={{
                        ...styles.acceptBtn,
                        opacity: hasChanged ? 1 : 0.5,
                        cursor: hasChanged ? 'pointer' : 'not-allowed',
                        background: hasChanged ? '#10b981' : 'rgba(255,255,255,0.03)',
                        color: hasChanged ? '#fff' : '#9ca3af',
                        border: hasChanged ? '1px solid #059669' : '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      Accept Selection
                    </button>
                  </div>

                  <a
                    href={flight.serverLink}
                    rel="noreferrer"
                    style={styles.linkBtn}
                    className="btn-secondary"
                  >
                    <span>Launch Server</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                {currentUser.isAdmin && !flight.locked && (
                  <div style={styles.adminAssignPanel}>
                    <label style={styles.adminLabel}>Directly Assign Staff:</label>
                    <div style={styles.assignRow}>
                      <select
                        value={directAssignEmail[flight.id] || ''}
                        onChange={(e) => setDirectAssignEmail(prev => ({ ...prev, [flight.id]: e.target.value }))}
                        className="input-field"
                        style={styles.assignSelect}
                      >
                        <option value="">Select Staff...</option>
                        {eligibleStaff.map(staff => (
                          <option key={staff.email} value={staff.email}>
                            {staff.firstName} {staff.lastName} (@{staff.robloxUsername})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDirectAssign(flight.id)}
                        className="btn-success"
                        style={styles.assignBtn}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Absence Reason Input Modal */}
      {absenceModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ marginTop: 0, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>●</span> Absence Reason
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '16px' }}>Please provide a reason for your absence.</p>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              placeholder="E.g., I have an exam, I am out of town..."
              style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '0.95rem', resize: 'none', outline: 'none', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setAbsenceModal({ show: false, flightId: null, email: null, currentSelected: null });
                  setAbsenceReason('');
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', borderRadius: '8px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!absenceReason.trim()) return alert("Please enter a reason.");
                  setAllocationStatus(absenceModal.flightId, absenceModal.email, absenceModal.currentSelected, absenceReason.trim());
                  setSelectedStatuses(prev => {
                    const updated = { ...prev };
                    delete updated[absenceModal.flightId];
                    return updated;
                  });
                  setAbsenceModal({ show: false, flightId: null, email: null, currentSelected: null });
                  setAbsenceReason('');
                }}
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: '1px solid #dc2626', cursor: 'pointer' }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reason Modal */}
      {viewReasonModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)', padding: '20px' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ marginTop: 0, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#ef4444' }}>●</span> Absence Reason
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '8px' }}>
              Reason given by <strong>{getStaffNameByEmail(viewReasonModal.email)}</strong>:
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', color: '#e5e7eb', marginBottom: '20px', minHeight: '60px' }}>
              {viewReasonModal.reason ? viewReasonModal.reason : <span style={{ fontStyle: 'italic', color: '#6b7280' }}>No reason provided.</span>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setViewReasonModal({ show: false, email: null, reason: null })}
                className="btn-secondary"
                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  introHeader: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '16px',
  },
  introText: {
    color: '#9ca3af',
    fontSize: '0.95rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px 0',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '1rem',
  },
  flightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '24px',
  },
  flightCard: {
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  flightHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badgeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  flightCode: {
    fontSize: '1.4rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    letterSpacing: '0.5px',
  },
  locationBadge: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    color: '#d1d5db',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deleteBtn: {
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  detailsSection: {
    display: 'flex',
    gap: '16px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
    color: '#e5e7eb',
  },
  crewSection: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  crewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  crewTitle: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#e5e7eb',
  },
  emptyCrewText: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  crewList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  crewBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(37, 99, 235, 0.1)',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  crewBadgeText: {
    fontSize: '0.8rem',
    color: '#93c5fd',
  },
  removeCrewBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
  },
  actionContainer: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
    alignItems: 'flex-end',
  },
  statusButtonsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statusBtn: {
    flex: '1 1 calc(33.333% - 6px)',
    padding: '10px 8px',
    borderRadius: '8px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  acceptBtn: {
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '600',
    textAlign: 'center',
    transition: 'all 0.2s',
    width: '100%',
  },
  linkBtn: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none',
    cursor: 'pointer',
    height: '42px',
  },
  adminAssignPanel: {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  adminLabel: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontWeight: '500',
  },
  assignRow: {
    display: 'flex',
    gap: '8px',
  },
  assignSelect: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.85rem',
  },
  assignBtn: {
    padding: '0 16px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
