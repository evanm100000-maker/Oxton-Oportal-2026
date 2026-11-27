import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { normalizeAppealStatus } from '../utils/appealUtils';
import {
  ShieldAlert,
  History,
  Lock,
  Trash2,
  ShieldCheck,
  Clock,
  Plus,
  Search,
  AlertTriangle,
  Flame,
  Edit3,
  BookOpen,
  MessageSquare,
} from 'lucide-react';
import ConsequenceLoggedModal, {
  computeStaffConsequenceStats,
  computeAllStaffConsequenceStatsMap,
  isC6Consequence,
  isScheduledSanctionType,
  formatUpcomingSanctionTime,
} from './ConsequenceLoggedModal';
import BehavioralCourseModal from './BehavioralCourseModal';
import LogConsequenceModal from './LogConsequenceModal';
import AppealSection from './AppealSection';

function parseCategoryAndMessage(raw) {
  const text = String(raw || '').trim();
  const match = text.match(/^\[([^\]]+)\]\s*(.*)$/s);
  if (match) {
    return { category: match[1].trim(), message: match[2].trim() };
  }
  return { category: null, message: text };
}

function getTierMeta(type, isInformal = false) {
  if (isC6Consequence(type)) {
    return {
      label: type || 'C6 - Behavioral Course',
      color: '#c084fc',
      bg: 'rgba(168, 85, 247, 0.14)',
      border: 'rgba(168, 85, 247, 0.35)',
      accent: '#a855f7',
      points: 6,
    };
  }
  if (type?.startsWith('C5') || type?.toLowerCase().includes('suspension')) {
    return {
      label: type || 'C5 Suspension',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.14)',
      border: 'rgba(239, 68, 68, 0.35)',
      accent: '#ef4444',
      points: 5,
    };
  }
  if (type?.startsWith('C4') || type?.toLowerCase().includes('detention')) {
    return {
      label: type || 'C4 Detention',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.14)',
      border: 'rgba(245, 158, 11, 0.35)',
      accent: '#f59e0b',
      points: 4,
    };
  }
  if (isInformal || type?.startsWith('C3') || type?.toLowerCase().includes('informal')) {
    return {
      label: isInformal ? 'C3 Informal Sanction' : (type || 'C3 Informal Sanction'),
      color: '#facc15',
      bg: 'rgba(234, 179, 8, 0.14)',
      border: 'rgba(234, 179, 8, 0.35)',
      accent: '#eab308',
      points: 3,
    };
  }
  if (type?.startsWith('C2')) {
    return {
      label: type || 'C2 Warning',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.14)',
      border: 'rgba(56, 189, 248, 0.35)',
      accent: '#38bdf8',
      points: 2,
    };
  }
  return {
    label: type || 'C1 Warning',
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.14)',
    border: 'rgba(59, 130, 246, 0.35)',
    accent: '#3b82f6',
    points: 1,
  };
}

