import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, History, Lock, Trash2, ShieldCheck, Clock, Plus, X, Search, AlertTriangle, Flame, Edit3 } from 'lucide-react';
import ConsequenceLoggedModal, { computeStaffConsequenceStats } from './ConsequenceLoggedModal';

export default function Infractions() {
  const { 
    infractions = [], 
    deleteInfraction, 
    appealInfraction, 
    addInfraction, 
    updateInfraction,
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

  // Inline location editing state for C4 sanctions
  const [editingLocationInfId, setEditingLocationInfId] = useState(null);
  const [editLocationValue, setEditLocationValue] = useState('');

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

  // New Consequence count summary UI modal for admin
  const [showLoggedSummaryModal, setShowLoggedSummaryModal] = useState(false);
  const [loggedSummaryData, setLoggedSummaryData] = useState(null);

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

  const {
    myLogs,
    myInformalSanctions,
    c1Count,
    c2Count,
    genericWarningCount,
    c1c2CombinedCount,
    c3Count,
    c4Count,
    c5Count,
    totalWeightedPoints,
    myUpcomingSanctions
  } = useMemo(() => {
    const logs = safeInfractions.filter(inf => inf && inf.staffEmail === myEmail);
    const informal = safeInformalSanctions.filter(sanc => sanc && sanc.staffEmail === myEmail);
    let c1 = 0, c2 = 0, gen = 0, c3 = 0, c4 = 0, c5 = 0;
    const upcoming = [];
    logs.forEach(inf => {
      if (!inf) return;
      if (inf.type === 'C1 Warning' || (inf.type?.startsWith('C1') && !inf.type?.includes('C2'))) c1++;
      else if (inf.type === 'C2 Warning' || (inf.type?.startsWith('C2') && !inf.type?.includes('C1'))) c2++;
      else if (inf.type?.toLowerCase().includes('warning')) gen++;
      else if (inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal')) c3++;
      else if (inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')) c4++;
      else if (inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension')) c5++;

      const isDetention = inf.type?.startsWith('C4') || inf.detentionStatus === 'Scheduled';
      if (isDetention && inf.detentionStatus !== 'Passed') {
        upcoming.push(inf);
      }
    });
    c3 += informal.length;
    const combined = c1 + c2 + gen;
    const weighted = (c1 * 1) + (c2 * 2) + (gen * 1) + (c3 * 3) + (c4 * 4) + (c5 * 5);

    return {
      myLogs: logs,
      myInformalSanctions: informal,
      c1Count: c1,
      c2Count: c2,
      genericWarningCount: gen,
      c1c2CombinedCount: combined,
      c3Count: c3,
      c4Count: c4,
      c5Count: c5,
      totalWeightedPoints: weighted,
      myUpcomingSanctions: upcoming
    };
  }, [safeInfractions, safeInformalSanctions, myEmail]);

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
    const targetEmail = logStaffEmail;

    // Check duplicate C4 for this user on this date
    if (isDetention) {
      const scheduledDate = (logDetentionDate || '').trim();
      const existingC4ForDate = safeInfractions.find(inf => 
        inf &&
        inf.staffEmail?.toLowerCase() === targetEmail.toLowerCase() &&
        (inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')) &&
        (inf.detentionDate || '').trim() === scheduledDate
      );

      if (existingC4ForDate) {
        alert('Unable to log (C4 Already Scheduled for this date for this user.)');
        return;
      }
    }

    const targetUser = users.find(u => u && u.email?.toLowerCase() === targetEmail.toLowerCase());
    const consequenceData = {
      type: logType,
      mainMessage: `[${logCategory}] ${logMainMessage}`,
      confidentialMessage: logConfidential,
      detentionLocation: isDetention ? (logDetentionLocation || 'Hall') : null,
      detentionDate: isDetention ? logDetentionDate : null,
      detentionTime: isDetention ? logDetentionTime : null
    };

    // Calculate new stats including this consequence before clearing form
    const newStats = computeStaffConsequenceStats(targetEmail, safeInfractions, safeInformalSanctions, logType);

    const wasAdded = addInfraction({
      staffEmail: targetEmail,
      type: logType,
      mainMessage: consequenceData.mainMessage,
      confidentialMessage: logConfidential,
      detentionDate: consequenceData.detentionDate,
      detentionTime: consequenceData.detentionTime,
      detentionLocation: consequenceData.detentionLocation
    });

    if (wasAdded === false) {
      alert('Could not log consequence. Please verify staff permissions.');
      return;
    }

    // Set summary modal data and open it to show the admin the updated consequence count
    setLoggedSummaryData({
      targetUser,
      targetEmail,
      loggedConsequence: consequenceData,
      stats: newStats
    });
    setShowLoggedSummaryModal(true);

    setLogStaffEmail('');
    setLogType('C1 Warning');
    setLogMainMessage('');
    setLogConfidential('');
    setLogDetentionLocation('Hall');
    setLogDetentionTime('14:55 - 15:15');
    setShowLogModal(false);
    setLogSuccess('Consequence logged successfully!');
    setTimeout(() => setLogSuccess(''), 4000);
  };

  // Fast O(1) lookup map for consequence points across all staff
  const staffPointsMap = useMemo(() => {
    const map = new Map();
    safeInfractions.forEach(inf => {
      if (!inf?.staffEmail) return;
      const email = inf.staffEmail.toLowerCase();
      let pts = 0;
      if (inf.type === 'C1 Warning' || (inf.type?.startsWith('C1') && !inf.type?.includes('C2'))) pts = 1;
      else if (inf.type === 'C2 Warning' || (inf.type?.startsWith('C2') && !inf.type?.includes('C1'))) pts = 2;
      else if (inf.type?.toLowerCase().includes('warning')) pts = 1;
      else if (inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal')) pts = 3;
      else if (inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')) pts = 4;
      else if (inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension')) pts = 5;
      map.set(email, (map.get(email) || 0) + pts);
    });
    safeInformalSanctions.forEach(s => {
      if (!s?.staffEmail) return;
      const email = s.staffEmail.toLowerCase();
      map.set(email, (map.get(email) || 0) + 3);
    });
    return map;
  }, [safeInfractions, safeInformalSanctions]);

  // Backward-compatible helper to calculate total consequence points for any staff member
  const calculateStaffPoints = (email) => {
    if (!email) return 0;
    return staffPointsMap.get(email.toLowerCase()) || 0;
  };

  // Filter for All Staff tab
  const filteredAllStaffLogs = useMemo(() => {
    const search = searchStaff.toLowerCase().trim();
    return safeInfractions.filter(inf => {
      if (!inf) return false;
      if (search) {
        const matchesSearch = `${inf.staffName || ''} ${inf.staffEmail || ''} ${inf.mainMessage || ''}`.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      if (tierFilter === 'c1c2') return inf.type?.startsWith('C1') || inf.type?.startsWith('C2') || inf.type?.toLowerCase().includes('warning');
      if (tierFilter === 'c3') return inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal');
      if (tierFilter === 'c4') return inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention');
      if (tierFilter === 'c5') return inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension');
      return true;
    });
  }, [safeInfractions, searchStaff, tierFilter]);

  const eligibleStaff = useMemo(() => {
    const curEmail = currentUser?.email?.toLowerCase();
    return users.filter(u => u && u.approved && u.email?.toLowerCase() !== curEmail);
  }, [users, currentUser?.email]);

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

      {/* Universal Staff Policy Banner: Visible to ALL staff and admins regardless of consequences */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14), rgba(15, 23, 42, 0.7))',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '14px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(239, 68, 68, 0.35)' }}>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Policy</span>
              <strong style={{ color: '#ef4444', fontSize: '1.02rem', letterSpacing: '0.2px' }}>
                35 consequences will result in a termination from the staff team.
              </strong>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '0.84rem', marginTop: '4px' }}>
              All staff members must maintain fewer than 35 consequence points to remain in active standing.
              {totalWeightedPoints > 0 ? (
                <> Your record: <strong style={{ color: totalWeightedPoints >= 30 ? '#ef4444' : totalWeightedPoints >= 18 ? '#f59e0b' : '#3b82f6' }}>{totalWeightedPoints} / 35 points</strong>.</>
              ) : (
                <> Your current record is clean (<strong>0 / 35 points</strong>).</>
              )}
            </div>
          </div>
        </div>
        <div style={{ minWidth: '170px', flex: '1 1 200px', maxWidth: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>
            <span>Termination Threshold</span>
            <span style={{ fontWeight: '700', color: totalWeightedPoints >= 35 ? '#ef4444' : '#f87171' }}>{totalWeightedPoints} / 35 ({Math.round((totalWeightedPoints / 35) * 100)}%)</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, Math.max(2, (totalWeightedPoints / 35) * 100))}%`,
              height: '100%',
              background: totalWeightedPoints >= 30 ? '#ef4444' : totalWeightedPoints >= 18 ? '#f59e0b' : '#10b981',
              borderRadius: '999px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

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
          
          {/* 1. TOP STATS: Individual Consequences Breakdown & Total Consequences Weighted Points */}
          <div style={styles.statsGrid}>
            {/* Total Consequences (Weighted Points: e.g. 2 C4s = 8) */}
            <div className="glass-panel" style={styles.totalScoreCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={styles.totalScoreLabel}>Total Consequences</span>
                <Flame size={20} color="#f87171" />
              </div>
              <div style={styles.totalScoreVal}>{totalWeightedPoints}</div>
              <div style={styles.totalScoreSub}>
                Weighted Points (C1=1, C2=2, C3=3, C4=4, C5=5)
              </div>
            </div>

            {/* C1 - C2 Warnings */}
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <div style={styles.statHeaderRow}>
                <span style={{ color: '#93c5fd', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>C1 - C2 Warnings</span>
                <span style={styles.weightBadgeBlue}>1 - 2 pts</span>
              </div>
              <div style={{ fontSize: '2.2rem', color: '#60a5fa', fontWeight: '800', margin: '8px 0 4px' }}>{c1c2CombinedCount}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                C1: {c1Count} &bull; C2: {c2Count}
              </div>
            </div>

            {/* C3 Informal Sanctions */}
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(234, 179, 8, 0.3)' }}>
              <div style={styles.statHeaderRow}>
                <span style={{ color: '#fde047', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>C3 Informal</span>
                <span style={styles.weightBadgeYellow}>3 pts each</span>
              </div>
              <div style={{ fontSize: '2.2rem', color: '#eab308', fontWeight: '800', margin: '8px 0 4px' }}>{c3Count}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Official informal sanctions
              </div>
            </div>

            {/* C4 Detentions */}
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div style={styles.statHeaderRow}>
                <span style={{ color: '#fcd34d', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>C4 Detentions</span>
                <span style={styles.weightBadgeAmber}>4 pts each</span>
              </div>
              <div style={{ fontSize: '2.2rem', color: '#f59e0b', fontWeight: '800', margin: '8px 0 4px' }}>{c4Count}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                20m / 40m Detentions
              </div>
            </div>

            {/* C5 Suspensions */}
            <div className="glass-panel" style={{ ...styles.statCard, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div style={styles.statHeaderRow}>
                <span style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>C5 Suspensions</span>
                <span style={styles.weightBadgeRed}>5 pts each</span>
              </div>
              <div style={{ fontSize: '2.2rem', color: '#ef4444', fontWeight: '800', margin: '8px 0 4px' }}>{c5Count}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                2-Day Lockouts
              </div>
            </div>
          </div>

          {/* 2. UPCOMING SANCTIONS: Rendered UNDER the stats, matching the portal dark glass theme */}
          <div className="glass-panel" style={styles.upcomingThemeCard}>
            <div style={styles.upcomingHeaderDark}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} color="#fbbf24" />
                <h3 style={styles.upcomingTitleDark}>Upcoming Sanctions</h3>
              </div>
              <span style={styles.upcomingCountBadge}>
                {myUpcomingSanctions.length} Scheduled
              </span>
            </div>

            <div style={styles.upcomingBodyDark}>
              {myUpcomingSanctions.length === 0 ? (
                <div style={styles.noUpcomingDark}>
                  <ShieldCheck size={28} color="#10b981" style={{ opacity: 0.6 }} />
                  <span>No upcoming sanctions scheduled.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {myUpcomingSanctions.map(sanc => {
                    const isC4b = sanc.type?.includes('C4B') || sanc.type?.toLowerCase().includes('40m');
                    const badgeText = isC4b ? 'C4b' : 'C4a';
                    const locationName = sanc.detentionLocation || 'Hall';
                    const titleText = `${isC4b ? 'C4B' : 'C4A'} (${locationName})`;
                    const timeText = sanc.detentionTime || (isC4b ? '14:55 - 15:35' : '14:55 - 15:15');

                    return (
                      <div key={sanc.id} style={styles.upcomingItemDark}>
                        <div style={styles.upcomingDateTextDark}>
                          {formatSanctionDate(sanc.detentionDate || sanc.timestamp)}
                        </div>
                        <div style={styles.upcomingRowDark}>
                          <span style={styles.c4BadgeDark}>{badgeText}</span>
                          {sanc.isEscalation && (
                            <span style={styles.escalationBadgeDark}>Escalation</span>
                          )}
                          <span style={styles.detentionTitleTextDark}>{titleText}</span>
                          
                          {isAdminOrMod && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLocationInfId(editingLocationInfId === sanc.id ? null : sanc.id);
                                setEditLocationValue(locationName);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '4px'
                              }}
                              title="Edit location for this detention"
                            >
                              <Edit3 size={13} />
                              <span style={{ textDecoration: 'underline' }}>Edit Location</span>
                            </button>
                          )}

                          <div style={styles.detentionTimeRowDark}>
                            <Clock size={15} color="#94a3b8" />
                            <span>{timeText}</span>
                          </div>
                        </div>

                        {/* Inline Location Editor for Admins */}
                        {editingLocationInfId === sanc.id && (
                          <div style={{
                            marginTop: '10px',
                            padding: '10px 14px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 'bold' }}>Update Location:</span>
                            <input
                              type="text"
                              value={editLocationValue}
                              onChange={e => setEditLocationValue(e.target.value)}
                              className="input-field"
                              style={{ padding: '4px 8px', fontSize: '0.82rem', width: '160px' }}
                              placeholder="e.g. Hall, Training Room"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!editLocationValue.trim()) return;
                                updateInfraction(sanc.id, { detentionLocation: editLocationValue.trim() });
                                setEditingLocationInfId(null);
                              }}
                              className="btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px' }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLocationInfId(null)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: '6px' }}
                            >
                              Cancel
                            </button>
                            <div style={{ display: 'flex', gap: '4px', width: '100%', marginTop: '4px' }}>
                              {['Hall', 'Training Room A', 'Staff Briefing Room', 'Executive Office', 'Flight Deck'].map(preset => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setEditLocationValue(preset)}
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '4px',
                                    color: '#9ca3af',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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

          {/* 3. LOG HISTORY */}
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
                          <span style={styles.escalationBadgeDark}>Escalated</span>
                        )}
                      </div>
                      <span style={styles.infDate}>{formatSanctionDate(inf.date || inf.timestamp)}</span>
                    </div>

                    {isC4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <Clock size={16} color="#f59e0b" />
                          <span style={{ fontSize: '0.85rem', color: '#fcd34d' }}>
                            <strong>Detention:</strong> {inf.detentionLocation || 'Hall'} &bull; {inf.detentionDate || 'Scheduled'} &bull; {inf.detentionTime || '14:55'}
                          </span>
                          {isAdminOrMod && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLocationInfId(editingLocationInfId === inf.id ? null : inf.id);
                                setEditLocationValue(inf.detentionLocation || 'Hall');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '4px'
                              }}
                              title="Edit Detention Location"
                            >
                              <Edit3 size={13} />
                              <span style={{ textDecoration: 'underline' }}>Edit Location</span>
                            </button>
                          )}
                          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 'bold', color: inf.detentionStatus === 'Passed' ? '#10b981' : inf.detentionStatus === 'Failed' ? '#ef4444' : '#f59e0b' }}>
                            Status: {inf.detentionStatus || 'Scheduled'}
                          </span>
                        </div>

                        {editingLocationInfId === inf.id && (
                          <div style={{
                            marginTop: '4px',
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 'bold' }}>Update Location:</span>
                            <input
                              type="text"
                              value={editLocationValue}
                              onChange={e => setEditLocationValue(e.target.value)}
                              className="input-field"
                              style={{ padding: '4px 8px', fontSize: '0.82rem', width: '150px' }}
                              placeholder="e.g. Hall, Training Room"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!editLocationValue.trim()) return;
                                updateInfraction(inf.id, { detentionLocation: editLocationValue.trim() });
                                setEditingLocationInfId(null);
                              }}
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLocationInfId(null)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
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

                const staffPts = calculateStaffPoints(inf.staffEmail);

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
                          <span style={styles.escalationBadgeDark}>Escalated</span>
                        )}
                        <span style={styles.staffTotalPointsBadge} title="Staff Member Total Weighted Points">
                          {staffPts} Total Pts
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

                    {isC4 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          <Clock size={16} color="#f59e0b" />
                          <span style={{ fontSize: '0.85rem', color: '#fcd34d' }}>
                            <strong>Detention:</strong> {inf.detentionLocation || 'Hall'} &bull; {inf.detentionDate || 'Scheduled'} &bull; {inf.detentionTime || '14:55'}
                          </span>
                          {isAdminOrMod && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLocationInfId(editingLocationInfId === inf.id ? null : inf.id);
                                setEditLocationValue(inf.detentionLocation || 'Hall');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '4px'
                              }}
                              title="Edit Detention Location"
                            >
                              <Edit3 size={13} />
                              <span style={{ textDecoration: 'underline' }}>Edit Location</span>
                            </button>
                          )}
                          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 'bold', color: inf.detentionStatus === 'Passed' ? '#10b981' : inf.detentionStatus === 'Failed' ? '#ef4444' : '#f59e0b' }}>
                            Status: {inf.detentionStatus || 'Scheduled'}
                          </span>
                        </div>

                        {editingLocationInfId === inf.id && (
                          <div style={{
                            marginTop: '4px',
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 'bold' }}>Update Location:</span>
                            <input
                              type="text"
                              value={editLocationValue}
                              onChange={e => setEditLocationValue(e.target.value)}
                              className="input-field"
                              style={{ padding: '4px 8px', fontSize: '0.82rem', width: '150px' }}
                              placeholder="e.g. Hall, Training Room"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!editLocationValue.trim()) return;
                                updateInfraction(inf.id, { detentionLocation: editLocationValue.trim() });
                                setEditingLocationInfId(null);
                              }}
                              className="btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLocationInfId(null)}
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
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
                  <option value="C1 Warning">C1 - Warning (1 pt)</option>
                  <option value="C2 Warning">C2 - Warning (2 pts)</option>
                  <option value="C3 Informal Sanction">C3 - Informal Sanction (3 pts)</option>
                  <option value="C4A - Infraction + 20m Detention">C4A - Infraction + 20 minute Detention (4 pts)</option>
                  <option value="C4B - 40m Detention">C4B - 40 minute Detention (4 pts)</option>
                  <option value="C5 Suspension">C5 - Suspension (2 Days) (5 pts)</option>
                </select>
              </div>

              {logType.startsWith('C4') && (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <Clock size={16} />
                    <span>Detention Schedule Parameters</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={styles.inputWrapper}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={styles.label}>Location on C4 (Replaces "Hall") *</label>
                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '600' }}>Editable</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 6px 0' }}>
                        Controls the location shown on the C4 sanction (e.g. C4A (Location) / C4B (Location))
                      </p>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {['Hall', 'Training Room A', 'Staff Briefing Room', 'Executive Office', 'Flight Deck'].map(loc => (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setLogDetentionLocation(loc)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              border: '1px solid',
                              borderColor: logDetentionLocation === loc ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                              background: logDetentionLocation === loc ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                              color: logDetentionLocation === loc ? '#f59e0b' : '#d1d5db',
                              cursor: 'pointer'
                            }}
                          >
                            {loc}
                          </button>
                        ))}
                      </div>
                      <input 
                        type="text" 
                        required 
                        value={logDetentionLocation} 
                        onChange={e => setLogDetentionLocation(e.target.value)} 
                        placeholder="e.g. Hall, Training Room"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

      {/* Modal: Consequence Logged Summary UI */}
      <ConsequenceLoggedModal
        isOpen={showLoggedSummaryModal}
        onClose={() => setShowLoggedSummaryModal(false)}
        targetUser={loggedSummaryData?.targetUser}
        targetEmail={loggedSummaryData?.targetEmail}
        loggedConsequence={loggedSummaryData?.loggedConsequence}
        stats={loggedSummaryData?.stats}
        onViewAll={() => setActiveTab('all')}
      />
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

  // 1. STATS GRID & TOTAL CARD
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    marginBottom: '8px',
  },
  totalScoreCard: {
    gridColumn: '1 / -1',
    padding: '20px 24px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.08)',
  },
  totalScoreLabel: {
    fontSize: '0.92rem',
    fontWeight: '800',
    color: '#fca5a5',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  totalScoreVal: {
    fontSize: '2.8rem',
    fontWeight: '900',
    color: '#f87171',
    lineHeight: '1.1',
    margin: '4px 0',
  },
  totalScoreSub: {
    fontSize: '0.8rem',
    color: '#cbd5e1',
    opacity: 0.85,
  },
  statCard: {
    padding: '16px 18px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  statHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightBadgeBlue: {
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
    fontWeight: '700',
  },
  weightBadgeYellow: {
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(234, 179, 8, 0.2)',
    color: '#fde047',
    fontWeight: '700',
  },
  weightBadgeAmber: {
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fcd34d',
    fontWeight: '700',
  },
  weightBadgeRed: {
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    fontWeight: '700',
  },

  // 2. UPCOMING SANCTIONS: PORTAL THEME MATCH
  upcomingThemeCard: {
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid var(--color-border, rgba(255, 255, 255, 0.08))',
    background: 'var(--color-bg-card, rgba(15, 23, 42, 0.65))',
    backdropFilter: 'blur(16px)',
  },
  upcomingHeaderDark: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingTitleDark: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--color-text-main, #f8fafc)',
  },
  upcomingCountBadge: {
    fontSize: '0.78rem',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '6px',
    background: 'rgba(245, 158, 11, 0.15)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  upcomingBodyDark: {
    padding: '18px 20px',
  },
  noUpcomingDark: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#94a3b8',
    fontSize: '0.92rem',
    padding: '8px 0',
  },
  upcomingItemDark: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '14px 16px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  upcomingDateTextDark: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#93c5fd',
  },
  upcomingRowDark: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  c4BadgeDark: {
    background: 'rgba(245, 158, 11, 0.25)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.45)',
    fontWeight: '800',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.02em',
  },
  escalationBadgeDark: {
    background: 'rgba(239, 68, 68, 0.25)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.45)',
    fontWeight: '700',
    fontSize: '0.75rem',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  detentionTitleTextDark: {
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  detentionTimeRowDark: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: '500',
    marginLeft: 'auto',
  },

  // 3. LOG HISTORY & DETAILS
  sectionNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 18px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.05)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  noticeText: {
    fontSize: '0.875rem',
    color: '#a7f3d0',
    margin: 0,
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
    gap: '16px',
  },
  infractionCard: {
    padding: '22px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
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
  staffTotalPointsBadge: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '2px 8px',
    borderRadius: '4px',
    marginLeft: '6px',
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
