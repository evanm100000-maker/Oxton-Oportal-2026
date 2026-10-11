import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, History, Lock, Trash2, ShieldCheck, Clock } from 'lucide-react';

export default function Infractions() {
  const { infractions, deleteInfraction, appealInfraction, informalSanctions = [], deleteInformalSanction, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('my');
  const [appealingId, setAppealingId] = useState(null);
  const [appealText, setAppealText] = useState('');

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this infraction?')) {
      deleteInfraction(id);
    }
  };

  // Filter infractions based on role
  const safeInfractions = Array.isArray(infractions) ? infractions : [];
  const safeInformalSanctions = Array.isArray(informalSanctions) ? informalSanctions : [];
  const myEmail = currentUser?.email || '';

  const myLogs = safeInfractions.filter(inf => inf && inf.staffEmail === myEmail);
  const mySuspensions = myLogs.filter(inf => inf && (inf.type === 'C5 Suspension' || inf.type === 'Suspension'));
  const myRegularInfractions = myLogs.filter(inf => inf && !inf.type?.includes('Suspension'));
  const myInformalSanctions = safeInformalSanctions.filter(sanc => sanc && sanc.staffEmail === myEmail);
  
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

  const isAdminOrMod = Boolean(currentUser?.isAdmin || currentUser?.siteRole === 'Moderator');

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
      {isAdminOrMod && (
        <div style={styles.tabHeader}>
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
      )}

      {/* Staff View: My Infractions */}
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
                myUpcomingSanctions.map(sanc => {
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
                })
              )}
            </div>
          </div>

          <div style={styles.sectionNotice} className="glass-panel">
            <ShieldCheck size={18} color="#10b981" />
            <p style={styles.noticeText}>
              Below is your official file record. Consequences are logged by administrators and reviewable during evaluation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
             <div className="glass-panel" style={{ flex: 1, minWidth: '150px', padding: '20px', textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                <h4 style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Infractions</h4>
                <p style={{ fontSize: '2.5rem', color: '#f87171', fontWeight: 'bold', margin: '10px 0' }}>{myRegularInfractions.length}</p>
             </div>
             <div className="glass-panel" style={{ flex: 1, minWidth: '150px', padding: '20px', textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(251, 146, 60, 0.2)' }}>
                <h4 style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Suspensions</h4>
                <p style={{ fontSize: '2.5rem', color: '#fb923c', fontWeight: 'bold', margin: '10px 0' }}>{mySuspensions.length}</p>
             </div>
             <div className="glass-panel" style={{ flex: 1, minWidth: '150px', padding: '20px', textAlign: 'center', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                <h4 style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase' }}>Informal Sanctions</h4>
                <p style={{ fontSize: '2.5rem', color: '#eab308', fontWeight: 'bold', margin: '10px 0' }}>{myInformalSanctions.length}</p>
             </div>
          </div>

          {myLogs.length === 0 && myInformalSanctions.length === 0 ? (
            <div style={styles.emptyState}>
              <ShieldCheck size={48} color="rgba(16, 185, 129, 0.15)" />
              <p style={{ ...styles.emptyText, color: '#10b981' }}>Your record is clean! No consequences logged.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {myInformalSanctions.map(sanc => (
                <div key={sanc.id} style={styles.infractionCard} className="glass-panel">
                  <div style={styles.cardHeader}>
                    <div style={styles.typeBadgeContainer}>
                      <span style={{
                        ...styles.infractionType, 
                        background: 'rgba(234, 179, 8, 0.15)',
                        color: '#eab308',
                        border: '1px solid rgba(234, 179, 8, 0.3)'
                      }}>Informal Sanction</span>
                    </div>
                    <span style={styles.infDate}>{formatSanctionDate(sanc.timestamp || sanc.date)}</span>
                  </div>
                  <div style={styles.messageBox}>
                    <h5 style={styles.boxLabel}>Reason / Details:</h5>
                    <p style={styles.messageText}>{sanc.reason}</p>
                  </div>
                </div>
              ))}
              {myLogs.map(inf => (
                <div key={inf.id} style={styles.infractionCard} className="glass-panel">
                  <div style={styles.cardHeader}>
                    <div style={styles.typeBadgeContainer}>
                      <span style={{
                        ...styles.infractionType, 
                        background: inf.type?.includes('Suspension') ? 'rgba(251, 146, 60, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: inf.type?.includes('Suspension') ? '#fb923c' : '#f87171',
                        border: inf.type?.includes('Suspension') ? '1px solid rgba(251, 146, 60, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }}>{inf.type}</span>
                    </div>
                    <span style={styles.infDate}>{formatSanctionDate(inf.date || inf.timestamp)}</span>
                  </div>
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin View: All Infractions */}
      {isAdminOrMod && activeTab === 'all' && (
        <div style={styles.listContainer}>
          {safeInfractions.length === 0 && safeInformalSanctions.length === 0 ? (
            <div style={styles.emptyState}>
              <ShieldAlert size={48} color="rgba(255,255,255,0.15)" />
              <p style={styles.emptyText}>No consequences logged in the system.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {safeInformalSanctions.map(sanc => (
                <div key={sanc.id} style={styles.infractionCard} className="glass-panel">
                  <div style={styles.cardHeader}>
                    <div style={styles.typeBadgeContainer}>
                      <span style={styles.targetStaff}>{sanc.staffEmail}</span>
                      <span style={{
                        ...styles.infractionType,
                        background: 'rgba(234, 179, 8, 0.12)',
                        color: '#eab308',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        marginLeft: '12px'
                      }}>
                        Informal Sanction
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={styles.infDate}>{formatSanctionDate(sanc.timestamp || sanc.date)}</span>
                      {(currentUser?.siteRole === 'Owner' || currentUser?.email?.toLowerCase() === 'evanm.100000@gmail.com') && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this informal sanction?')) {
                              deleteInformalSanction(sanc.id);
                            }
                          }}
                          className="btn-danger"
                          style={styles.deleteBtn}
                          title="Remove Informal Sanction"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={styles.messageBox}>
                    <h5 style={styles.boxLabel}>Reason / Details:</h5>
                    <p style={styles.messageText}>{sanc.reason}</p>
                  </div>
                  <div style={styles.cardFooter}>
                    <span>Logged by Admin: <strong>{sanc.issuedByName || sanc.adminName || 'Admin'}</strong></span>
                  </div>
                </div>
              ))}
              {safeInfractions.map(inf => (
                <div key={inf.id} style={styles.infractionCard} className="glass-panel">
                  <div style={styles.cardHeader}>
                    <div style={styles.typeBadgeContainer}>
                      <span style={styles.targetStaff}>{inf.staffName}</span>
                      <span style={styles.staffMail}>({inf.staffEmail})</span>
                      <span style={{
                        ...styles.infractionType,
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        marginLeft: '12px'
                      }}>
                        {inf.type}
                      </span>
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

                  <div style={styles.messageBox}>
                    <h5 style={styles.boxLabel}>Public Record Message:</h5>
                    <p style={styles.messageText}>{inf.mainMessage}</p>
                  </div>

                  {/* Confidential message visible only to admins */}
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
              ))}
            </div>
          )}
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
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
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
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '0.9rem',
    color: '#a7f3d0',
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
    color: '#0f172a'
  },
  upcomingHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9'
  },
  upcomingTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#1e293b'
  },
  upcomingBody: {
    padding: '20px'
  },
  noUpcomingText: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontStyle: 'italic'
  },
  upcomingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  upcomingDateText: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#1e3a5f'
  },
  upcomingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  c4Badge: {
    background: '#f59e0b',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.02em'
  },
  escalationBadge: {
    background: '#fee2e2',
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '4px'
  },
  detentionTitleText: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#475569'
  },
  detentionTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#64748b',
    fontWeight: '500'
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
    gap: '6px',
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
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f87171',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
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
  },
  messageText: {
    fontSize: '0.9rem',
    color: '#d1d5db',
    lineHeight: '1.45',
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
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '0.75rem',
    color: '#9ca3af',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '12px',
  },
  form: {
    padding: '32px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginTop: '-12px',
    marginBottom: '8px',
  },
  row: {
    display: 'flex',
    gap: '20px',
  },
  inputWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#d1d5db',
  },
  textarea: {
    resize: 'vertical',
  },
  textareaConf: {
    resize: 'vertical',
    borderStyle: 'dashed',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    background: 'rgba(6, 182, 212, 0.02)',
  },
  submitBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '10px',
  },
};