function formatSanctionDate(dateStr) {
  if (!dateStr) return 'Upcoming';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

const InfractionCard = React.memo(function InfractionCard({
  inf,
  isAllView = false,
  isAdminOrMod = false,
  canDelete = false,
  staffTotalPts = 0,
  onDelete,
  onAppealSubmit,
  onAppealReply,
  onAppealStatusChange,
  onUpdateLocation,
  onToggleCourseAccess,
  onOpenCourse,
  onNotifySuccess,
}) {
  const [isAppealing, setIsAppealing] = useState(false);
  const [appealDraft, setAppealDraft] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationDraft, setLocationDraft] = useState(inf.detentionLocation || 'Hall');

  const isInformal = !inf.type && Boolean(inf.reason);
  const tier = getTierMeta(inf.type, isInformal);
  const isC6 = isC6Consequence(inf.type);
  const isC4 = Boolean(inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention'));
  const { category, message } = parseCategoryAndMessage(isInformal ? inf.reason : inf.mainMessage);
  const infKey = inf.id || inf._firebaseKey;

  const handleAppealFormSubmit = (e) => {
    e.preventDefault();
    const cleaned = appealDraft.trim();
    if (!cleaned) return;
    onAppealSubmit(infKey, cleaned);
    setAppealDraft('');
    setIsAppealing(false);
  };

  return (
    <article
      style={{
        ...styles.card,
        borderLeft: `4px solid ${tier.accent}`,
      }}
    >
      {/* Card Header */}
      <div style={styles.cardHeader}>
        <div style={styles.cardTitleGroup}>
          {isAllView && (
            <div style={styles.staffIdentity}>
              <strong style={styles.staffName}>{inf.staffName || inf.staffEmail}</strong>
              <span style={styles.staffEmail}>{inf.staffEmail}</span>
              <span
                style={{
                  ...styles.totalPtsPill,
                  color: staffTotalPts >= 30 ? '#f87171' : staffTotalPts >= 18 ? '#fbbf24' : '#93c5fd',
                  borderColor: staffTotalPts >= 30 ? 'rgba(239, 68, 68, 0.35)' : staffTotalPts >= 18 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(59, 130, 246, 0.3)',
                  background: staffTotalPts >= 30 ? 'rgba(239, 68, 68, 0.12)' : staffTotalPts >= 18 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                }}
              >
                {staffTotalPts} / 35 pts
              </span>
            </div>
          )}

          <div style={styles.badgeRow}>
            <span
              style={{
                ...styles.tierBadge,
                background: tier.bg,
                color: tier.color,
                border: `1px solid ${tier.border}`,
              }}
            >
              {tier.label}
            </span>
            <span style={styles.ptsChip}>+{tier.points} pt{tier.points === 1 ? '' : 's'}</span>
            {category && <span style={styles.categoryChip}>{category}</span>}
            {inf.isEscalation && <span style={styles.escalationChip}>Escalated</span>}
          </div>
        </div>

        <div style={styles.cardMetaRight}>
          <span style={styles.dateText}>{formatSanctionDate(inf.date || inf.timestamp)}</span>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(infKey, isInformal)}
              className="btn-danger"
              style={styles.deleteBtn}
              title="Remove Consequence"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Reason / Details */}
      <p style={styles.reasonText}>{message}</p>

      {/* Scheduled Detention / Behavioral Course Strip */}
      {(isC4 || isC6) && (
        <div
          style={{
            ...styles.scheduleStrip,
            background: isC6 ? 'rgba(168, 85, 247, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            borderColor: isC6 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(245, 158, 11, 0.25)',
          }}
        >
          <div style={styles.scheduleStripMain}>
            <Clock size={15} color={isC6 ? '#c084fc' : '#f59e0b'} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.84rem', color: isC6 ? '#e9d5ff' : '#fde68a' }}>
              <strong>{isC6 ? 'Behavioral Course' : 'Detention'}:</strong>{' '}
              {inf.detentionLocation || (isC6 ? 'Behavioral Course' : 'Hall')} &bull;{' '}
              {inf.detentionDate || 'Scheduled'} &bull;{' '}
              {formatUpcomingSanctionTime(inf.detentionTime, inf.type)}
            </span>

            <div style={styles.scheduleActions}>
              {isC6 && isAdminOrMod && inf.detentionStatus !== 'Passed' && (
                <button
                  type="button"
                  onClick={() => {
                    const nextAllowed = !inf.courseUnlocked;
                    onToggleCourseAccess(infKey, nextAllowed);
                    onNotifySuccess(
                      nextAllowed
                        ? 'C6 Behavioral Course access allowed for staff member.'
                        : 'C6 Behavioral Course access locked.'
                    );
                  }}
                  className={inf.courseUnlocked ? 'btn-secondary' : 'btn-primary'}
                  style={styles.smallActionBtn}
                >
                  {inf.courseUnlocked ? 'Access Allowed (Lock)' : 'Allow Course Access'}
                </button>
              )}

              {!isAllView && isC6 && inf.detentionStatus !== 'Passed' && (
                <button
                  type="button"
                  onClick={() => onOpenCourse(inf)}
                  className="btn-primary"
                  style={{
                    ...styles.smallActionBtn,
                    background: inf.courseUnlocked
                      ? 'linear-gradient(135deg, #a855f7, #7e22ce)'
                      : 'rgba(148, 163, 184, 0.2)',
                  }}
                >
                  {inf.courseUnlocked ? <BookOpen size={13} /> : <Lock size={13} />}
                  {inf.courseUnlocked ? 'Start Course' : 'Open Course'}
                </button>
              )}

              {isAdminOrMod && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingLocation(prev => !prev);
                    setLocationDraft(inf.detentionLocation || (isC6 ? 'Behavioral Course' : 'Hall'));
                  }}
                  style={styles.inlineEditBtn}
                  title="Edit scheduled location"
                >
                  <Edit3 size={13} />
                  <span>Edit Location</span>
                </button>
              )}

              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  color:
                    inf.detentionStatus === 'Passed'
                      ? '#34d399'
                      : inf.detentionStatus === 'Failed'
                        ? '#f87171'
                        : '#fbbf24',
                }}
              >
                {inf.detentionStatus || 'Scheduled'}
              </span>
            </div>
          </div>

          {isEditingLocation && (
            <div style={styles.locationEditRow}>
              <input
                type="text"
                value={locationDraft}
                onChange={e => setLocationDraft(e.target.value)}
                className="input-field"
                style={{ padding: '5px 10px', fontSize: '0.82rem', width: '180px' }}
                placeholder="e.g. Hall, Training Room"
              />
              <button
                type="button"
                onClick={() => {
                  if (!locationDraft.trim()) return;
                  onUpdateLocation(infKey, locationDraft.trim());
                  setIsEditingLocation(false);
                }}
                className="btn-primary"
                style={styles.smallActionBtn}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingLocation(false)}
                className="btn-secondary"
                style={styles.smallActionBtn}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Admin Confidential Note */}
      {isAllView && inf.confidentialMessage && (
        <div style={styles.confidentialBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22d3ee', fontSize: '0.73rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <Lock size={12} />
            Confidential Note (Admin Only)
          </div>
          <p style={styles.confidentialText}>{inf.confidentialMessage}</p>
        </div>
      )}

      {/* Appeal & Admin Reply / Status Section */}
      {inf.appeal ? (
        <AppealSection
          appeal={inf.appeal}
          infId={infKey}
          staffEmail={inf.staffEmail}
          canManage={isAllView && isAdminOrMod}
          onReply={onAppealReply}
          onStatusChange={onAppealStatusChange}
        />
      ) : (
        !isAllView && !isInformal && (
          isAppealing ? (
            <form onSubmit={handleAppealFormSubmit} style={styles.appealComposer}>
              <textarea
                required
                value={appealDraft}
                onChange={e => setAppealDraft(e.target.value)}
                placeholder="Explain clearly why you are appealing this consequence..."
                className="input-field"
                rows="2"
                style={{ resize: 'vertical', fontSize: '0.86rem' }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAppealing(false);
                    setAppealDraft('');
                  }}
                  className="btn-secondary"
                  style={styles.smallActionBtn}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={styles.smallActionBtn}>
                  Submit Appeal
                </button>
              </div>
            </form>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setIsAppealing(true)}
                className="btn-secondary"
                style={styles.appealBtn}
              >
                <MessageSquare size={14} />
                Appeal Consequence
              </button>
            </div>
          )
        )
      )}

      {/* Footer */}
      <div style={styles.cardFooter}>
        <span>
          Logged by <strong>{inf.adminName || inf.issuedByName || 'Administrator'}</strong>
        </span>
      </div>
    </article>
  );
});

