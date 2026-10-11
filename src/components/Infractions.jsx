import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, History, Lock, Trash2, ShieldCheck, Clock, Plus, X, Search, Filter } from 'lucide-react';

export default function Infractions() {
  const { 
    infractions = [], 
    deleteInfraction, 
    appealInfraction, 
    addInfraction, 
    informalSanctions = [], 
    deleteInformalSanction, 
    users = [],
    currentUser 
  } = useApp();

  const [activeTab, setActiveTab] = useState('my');
  const [appealingId, setAppealingId] = useState(null);
  const [appealText, setAppealText] = useState('');
  
  // All staff filter & search
  const [searchStaff, setSearchStaff] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Log Consequence modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logStaffEmail, setLogStaffEmail] = useState('');
  const [logType, setLogType] = useState('C1 Warning');
  const [logCategory, setLogCategory] = useState('Behavior');
  const [logMainMessage, setLogMainMessage] = useState('');
  const [logConfidential, setLogConfidential] = useState('');
  const [logDetentionLocation, setLogDetentionLocation] = useState('Hall');
  const [logDetentionDate, setLogDetentionDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [logDetentionTime, setLogDetentionTime] = useState('14:55 - 15:15');
  const [logSuccess, setLogSuccess] = useState('');

  const isAdminOrMod = Boolean(currentUser?.isAdmin || currentUser?.siteRole === 'Moderator');

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this consequence?')) {
      deleteInfraction(id);
    }
  };

  // Safe arrays
  const safeInfractions = Array.isArray(infractions) ? infractions : [];
  const safeInformalSanctions = Array.isArray(informalSanctions) ? informalSanctions : [];
  const myEmail = currentUser?.email || '';

  const myLogs = safeInfractions.filter(inf => inf && inf.staffEmail === myEmail);
  const myInformalSanctions = safeInformalSanctions.filter(sanc => sanc && sanc.staffEmail === myEmail);

  // New C1-C5 Tiers
  const myWarnings = myLogs.filter(inf => inf.type?.startsWith('C1') || inf.type?.startsWith('C2') || inf.type?.toLowerCase().includes('warning'));
  const myC3Sanctions = myLogs.filter(inf => inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal'));
  const myC4Detentions = myLogs.filter(inf => inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention'));
  const myC5Suspensions = myLogs.filter(inf => inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension'));
  
  // Upcoming sanctions: C4 detentions that are scheduled or active
  const myUpcomingSanctions = myLogs.filter(inf => {
    if (!inf) return false;
    const isDetention = inf.type?.startsWith('C4') || inf.detentionStatus === 'Scheduled';
    return isDetention && inf.detentionStatus !== 'Passed';
  });

  const formatSanctionDate = (dateStr) => {
    if (!dateStr) return 'Upcoming';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const handleCreateConsequence = (e) => {
    e.preventDefault();
    if (!logStaffEmail || !logMainMessage.trim()) {
      alert('Please select a staff member and provide reason details.');
      return;
    }

    const isDetention = logType.startsWith('C4');
    const wasAdded = addInfraction({
      staffEmail: logStaffEmail,
      type: logType,
      mainMessage: `[${logCategory}] ${logMainMessage}`,
      confidentialMessage: logConfidential,
      detentionDate: isDetention ? logDetentionDate : null,
      detentionTime: isDetention ? logDetentionTime : null,
      detentionLocation: isDetention ? (logDetentionLocation || 'Hall') : null
    });

    if (wasAdded === false) {
      alert('Could not log consequence. Please verify staff permissions.');
      return;
    }

    setLogStaffEmail('');
    setLogType('C1 Warning');
    setLogMainMessage('');
    setLogConfidential('');
    setShowLogModal(false);
    setLogSuccess('Consequence logged successfully!');
    setTimeout(() => setLogSuccess(''), 4000);
  };

  // Filter for All Staff tab
  const filteredAllStaffLogs = safeInfractions.filter(inf => {
    if (!inf) return false;
    const matchesSearch = `${inf.staffName || ''} ${inf.staffEmail || ''} ${inf.mainMessage || ''}`.toLowerCase().includes(searchStaff.toLowerCase());
    if (!matchesSearch) return false;

    if (tierFilter === 'c1c2') return inf.type?.startsWith('C1') || inf.type?.startsWith('C2') || inf.type?.toLowerCase().includes('warning');
    if (tierFilter === 'c3') return inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal');
    if (tierFilter === 'c4') return inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention');
    if (tierFilter === 'c5') return inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension');
    return true;
  });

  const eligibleStaff = users.filter(u => u && u.approved && u.email !== currentUser?.email);

  if (!currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <ShieldAlert size={48} color="rgba(255,255,255,0.15)" />
          <p style={styles.emptyText}>Please sign in to view your consequences.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {logSuccess && (
        <div style={styles.successAlert}>
          <ShieldCheck size={18} />
          <span>{logSuccess}</span>
        </div>
      )}

      {isAdminOrMod && (
        <div style={styles.tabHeader}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('my')}
              className="btn-secondary"
              style={{
                ...styles.tabBtn,
                background: activeTab === 'my' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                borderColor: activeTab === 'my' ? '#2563eb' : 'transparent',
                color: activeTab === 'my' ? 'var(--color-text-main)' : '#9ca3af',
              }}
            >
              <ShieldCheck size={16} />
              My Consequences
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className="btn-secondary"
              style={{
                ...styles.tabBtn,
                background: activeTab === 'all' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                borderColor: activeTab === 'all' ? '#2563eb' : 'transparent',
                color: activeTab === 'all' ? 'var(--color-text-main)' : '#9ca3af',
              }}
            >
              <History size={16} />
              All Staff Consequences ({safeInfractions.length})
            </button>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="btn-danger"
            style={styles.logNewBtn}
          >
            <Plus size={16} />
            <span>Log Consequence</span>
          </button>
        </div>
      )}

      {/* Staff View: My Consequences */}
      {(!isAdminOrMod || activeTab === 'my') && (
        <div style={styles.listContainer}>
          {/* Upcoming Sanctions Section - Matches provided reference design */}
          <div style={styles.upcomingSanctionsCard}>
            <div style={styles.upcomingHeader}>
              <h3 style={styles.upcomingTitle}>Upcoming Sanctions</h3>
            </div>
            <div style={styles.upcomingBody}>
              {myUpcomingSanctions.length === 0 ? (
                <div style={styles.noUpcomingText}>No upcoming sanctions scheduled.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {myUpcomingSanctions.map(sanc => {
                    const isC4b = sanc.type?.includes('C4B') || sanc.type?.toLowerCase().includes('40m');
                    const badgeText = isC4b ? 'C4b' : 'C4a';
                    const titleText = `${isC4b ? 'C4B' : 'C4A'} (${sanc.detentionLocation || 'Hall'})`;
                    const timeText = sanc.detentionTime || (isC4b ? '14:55 - 15:35' : '14:55 - 15:15');

                    return (
                      <div key={sanc.id} style={styles.upcomingItem}>
                        <div style={styles.upcomingDateText}>
                          {formatSanctionDate(sanc.detentionDate || sanc.timestamp)}
                        </div>
                        <div style={styles.upcomingRow}>
                          <span style={styles.c4Badge}>{badgeText}</span>
                          {sanc.isEscalation && (
                            <span style={styles.escalationBadge}>Escalation</span>
                          )}
                          <span style={styles.detentionTitleText}>{titleText}</span>
                          <div style={styles.detentionTimeRow}>
                            <Clock size={15} color="#94a3b8" />
                            <span>{timeText}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={styles.sectionNotice} className="glass-panel">
            <ShieldCheck size={18} color="#10b981" />
            <p style={styles.noticeText}>
              Below is your official disciplinary record. Consequences are logged by administrators and reviewable during evaluations.
            </p>
          </div>

          {/* Updated 4 Tiers: C1-C2 Warnings, C3 Informal, C4 Detentions, C5 Suspensions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '10px' }}>
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(59, 130, 246, 0.25)' }}>
              <h4 style={{ color: '#93c5fd', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>C1 - C2 Warnings</h4>
              <p style={{ fontSize: '2.4rem', color: '#60a5fa', fontWeight: 'bold', margin: '8px 0 0' }}>{myWarnings.length}</p>
            </div>
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(234, 179, 8, 0.25)' }}>
              <h4 style={{ color: '#fde047', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>C3 Informal Sanctions</h4>
              <p style={{ fontSize: '2.4rem', color: '#eab308', fontWeight: 'bold', margin: '8px 0 0' }}>{myC3Sanctions.length + myInformalSanctions.length}</p>
            </div>
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(245, 158, 11, 0.25)' }}>
              <h4 style={{ color: '#fcd34d', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>C4 Detentions (20m / 40m)</h4>
              <p style={{ fontSize: '2.4rem', color: '#f59e0b', fontWeight: 'bold', margin: '8px 0 0' }}>{myC4Detentions.length}</p>
            </div>
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(239, 68, 68, 0.25)' }}>
              <h4 style={{ color: '#fca5a5', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>C5 Suspensions</h4>
              <p style={{ fontSize: '2.4rem', color: '#ef4444', fontWeight: 'bold', margin: '8px 0 0' }}>{myC5Suspensions.length}</p>
            </div>
          </div>

          {myLogs.length === 0 && myInformalSanctions.length === 0 ? (
            <div style={styles.emptyState}>
              <ShieldCheck size={48} color="rgba(16, 185, 129, 0.2)" />
              <p style={{ ...styles.emptyText, color: '#10b981' }}>Your record is clean! No consequences logged.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {myLogs.map(inf => {
                const isC5 = inf.type?.startsWith('C5') || inf.type?.includes('Suspension');
                const isC4 = inf.type?.startsWith('C4') || inf.type?.includes('Detention');
                const isC3 = inf.type?.startsWith('C3') || inf.type?.includes('Informal');
                const badgeColor = isC5 ? '#ef4444' : isC4 ? '#f59e0b' : isC3 ? '#eab308' : '#3b82f6';
                const badgeBg = isC5 ? 'rgba(239, 68, 68, 0.15)' : isC4 ? 'rgba(245, 158, 11, 0.15)' : isC3 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)';
                const badgeBorder = isC5 ? 'rgba(239, 68, 68, 0.3)' : isC4 ? 'rgba(245, 158, 11, 0.3)' : isC3 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.3)';

                return (
                  <div key={inf.id} style={styles.infractionCard} className="glass-panel">
                    <div style={styles.cardHeader}>
                      <div style={styles.typeBadgeContainer}>
                        <span style={{
                          ...styles.infractionType, 
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`
                        }}>
                          {inf.type}
                        </span>
                        {inf.isEscalation && (
                          <span style={styles.escalationBadge}>Escalated</span>
                        )}
                      </div>
                      <span style={styles.infDate}>{formatSanctionDate(inf.date || inf.timestamp)}</span>
                    </div>

                    {isC4 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <Clock size={16} color="#f59e0b" />
                        <span style={{ fontSize: '0.85rem', color: '#fcd34d' }}>
                          <strong>Detention:</strong> {inf.detentionLocation || 'Hall'} &bull; {inf.detentionDate || 'Scheduled'} &bull; {inf.detentionTime || '14:55'}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 'bold', color: inf.detentionStatus === 'Passed' ? '#10b981' : inf.detentionStatus === 'Failed' ? '#ef4444' : '#f59e0b' }}>
                          Status: {inf.detentionStatus || 'Scheduled'}
                        </span>
                      </div>
                    )}

                    <div style={styles.messageBox}>
                      <h5 style={styles.boxLabel}>Reason / Details:</h5>
                      <p style={styles.messageText}>{inf.mainMessage}</p>
                    </div>

                    {inf.appeal ? (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6', borderRadius: '0 8px 8px 0' }}>
                        <h5 style={{ ...styles.boxLabel, color: '#60a5fa', marginBottom: '4px' }}>Your Appeal:</h5>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#bfdbfe' }}>{inf.appeal.text}</p>
                      </div>
                    ) : (
                      appealingId === inf.id ? (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea 
                            value={appealText}
                            onChange={e => setAppealText(e.target.value)}
                            placeholder="Explain why you are appealing this consequence..."
                            className="input-field"
                            rows="2"
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { appealInfraction(inf.id, appealText); setAppealingId(null); setAppealText(''); }} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Submit Appeal</button>
                            <button onClick={() => { setAppealingId(null); setAppealText(''); }} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: '12px' }}>
                          <button onClick={() => { setAppealingId(inf.id); setAppealText(''); }} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Appeal Consequence</button>
                        </div>
                      )
                    )}

                    <div style={styles.cardFooter}>
                      <span>Logged by Administrator: <strong>{inf.adminName || inf.issuedByName || 'Administrator'}</strong></span>
                    </div>
                  </div>
                );
              })}

              {/* Legacy Informal Sanctions */}
              {myInformalSanctions.map(sanc => (
                <div key={sanc.id} style={styles.infractionCard} className="glass-panel">
                  <div style={styles.cardHeader}>
                    <div style={styles.typeBadgeContainer}>
                      <span style={{
                        ...styles.infractionType, 
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#eab308',
                        border: '1px solid rgba(234, 179, 8, 0.3)'
                      }}>C3 Informal Sanction</span>
                    </div>
                    <span style={styles.infDate}>{formatSanctionDate(sanc.timestamp || sanc.date)}</span>
                  </div>
                  <div style={styles.messageBox}>
                    <h5 style={styles.boxLabel}>Reason / Details:</h5>
                    <p style={styles.messageText}>{sanc.reason}</p>
                  </div>
                  <div style={styles.cardFooter}>
                    <span>Logged by Administrator: <strong>{sanc.issuedByName || sanc.adminName || 'Administrator'}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin View: All Staff Consequences */}
      {isAdminOrMod && activeTab === 'all' && (
        <div style={styles.listContainer}>
          {/* Controls: Search and Tiers Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '360px' }}>
              <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search staff name, email, or reason..."
                value={searchStaff}
                onChange={e => setSearchStaff(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '38px', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${safeInfractions.length})` },
                { id: 'c1c2', label: 'C1/C2 Warnings' },
                { id: 'c3', label: 'C3 Informal' },
                { id: 'c4', label: 'C4 Detentions' },
                { id: 'c5', label: 'C5 Suspensions' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTierFilter(f.id)}
                  className="btn-secondary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    background: tierFilter === f.id ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    borderColor: tierFilter === f.id ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                    color: tierFilter === f.id ? '#ffffff' : '#9ca3af'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredAllStaffLogs.length === 0 ? (
            <div style={styles.emptyState}>
              <ShieldAlert size={48} color="rgba(255,255,255,0.15)" />
              <p style={styles.emptyText}>No consequences match your search or filter.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {filteredAllStaffLogs.map(inf => {
                const isC5 = inf.type?.startsWith('C5') || inf.type?.includes('Suspension');
                const isC4 = inf.type?.startsWith('C4') || inf.type?.includes('Detention');
                const isC3 = inf.type?.startsWith('C3') || inf.type?.includes('Informal');
                const badgeColor = isC5 ? '#ef4444' : isC4 ? '#f59e0b' : isC3 ? '#eab308' : '#3b82f6';
                const badgeBg = isC5 ? 'rgba(239, 68, 68, 0.15)' : isC4 ? 'rgba(245, 158, 11, 0.15)' : isC3 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)';
                const badgeBorder = isC5 ? 'rgba(239, 68, 68, 0.3)' : isC4 ? 'rgba(245, 158, 11, 0.3)' : isC3 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(59, 130, 246, 0.3)';

                return (
                  <div key={inf.id} style={styles.infractionCard} className="glass-panel">
                    <div style={styles.cardHeader}>
                      <div style={styles.typeBadgeContainer}>
                        <span style={styles.targetStaff}>{inf.staffName}</span>
                        <span style={styles.staffMail}>({inf.staffEmail})</span>
                        <span style={{
                          ...styles.infractionType,
                          background: badgeBg,
                          color: badgeColor,
                          border: `1px solid ${badgeBorder}`,
                          marginLeft: '8px'
                        }}>
                          {inf.type}
                        </span>
                        {inf.isEscalation && (
                          <span style={styles.escalationBadge}>Escalated</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={styles.infDate}>{formatSanctionDate(inf.date || inf.timestamp)}</span>
                        {(currentUser?.siteRole === 'Owner' || currentUser?.email?.toLowerCase() === 'evanm.100000@gmail.com') && (
                          <button
                            onClick={() => handleDelete(inf.id)}
                            className="btn-danger"
                            style={styles.deleteBtn}
                            title="Remove Consequence"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {isC4 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <Clock size={16} color="#f59e0b" />
                        <span style={{ fontSize: '0.85rem', color: '#fcd34d' }}>
                          <strong>Detention:</strong> {inf.detentionLocation || 'Hall'} &bull; {inf.detentionDate || 'Scheduled'} &bull; {inf.detentionTime || '14:55'}
                        </span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 'bold', color: inf.detentionStatus === 'Passed' ? '#10b981' : inf.detentionStatus === 'Failed' ? '#ef4444' : '#f59e0b' }}>
                          Status: {inf.detentionStatus || 'Scheduled'}
                        </span>
                      </div>
                    )}

                    <div style={styles.messageBox}>
                      <h5 style={styles.boxLabel}>Public Record Message:</h5>
                      <p style={styles.messageText}>{inf.mainMessage}</p>
                    </div>

                    {inf.confidentialMessage && (
                      <div style={styles.confidentialBox}>
                        <div style={styles.confHeader}>
                          <Lock size={12} color="#06b6d4" />
                          <h5 style={{ ...styles.boxLabel, color: '#06b6d4', margin: 0 }}>Confidential Note (Admin Only):</h5>
                        </div>
                        <p style={styles.confidentialText}>{inf.confidentialMessage}</p>
                      </div>
                    )}

                    <div style={styles.cardFooter}>
                      <span>Logged by Admin: <strong>{inf.adminName || inf.issuedByName || 'Administrator'}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Log New Consequence */}
      {showLogModal && (
        <div style={styles.overlay}>
          <div className="glass-panel" style={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={22} color="#ef4444" />
                <h3 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.25rem' }}>Log Staff Consequence</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowLogModal(false)} 
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateConsequence} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Staff Member *</label>
                <select 
                  required 
                  value={logStaffEmail} 
                  onChange={e => setLogStaffEmail(e.target.value)} 
                  className="input-field"
                >
                  <option value="">Select staff member...</option>
                  {eligibleStaff.map(u => (
                    <option key={u.email} value={u.email}>
                      {u.firstName} {u.lastName} (@{u.robloxUsername || 'user'}) &mdash; {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Consequence Action Level *</label>
                <select 
                  value={logType} 
                  onChange={e => {
                    setLogType(e.target.value);
                    if (e.target.value.includes('C4B')) {
                      setLogDetentionTime('14:55 - 15:35');
                    } else if (e.target.value.includes('C4A')) {
                      setLogDetentionTime('14:55 - 15:15');
                    }
                  }} 
                  className="input-field"
                >
                  <option value="C1 Warning">C1 - Warning</option>
                  <option value="C2 Warning">C2 - Warning</option>
                  <option value="C3 Informal Sanction">C3 - Informal Sanction</option>
                  <option value="C4A - Infraction + 20m Detention">C4A - Infraction + 20 minute Detention</option>
                  <option value="C4B - 40m Detention">C4B - 40 minute Detention</option>
                  <option value="C5 Suspension">C5 - Suspension (2 Days)</option>
                </select>
              </div>

              {logType.startsWith('C4') && (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <Clock size={16} />
                    <span>Detention Schedule Parameters</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={styles.inputWrapper}>
                      <label style={styles.label}>Detention Location *</label>
                      <input 
                        type="text" 
                        required 
                        value={logDetentionLocation} 
                        onChange={e => setLogDetentionLocation(e.target.value)} 
                        placeholder="e.g. Hall, Training Room"
                        className="input-field"
                      />
                    </div>
                    <div style={styles.inputWrapper}>
                      <label style={styles.label}>Detention Date *</label>
                      <input 
                        type="date" 
                        required 
                        value={logDetentionDate} 
                        onChange={e => setLogDetentionDate(e.target.value)} 
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Time Slot</label>
                    <input 
                      type="text" 
                      value={logDetentionTime} 
                      onChange={e => setLogDetentionTime(e.target.value)} 
                      placeholder="e.g. 14:55 - 15:35"
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Reason Category</label>
                <select value={logCategory} onChange={e => setLogCategory(e.target.value)} className="input-field">
                  <option value="Behavior">Behavior</option>
                  <option value="Verbal assault">Verbal assault</option>
                  <option value="Refusing a reasonable request">Refusing a reasonable request</option>
                  <option value="Absence">Absence</option>
                  <option value="Insubordination">Insubordination</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Reason & Details * (Public staff record)</label>
                <textarea 
                  required 
                  value={logMainMessage} 
                  onChange={e => setLogMainMessage(e.target.value)} 
                  placeholder="Explain the incident, shift context, and expectations..."
                  rows="3"
                  className="input-field"
                />
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Confidential Note (Admin only)</label>
                <textarea 
                  value={logConfidential} 
                  onChange={e => setLogConfidential(e.target.value)} 
                  placeholder="Optional internal administrative notes..."
                  rows="2"
                  className="input-field"
                  style={{ borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.02)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-danger" style={{ ...styles.submitBtn, flex: 1 }}>
                  <ShieldAlert size={16} /> Publish Consequence
                </button>
                <button type="button" onClick={() => setShowLogModal(false)} className="btn-secondary" style={{ padding: '10px 18px', borderRadius: '8px' }}>
                  Cancel
                </button>
              </div>
            </form>
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
    gap: '24px',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    paddingBottom: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  logNewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '10px',
    padding: '12px 18px',
    fontSize: '0.9rem',
    color: '#a7f3d0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  upcomingSanctionsCard: {
    background: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    color: '#0f172a',
  },
  upcomingHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  upcomingTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  upcomingBody: {
    padding: '20px',
  },
  noUpcomingText: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontStyle: 'italic',
  },
  upcomingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  upcomingDateText: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#1e3a5f',
  },
  upcomingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  c4Badge: {
    background: '#f59e0b',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.02em',
  },
  escalationBadge: {
    background: '#fee2e2',
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  detentionTitleText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#475569',
  },
  detentionTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '500',
  },
  sectionNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  noticeText: {
    fontSize: '0.875rem',
    color: '#a7f3d0',
    margin: 0,
  },
  statCard: {
    padding: '20px',
    textAlign: 'center',
    borderRadius: '12px',
    border: '1px solid',
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  infractionCard: {
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  typeBadgeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  targetStaff: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  },
  staffMail: {
    fontSize: '0.85rem',
    color: '#9ca3af',
  },
  infractionType: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infDate: {
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  deleteBtn: {
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  messageBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  boxLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
  },
  messageText: {
    fontSize: '0.9rem',
    color: '#d1d5db',
    lineHeight: '1.45',
    margin: 0,
  },
  confidentialBox: {
    background: 'rgba(6, 182, 212, 0.05)',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    borderLeftWidth: '4px',
    borderRadius: '4px 8px 8px 4px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  confHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  confidentialText: {
    fontSize: '0.875rem',
    color: '#c5f2f7',
    fontStyle: 'italic',
    lineHeight: '1.4',
    margin: 0,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '0.75rem',
    color: '#9ca3af',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '12px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalBox: {
    width: '100%',
    maxWidth: '540px',
    borderRadius: '16px',
    padding: '24px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#d1d5db',
  },
  submitBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontWeight: '700',
  },
};