export default function Infractions() {
  const {
    infractions = [],
    deleteInfraction,
    appealInfraction,
    replyToInfractionAppeal,
    updateAppealStatus,
    addInfraction,
    updateInfraction,
    completeBehavioralCourse,
    setBehavioralCourseAccess,
    informalSanctions = [],
    deleteInformalSanction,
    users = [],
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState('my');
  const [searchStaff, setSearchStaff] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [logSuccess, setLogSuccess] = useState('');
  const [activeCourseSanction, setActiveCourseSanction] = useState(null);
  const [showLoggedSummaryModal, setShowLoggedSummaryModal] = useState(false);
  const [loggedSummaryData, setLoggedSummaryData] = useState(null);

  const isAdminOrMod = Boolean(currentUser?.isAdmin || currentUser?.siteRole === 'Moderator');
  const canDeleteConsequence = Boolean(
    currentUser?.siteRole === 'Owner' || currentUser?.email?.toLowerCase() === 'evanm.100000@gmail.com'
  );

  const safeInfractions = useMemo(() => (Array.isArray(infractions) ? infractions : []), [infractions]);
  const safeInformalSanctions = useMemo(() => (Array.isArray(informalSanctions) ? informalSanctions : []), [informalSanctions]);
  const myEmail = currentUser?.email || '';
  const myEmailLower = myEmail.toLowerCase().trim();

  const notifySuccess = useCallback((msg) => {
    setLogSuccess(msg);
    setTimeout(() => setLogSuccess(''), 3800);
  }, []);

  const {
    myLogs,
    myInformalSanctions,
    c1Count,
    c2Count,
    c1c2CombinedCount,
    c3Count,
    c4Count,
    c5Count,
    c6Count,
    totalWeightedPoints,
    myUpcomingSanctions,
  } = useMemo(() => {
    const logs = safeInfractions.filter(inf => inf && inf.staffEmail?.toLowerCase().trim() === myEmailLower);
    const informal = safeInformalSanctions.filter(sanc => sanc && sanc.staffEmail?.toLowerCase().trim() === myEmailLower);
    let c1 = 0, c2 = 0, gen = 0, c3 = 0, c4 = 0, c5 = 0, c6 = 0;
    const upcoming = [];

    for (let i = 0; i < logs.length; i++) {
      const inf = logs[i];
      if (!inf) continue;
      if (inf.type === 'C1 Warning' || (inf.type?.startsWith('C1') && !inf.type?.includes('C2'))) c1++;
      else if (inf.type === 'C2 Warning' || (inf.type?.startsWith('C2') && !inf.type?.includes('C1'))) c2++;
      else if (inf.type?.toLowerCase().includes('warning')) gen++;
      else if (inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal')) c3++;
      else if (inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')) c4++;
      else if (inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension')) c5++;
      else if (isC6Consequence(inf.type)) c6++;

      const isScheduled = isScheduledSanctionType(inf.type) || inf.detentionStatus === 'Scheduled';
      if (isScheduled && inf.detentionStatus !== 'Passed') {
        upcoming.push(inf);
      }
    }
    c3 += informal.length;
    const combined = c1 + c2 + gen;
    const weighted = c1 * 1 + c2 * 2 + gen * 1 + c3 * 3 + c4 * 4 + c5 * 5 + c6 * 6;

    return {
      myLogs: logs,
      myInformalSanctions: informal,
      c1Count: c1,
      c2Count: c2,
      c1c2CombinedCount: combined,
      c3Count: c3,
      c4Count: c4,
      c5Count: c5,
      c6Count: c6,
      totalWeightedPoints: weighted,
      myUpcomingSanctions: upcoming,
    };
  }, [safeInfractions, safeInformalSanctions, myEmailLower]);

  // O(N) lookup map for all staff consequence points
  const statsMap = useMemo(
    () => computeAllStaffConsequenceStatsMap(safeInfractions, safeInformalSanctions),
    [safeInfractions, safeInformalSanctions]
  );

  const pendingAppealsCount = useMemo(
    () => safeInfractions.filter(inf => inf?.appeal && normalizeAppealStatus(inf.appeal.status) === 'Pending').length,
    [safeInfractions]
  );

  const totalAppealsCount = useMemo(
    () => safeInfractions.filter(inf => Boolean(inf?.appeal?.text)).length,
    [safeInfractions]
  );

  const filteredAllStaffLogs = useMemo(() => {
    const search = searchStaff.toLowerCase().trim();
    return safeInfractions.filter(inf => {
      if (!inf) return false;
      if (search) {
        const matchesSearch = `${inf.staffName || ''} ${inf.staffEmail || ''} ${inf.mainMessage || ''} ${inf.appeal?.text || ''}`
          .toLowerCase()
          .includes(search);
        if (!matchesSearch) return false;
      }

      if (tierFilter === 'appeals') return Boolean(inf.appeal?.text);
      if (tierFilter === 'pending_appeals') return Boolean(inf.appeal?.text) && normalizeAppealStatus(inf.appeal.status) === 'Pending';
      if (tierFilter === 'c1c2') return inf.type?.startsWith('C1') || inf.type?.startsWith('C2') || inf.type?.toLowerCase().includes('warning');
      if (tierFilter === 'c3') return inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal');
      if (tierFilter === 'c4') return inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention');
      if (tierFilter === 'c5') return inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension');
      if (tierFilter === 'c6') return isC6Consequence(inf.type);
      return true;
    });
  }, [safeInfractions, searchStaff, tierFilter]);

  const handleDelete = useCallback(
    (id, isInformal = false) => {
      if (window.confirm('Are you sure you want to remove this consequence?')) {
        if (isInformal) deleteInformalSanction(id);
        else deleteInfraction(id);
      }
    },
    [deleteInfraction, deleteInformalSanction]
  );

  const handleUpdateLocation = useCallback(
    (infId, nextLoc) => {
      updateInfraction(infId, { detentionLocation: nextLoc });
      notifySuccess('Scheduled location updated.');
    },
    [updateInfraction, notifySuccess]
  );

  const handleSubmitConsequence = useCallback(
    (payload) => {
      const newStats = computeStaffConsequenceStats(
        payload.staffEmail,
        safeInfractions,
        safeInformalSanctions,
        payload.type
      );

      const wasAdded = addInfraction({
        staffEmail: payload.staffEmail,
        type: payload.type,
        mainMessage: payload.mainMessage,
        confidentialMessage: payload.confidentialMessage,
        detentionDate: payload.detentionDate,
        detentionTime: payload.detentionTime,
        detentionLocation: payload.detentionLocation,
        suspensionDurationHours: payload.suspensionDurationHours,
        suspensionDurationLabel: payload.suspensionDurationLabel,
      });

      if (wasAdded === false) return false;

      setShowLogModal(false);
      setLoggedSummaryData({
        targetUser: payload.targetUser,
        targetEmail: payload.staffEmail,
        loggedConsequence: payload,
        stats: newStats,
      });
      setShowLoggedSummaryModal(true);
      notifySuccess('Consequence logged successfully!');
      return true;
    },
    [safeInfractions, safeInformalSanctions, addInfraction, notifySuccess]
  );

  if (!currentUser) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <ShieldAlert size={44} color="rgba(255,255,255,0.2)" />
          <p style={styles.emptyText}>Please sign in to view your consequences.</p>
        </div>
      </div>
    );
  }

  const standingPercent = Math.min(100, Math.round((totalWeightedPoints / 35) * 100));
  const standingColor = totalWeightedPoints >= 35 ? '#ef4444' : totalWeightedPoints >= 28 ? '#f59e0b' : totalWeightedPoints > 0 ? '#38bdf8' : '#10b981';
  const standingLabel = totalWeightedPoints >= 35 ? 'Termination Limit Reached' : totalWeightedPoints >= 28 ? 'Near Limit' : totalWeightedPoints === 0 ? 'Clean Standing' : 'Active Standing';

  return (
    <div style={styles.container}>
      {logSuccess && (
        <div style={styles.successAlert}>
          <ShieldCheck size={17} />
          <span>{logSuccess}</span>
        </div>
      )}

      {/* Admin Tab Switcher + Log Action */}
      {isAdminOrMod && (
        <div style={styles.tabHeader}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActiveTab('my')}
              style={{
                ...styles.tabBtn,
                background: activeTab === 'my' ? 'rgba(59, 130, 246, 0.16)' : 'rgba(255,255,255,0.03)',
                borderColor: activeTab === 'my' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.08)',
                color: activeTab === 'my' ? '#ffffff' : '#94a3b8',
              }}
            >
              <ShieldCheck size={16} />
              <span>My Consequences</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                ...styles.tabBtn,
                background: activeTab === 'all' ? 'rgba(59, 130, 246, 0.16)' : 'rgba(255,255,255,0.03)',
                borderColor: activeTab === 'all' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.08)',
                color: activeTab === 'all' ? '#ffffff' : '#94a3b8',
              }}
            >
              <History size={16} />
              <span>All Staff Consequences ({safeInfractions.length})</span>
              {pendingAppealsCount > 0 && (
                <span style={styles.pendingAppealCounter}>{pendingAppealsCount} Pending Appeal{pendingAppealsCount === 1 ? '' : 's'}</span>
              )}
            </button>
          </div>

          <button type="button" onClick={() => setShowLogModal(true)} className="btn-danger" style={styles.logNewBtn}>
            <Plus size={16} />
            <span>Log Consequence</span>
          </button>
        </div>
      )}

      {/* MY CONSEQUENCES TAB */}
      {(!isAdminOrMod || activeTab === 'my') && (
        <div style={styles.sectionStack}>
          {/* Unified Standing & Policy Summary Card */}
          <div style={styles.standingCard}>
            <div style={styles.standingTop}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
                <div style={{ ...styles.standingIconBox, borderColor: `${standingColor}55`, background: `${standingColor}1a` }}>
                  {totalWeightedPoints >= 28 ? <AlertTriangle size={22} color={standingColor} /> : <Flame size={22} color={standingColor} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={styles.standingKicker}>Consequence Standing</span>
                    <span style={{ ...styles.standingStatusBadge, color: standingColor, borderColor: `${standingColor}55`, background: `${standingColor}18` }}>
                      {standingLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '900', color: standingColor, lineHeight: 1 }}>
                      {totalWeightedPoints}
                    </span>
                    <span style={{ fontSize: '0.95rem', color: '#94a3b8', fontWeight: '600' }}>
                      / 35 Consequence Points
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ flex: '1 1 260px', maxWidth: '380px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8', marginBottom: '6px' }}>
                  <span>35-Point Termination Policy</span>
                  <span style={{ color: standingColor, fontWeight: '700' }}>{standingPercent}%</span>
                </div>
                <div style={styles.progressTrack}>
                  <div
                    style={{
                      width: `${Math.max(totalWeightedPoints > 0 ? 3 : 0, standingPercent)}%`,
                      height: '100%',
                      background: standingColor,
                      borderRadius: '999px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>
                  Reaching 35 points results in termination from the staff team.
                </div>
              </div>
            </div>

            {/* Compact Tier Breakdown */}
            <div style={styles.tierGrid}>
              <div style={styles.tierTile}>
                <div style={styles.tierTileTop}>
                  <span style={{ color: '#93c5fd' }}>C1–C2 Warnings</span>
                  <span style={styles.tierPts}>1–2 pts</span>
                </div>
                <div style={{ ...styles.tierValue, color: '#60a5fa' }}>{c1c2CombinedCount}</div>
                <div style={styles.tierSub}>C1: {c1Count} &bull; C2: {c2Count}</div>
              </div>

              <div style={styles.tierTile}>
                <div style={styles.tierTileTop}>
                  <span style={{ color: '#fde047' }}>C3 Informal</span>
                  <span style={styles.tierPts}>3 pts</span>
                </div>
                <div style={{ ...styles.tierValue, color: '#eab308' }}>{c3Count}</div>
                <div style={styles.tierSub}>Informal sanctions</div>
              </div>

              <div style={styles.tierTile}>
                <div style={styles.tierTileTop}>
                  <span style={{ color: '#fcd34d' }}>C4 Detentions</span>
                  <span style={styles.tierPts}>4 pts</span>
                </div>
                <div style={{ ...styles.tierValue, color: '#f59e0b' }}>{c4Count}</div>
                <div style={styles.tierSub}>20m / 40m sessions</div>
              </div>

              <div style={styles.tierTile}>
                <div style={styles.tierTileTop}>
                  <span style={{ color: '#fca5a5' }}>C5 Suspensions</span>
                  <span style={styles.tierPts}>5 pts</span>
                </div>
                <div style={{ ...styles.tierValue, color: '#ef4444' }}>{c5Count}</div>
                <div style={styles.tierSub}>Temporary suspensions</div>
              </div>

              <div style={styles.tierTile}>
                <div style={styles.tierTileTop}>
                  <span style={{ color: '#d8b4fe' }}>C6 Course</span>
                  <span style={styles.tierPts}>6 pts</span>
                </div>
                <div style={{ ...styles.tierValue, color: '#a855f7' }}>{c6Count}</div>
                <div style={styles.tierSub}>Behavioral courses</div>
              </div>
            </div>
          </div>

          {/* Upcoming Sanctions (compact when empty, detailed when active) */}
          <div style={styles.upcomingCard}>
            <div style={styles.upcomingHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#fbbf24" />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
                  Upcoming Sanctions
                </h3>
              </div>
              <span style={styles.upcomingCountBadge}>
                {myUpcomingSanctions.length} Scheduled
              </span>
            </div>

            {myUpcomingSanctions.length === 0 ? (
              <div style={styles.noUpcomingRow}>
                <ShieldCheck size={18} color="#10b981" />
                <span>No upcoming detentions or behavioral courses scheduled.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px 18px' }}>
                {myUpcomingSanctions.map(sanc => {
                  const isC6 = isC6Consequence(sanc.type);
                  const isC4b = sanc.type?.includes('C4B') || sanc.type?.toLowerCase().includes('40m');
                  const badgeText = isC6 ? 'C6' : isC4b ? 'C4B' : 'C4A';
                  const locationName = sanc.detentionLocation || (isC6 ? 'Behavioral Course' : 'Hall');
                  const timeText = formatUpcomingSanctionTime(sanc.detentionTime, sanc.type);

                  return (
                    <div key={sanc.id} style={styles.upcomingRowItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={isC6 ? styles.c6Badge : styles.c4Badge}>{badgeText}</span>
                        <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                          {isC6 ? `Behavioral Course (${locationName})` : `${isC4b ? '40m' : '20m'} Detention (${locationName})`}
                        </strong>
                        {sanc.isEscalation && <span style={styles.escalationChip}>Escalated</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginLeft: 'auto' }}>
                        <span style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: '600' }}>
                          {formatSanctionDate(sanc.detentionDate || sanc.timestamp)} &bull; {timeText}
                        </span>
                        {isC6 && (
                          <button
                            type="button"
                            onClick={() => setActiveCourseSanction(sanc)}
                            className="btn-primary"
                            style={{
                              ...styles.smallActionBtn,
                              background: sanc.courseUnlocked
                                ? 'linear-gradient(135deg, #a855f7, #7e22ce)'
                                : 'rgba(148, 163, 184, 0.22)',
                            }}
                          >
                            {sanc.courseUnlocked ? <BookOpen size={13} /> : <Lock size={13} />}
                            {sanc.courseUnlocked ? 'Start Course' : 'Open Course'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Disciplinary Record List */}
          <div style={styles.sectionHeaderRow}>
            <div>
              <h3 style={styles.sectionHeading}>Disciplinary Record</h3>
              <p style={styles.sectionSub}>
                Official consequences logged on your staff record. You may submit an appeal on any consequence below.
              </p>
            </div>
            <span style={styles.recordCountChip}>{myLogs.length + myInformalSanctions.length} Total</span>
          </div>

          {myLogs.length === 0 && myInformalSanctions.length === 0 ? (
            <div style={styles.emptyState}>
              <ShieldCheck size={42} color="rgba(16, 185, 129, 0.45)" />
              <p style={{ ...styles.emptyText, color: '#34d399', fontWeight: '600' }}>
                Your record is clean. No consequences have been logged.
              </p>
            </div>
          ) : (
            <div style={styles.cardList}>
              {myLogs.map(inf => (
                <InfractionCard
                  key={inf.id || inf._firebaseKey}
                  inf={inf}
                  isAllView={false}
                  isAdminOrMod={isAdminOrMod}
                  canDelete={false}
                  onAppealSubmit={appealInfraction}
                  onUpdateLocation={handleUpdateLocation}
                  onToggleCourseAccess={setBehavioralCourseAccess}
                  onOpenCourse={setActiveCourseSanction}
                  onNotifySuccess={notifySuccess}
                />
              ))}

              {myInformalSanctions.map(sanc => (
                <InfractionCard
                  key={sanc.id || sanc._firebaseKey}
                  inf={sanc}
                  isAllView={false}
                  isAdminOrMod={isAdminOrMod}
                  canDelete={false}
                  onNotifySuccess={notifySuccess}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ALL STAFF CONSEQUENCES TAB (ADMIN / MOD) */}
      {isAdminOrMod && activeTab === 'all' && (
        <div style={styles.sectionStack}>
          <div style={styles.filterToolbar}>
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search staff name, email, reason, or appeal..."
                value={searchStaff}
                onChange={e => setSearchStaff(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '36px', width: '100%', paddingTop: '9px', paddingBottom: '9px', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${safeInfractions.length})` },
                { id: 'pending_appeals', label: `Pending Appeals (${pendingAppealsCount})` },
                { id: 'appeals', label: `All Appeals (${totalAppealsCount})` },
                { id: 'c1c2', label: 'C1/C2' },
                { id: 'c3', label: 'C3' },
                { id: 'c4', label: 'C4' },
                { id: 'c5', label: 'C5' },
                { id: 'c6', label: 'C6' },
              ].map(f => {
                const isActive = tierFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setTierFilter(f.id)}
                    style={{
                      ...styles.filterChip,
                      background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                      borderColor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                      color: isActive ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredAllStaffLogs.length === 0 ? (
            <div style={styles.emptyState}>
              <ShieldAlert size={42} color="rgba(255,255,255,0.2)" />
              <p style={styles.emptyText}>No consequences match your search or filter.</p>
            </div>
          ) : (
            <div style={styles.cardList}>
              {filteredAllStaffLogs.map(inf => {
                const staffPts = statsMap.get(inf.staffEmail?.toLowerCase().trim() || '')?.totalPoints || 0;
                return (
                  <InfractionCard
                    key={inf.id || inf._firebaseKey}
                    inf={inf}
                    isAllView={true}
                    isAdminOrMod={isAdminOrMod}
                    canDelete={canDeleteConsequence}
                    staffTotalPts={staffPts}
                    onDelete={handleDelete}
                    onAppealReply={replyToInfractionAppeal}
                    onAppealStatusChange={updateAppealStatus}
                    onUpdateLocation={handleUpdateLocation}
                    onToggleCourseAccess={setBehavioralCourseAccess}
                    onNotifySuccess={notifySuccess}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Shared Log Consequence Modal */}
      <LogConsequenceModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        users={users}
        currentUser={currentUser}
        infractions={safeInfractions}
        onSubmitConsequence={handleSubmitConsequence}
      />

      {/* Consequence Logged Summary Modal */}
      <ConsequenceLoggedModal
        isOpen={showLoggedSummaryModal}
        onClose={() => setShowLoggedSummaryModal(false)}
        targetUser={loggedSummaryData?.targetUser}
        targetEmail={loggedSummaryData?.targetEmail}
        loggedConsequence={loggedSummaryData?.loggedConsequence}
        stats={loggedSummaryData?.stats}
        onViewAll={() => setActiveTab('all')}
      />

      {/* C6 Behavioral Course Modal */}
      <BehavioralCourseModal
        isOpen={Boolean(activeCourseSanction)}
        onClose={() => setActiveCourseSanction(null)}
        sanction={activeCourseSanction}
        onComplete={(sanctionId) => {
          if (completeBehavioralCourse) {
            completeBehavioralCourse(sanctionId);
          }
          setActiveCourseSanction(null);
          notifySuccess('Behavioral Course completed and marked Passed!');
        }}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.14)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    borderRadius: '10px',
    padding: '11px 16px',
    fontSize: '0.88rem',
    color: '#a7f3d0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: '600',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 15px',
    borderRadius: '9px',
    border: '1px solid',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  pendingAppealCounter: {
    background: 'rgba(245, 158, 11, 0.22)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.45)',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '2px 7px',
    borderRadius: '999px',
  },
  logNewBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '9px 16px',
    borderRadius: '9px',
    fontSize: '0.86rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  sectionStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  standingCard: {
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  standingTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  standingIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  standingKicker: {
    fontSize: '0.78rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
  },
  standingStatusBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '999px',
    border: '1px solid',
  },
  progressTrack: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
    gap: '10px',
  },
  tierTile: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tierTileTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.73rem',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tierPts: {
    fontSize: '0.68rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  tierValue: {
    fontSize: '1.65rem',
    fontWeight: '800',
    lineHeight: 1.15,
    marginTop: '2px',
  },
  tierSub: {
    fontSize: '0.73rem',
    color: '#94a3b8',
  },
  upcomingCard: {
    background: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  upcomingHeader: {
    padding: '13px 18px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingCountBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '2px 9px',
    borderRadius: '999px',
    background: 'rgba(245, 158, 11, 0.14)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  noUpcomingRow: {
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#94a3b8',
    fontSize: '0.86rem',
  },
  upcomingRowItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  c4Badge: {
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    fontWeight: '800',
    fontSize: '0.72rem',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  c6Badge: {
    background: 'rgba(168, 85, 247, 0.2)',
    color: '#d8b4fe',
    border: '1px solid rgba(168, 85, 247, 0.4)',
    fontWeight: '800',
    fontSize: '0.72rem',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  sectionHeading: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  },
  sectionSub: {
    margin: '2px 0 0 0',
    fontSize: '0.82rem',
    color: '#94a3b8',
  },
  recordCountChip: {
    fontSize: '0.76rem',
    fontWeight: '700',
    color: '#cbd5e1',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '3px 10px',
    borderRadius: '999px',
  },
  filterToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterChip: {
    padding: '7px 12px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  card: {
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    flexWrap: 'wrap',
  },
  cardTitleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  staffIdentity: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  staffName: {
    fontSize: '1rem',
    color: 'var(--color-text-main)',
  },
  staffEmail: {
    fontSize: '0.82rem',
    color: '#94a3b8',
  },
  totalPtsPill: {
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '999px',
    border: '1px solid',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    flexWrap: 'wrap',
  },
  tierBadge: {
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '0.74rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  ptsChip: {
    fontSize: '0.73rem',
    fontWeight: '700',
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  categoryChip: {
    fontSize: '0.73rem',
    fontWeight: '600',
    color: '#cbd5e1',
    background: 'rgba(148, 163, 184, 0.12)',
    border: '1px solid rgba(148, 163, 184, 0.22)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  escalationChip: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#fb923c',
    background: 'rgba(249, 115, 22, 0.16)',
    border: '1px solid rgba(249, 115, 22, 0.35)',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  cardMetaRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dateText: {
    fontSize: '0.78rem',
    color: '#94a3b8',
  },
  deleteBtn: {
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  reasonText: {
    margin: 0,
    fontSize: '0.94rem',
    color: '#e2e8f0',
    lineHeight: '1.55',
    whiteSpace: 'pre-wrap',
  },
  scheduleStrip: {
    border: '1px solid',
    borderRadius: '9px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scheduleStripMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  scheduleActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginLeft: 'auto',
  },
  locationEditRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    paddingTop: '4px',
  },
  smallActionBtn: {
    padding: '5px 11px',
    fontSize: '0.76rem',
    fontWeight: '600',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
  },
  inlineEditBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fbbf24',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 4px',
  },
  confidentialBox: {
    background: 'rgba(6, 182, 212, 0.06)',
    border: '1px solid rgba(6, 182, 212, 0.22)',
    borderLeft: '3px solid #06b6d4',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  confidentialText: {
    margin: 0,
    fontSize: '0.84rem',
    color: '#cffafe',
    lineHeight: '1.45',
  },
  appealBtn: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    borderRadius: '7px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  appealComposer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '9px',
    background: 'rgba(59, 130, 246, 0.06)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '0.75rem',
    color: '#94a3b8',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '10px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '44px 16px',
    background: 'rgba(15, 23, 42, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '12px',
  },
  emptyText: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.92rem',
  },
};
