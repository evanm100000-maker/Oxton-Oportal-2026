import React from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Flame, Clock, 
  User, CheckCircle2, X, ArrowUpRight, Award, AlertOctagon 
} from 'lucide-react';

/**
 * Computes individual consequence tier counts and weighted points total.
 * Point scale: C1 = 1pt, C2 = 2pts, C3 = 3pts, C4 = 4pts, C5 = 5pts.
 * Termination limit: 35 points.
 */
export function computeStaffConsequenceStats(staffEmail, infractions = [], informalSanctions = [], additionalNewType = null) {
  if (!staffEmail) {
    return {
      c1Count: 0,
      c2Count: 0,
      genericWarningCount: 0,
      c1c2CombinedCount: 0,
      c3Count: 0,
      c4Count: 0,
      c5Count: 0,
      totalCount: 0,
      previousPoints: 0,
      pointsAdded: 0,
      totalPoints: 0,
      thresholdLimit: 35,
      thresholdPercent: 0,
      isTerminated: false,
      isNearTermination: false,
    };
  }

  const staffLogs = (infractions || []).filter(inf => inf && inf.staffEmail?.toLowerCase() === staffEmail.toLowerCase());
  const staffInformal = (informalSanctions || []).filter(s => s && s.staffEmail?.toLowerCase() === staffEmail.toLowerCase());

  let c1 = staffLogs.filter(inf => inf.type === 'C1 Warning' || (inf.type?.startsWith('C1') && !inf.type?.includes('C2'))).length;
  let c2 = staffLogs.filter(inf => inf.type === 'C2 Warning' || (inf.type?.startsWith('C2') && !inf.type?.includes('C1'))).length;
  let genericWarn = staffLogs.filter(inf => !inf.type?.includes('C1') && !inf.type?.includes('C2') && inf.type?.toLowerCase().includes('warning')).length;
  let c3 = staffLogs.filter(inf => inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal')).length + staffInformal.length;
  let c4 = staffLogs.filter(inf => inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')).length;
  let c5 = staffLogs.filter(inf => inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension')).length;

  const previousPoints = (c1 * 1) + (c2 * 2) + (genericWarn * 1) + (c3 * 3) + (c4 * 4) + (c5 * 5);

  let pointsAdded = 0;
  if (additionalNewType) {
    const t = additionalNewType;
    if (t.startsWith('C5') || t.toLowerCase().includes('suspension')) {
      c5 += 1;
      pointsAdded = 5;
    } else if (t.startsWith('C4') || t.toLowerCase().includes('detention')) {
      c4 += 1;
      pointsAdded = 4;
    } else if (t.startsWith('C3') || t.toLowerCase().includes('informal')) {
      c3 += 1;
      pointsAdded = 3;
    } else if (t.startsWith('C2')) {
      c2 += 1;
      pointsAdded = 2;
    } else {
      c1 += 1;
      pointsAdded = 1;
    }
  }

  const c1c2CombinedCount = c1 + c2 + genericWarn;
  const totalCount = c1c2CombinedCount + c3 + c4 + c5;
  const totalPoints = (c1 * 1) + (c2 * 2) + (genericWarn * 1) + (c3 * 3) + (c4 * 4) + (c5 * 5);
  const thresholdLimit = 35;
  const thresholdPercent = Math.min(100, Math.max(2, Math.round((totalPoints / thresholdLimit) * 100)));
  const isTerminated = totalPoints >= thresholdLimit;
  const isNearTermination = totalPoints >= 28 && totalPoints < thresholdLimit;

  return {
    c1Count: c1,
    c2Count: c2,
    genericWarningCount: genericWarn,
    c1c2CombinedCount,
    c3Count: c3,
    c4Count: c4,
    c5Count: c5,
    totalCount,
    previousPoints,
    pointsAdded,
    totalPoints,
    thresholdLimit,
    thresholdPercent,
    isTerminated,
    isNearTermination,
  };
}

export default function ConsequenceLoggedModal({
  isOpen,
  onClose,
  targetUser,
  targetEmail,
  loggedConsequence,
  stats,
  onViewAll
}) {
  if (!isOpen) return null;

  const displayName = targetUser 
    ? `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.robloxUsername || targetEmail
    : targetEmail;

  const robloxHandle = targetUser?.robloxUsername ? `@${targetUser.robloxUsername}` : '';
  const roleDisplay = targetUser?.customRole || targetUser?.siteRole || 'Staff Member';

  const type = loggedConsequence?.type || 'Consequence';
  const isC5 = type.startsWith('C5') || type.toLowerCase().includes('suspension');
  const isC4 = type.startsWith('C4') || type.toLowerCase().includes('detention');
  const isC3 = type.startsWith('C3') || type.toLowerCase().includes('informal');
  const isC2 = type.startsWith('C2');

  const tierColor = isC5 ? '#ef4444' : isC4 ? '#f59e0b' : isC3 ? '#eab308' : isC2 ? '#3b82f6' : '#60a5fa';
  const tierBg = isC5 ? 'rgba(239, 68, 68, 0.15)' : isC4 ? 'rgba(245, 158, 11, 0.15)' : isC3 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)';
  const tierBorder = isC5 ? 'rgba(239, 68, 68, 0.4)' : isC4 ? 'rgba(245, 158, 11, 0.4)' : isC3 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(59, 130, 246, 0.4)';

  const pointsBadgeColor = isC5 ? '#ef4444' : isC4 ? '#f59e0b' : isC3 ? '#eab308' : '#60a5fa';

  const totalPoints = stats?.totalPoints ?? 0;
  const previousPoints = stats?.previousPoints ?? 0;
  const pointsAdded = stats?.pointsAdded ?? 0;
  const thresholdLimit = stats?.thresholdLimit ?? 35;
  const thresholdPercent = stats?.thresholdPercent ?? Math.min(100, Math.round((totalPoints / thresholdLimit) * 100));
  const isTerminated = stats?.isTerminated ?? (totalPoints >= thresholdLimit);
  const isNearTermination = stats?.isNearTermination ?? (totalPoints >= 28 && totalPoints < thresholdLimit);
  const remainingPoints = Math.max(0, thresholdLimit - totalPoints);

  const meterColor = isTerminated ? '#ef4444' : isNearTermination ? '#f59e0b' : totalPoints >= 15 ? '#38bdf8' : '#10b981';

  return (
    <div style={modalStyles.overlay}>
      <div className="glass-panel" style={modalStyles.container}>
        
        {/* Top Header */}
        <div style={modalStyles.headerRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={modalStyles.checkIconWrapper}>
              <CheckCircle2 size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={modalStyles.modalTitle}>Consequence Successfully Logged</h3>
                <span style={modalStyles.badgeSuccess}>Staff Record Updated</span>
              </div>
              <p style={modalStyles.modalSub}>
                The consequence has been recorded in the staff database with updated consequence points.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={modalStyles.closeBtn}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Staff Member Info Card */}
        <div style={modalStyles.staffProfileCard}>
          <div style={modalStyles.avatarCircle}>
            {targetUser?.avatarUrl ? (
              <img 
                src={targetUser.avatarUrl} 
                alt={displayName} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={24} color="#94a3b8" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={modalStyles.staffNameText}>{displayName}</span>
              {robloxHandle && <span style={modalStyles.robloxHandleText}>{robloxHandle}</span>}
              <span style={modalStyles.roleBadge}>{roleDisplay}</span>
            </div>
            <div style={modalStyles.emailText}>{targetEmail}</div>
          </div>

          <div style={modalStyles.changePill}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score Change</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem', textDecoration: 'line-through' }}>{previousPoints}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>&rarr;</span>
              <strong style={{ color: meterColor, fontSize: '1.15rem' }}>{totalPoints} pts</strong>
              <span style={{ color: pointsBadgeColor, fontSize: '0.8rem', fontWeight: 'bold' }}>
                (+{pointsAdded})
              </span>
            </div>
          </div>
        </div>

        {/* Sanction Just Issued Box */}
        <div style={{ ...modalStyles.sanctionJustIssuedCard, borderColor: tierBorder, background: tierBg }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color={tierColor} />
              <strong style={{ color: tierColor, fontSize: '0.95rem' }}>{type}</strong>
            </div>
            <span style={{
              background: 'rgba(0,0,0,0.3)',
              color: pointsBadgeColor,
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: '700',
              border: `1px solid ${tierBorder}`
            }}>
              +{pointsAdded} Consequence Points
            </span>
          </div>

          {loggedConsequence?.detentionLocation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.85rem', color: '#fcd34d' }}>
              <Clock size={14} />
              <span><strong>Detention Location:</strong> {loggedConsequence.detentionLocation} &bull; {loggedConsequence.detentionTime || '14:55'} &bull; {loggedConsequence.detentionDate || 'Scheduled'}</span>
            </div>
          )}

          {loggedConsequence?.mainMessage && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.4' }}>
              <strong>Details:</strong> {loggedConsequence.mainMessage}
            </p>
          )}
        </div>

        {/* NEW TOTAL CONSEQUENCE COUNT - HERO CARD */}
        <div style={modalStyles.scoreHeroCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="#f87171" />
                <span style={modalStyles.scoreHeroLabel}>New Total Consequence Count</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '3.2rem', fontWeight: '900', color: meterColor, lineHeight: 1 }}>
                  {totalPoints}
                </span>
                <span style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: '600' }}>
                  / {thresholdLimit} Consequence Points
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: isTerminated ? 'rgba(239, 68, 68, 0.25)' : isNearTermination ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${isTerminated ? '#ef4444' : isNearTermination ? '#f59e0b' : 'rgba(16, 185, 129, 0.4)'}`,
                color: isTerminated ? '#ef4444' : isNearTermination ? '#f59e0b' : '#34d399',
                fontWeight: '800',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {isTerminated ? (
                  <>
                    <AlertOctagon size={16} />
                    <span>Termination Threshold Reached</span>
                  </>
                ) : isNearTermination ? (
                  <>
                    <AlertTriangle size={16} />
                    <span>Near Termination Limit</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Active Standing</span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
                {thresholdPercent}% towards staff termination
              </div>
            </div>
          </div>

          {/* Progress Bar Meter */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
              <span>Progress to 35 Limit</span>
              <span style={{ fontWeight: '700', color: meterColor }}>
                {totalPoints} / {thresholdLimit} Points ({thresholdPercent}%)
              </span>
            </div>
            <div style={modalStyles.progressTrack}>
              <div style={{
                width: `${thresholdPercent}%`,
                height: '100%',
                background: meterColor,
                borderRadius: '999px',
                transition: 'width 0.5s ease',
                boxShadow: `0 0 12px ${meterColor}66`
              }} />
            </div>
          </div>

          {/* Policy Banner inside modal */}
          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            borderRadius: '10px',
            background: isTerminated ? 'rgba(239, 68, 68, 0.18)' : isNearTermination ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${isTerminated ? 'rgba(239, 68, 68, 0.5)' : isNearTermination ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.25)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertTriangle size={20} color={isTerminated ? '#ef4444' : isNearTermination ? '#f59e0b' : '#f87171'} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.85rem' }}>
              <strong style={{ color: isTerminated ? '#ef4444' : isNearTermination ? '#f59e0b' : '#f87171' }}>
                Official Policy: 35 consequences will result in a termination from the staff team.
              </strong>
              <div style={{ color: '#cbd5e1', marginTop: '2px', fontSize: '0.8rem' }}>
                {isTerminated ? (
                  <span style={{ color: '#fca5a5', fontWeight: 'bold' }}>
                    Critical: This staff member now has {totalPoints} consequence points and qualifies for immediate dismissal from the staff team.
                  </span>
                ) : isNearTermination ? (
                  <span style={{ color: '#fde68a' }}>
                    Warning: Staff member is only {remainingPoints} consequence point(s) away from the 35 limit.
                  </span>
                ) : (
                  <span>
                    Staff member has {remainingPoints} consequence points remaining before reaching the 35 termination threshold.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* INDIVIDUAL CONSEQUENCES BREAKDOWN GRID */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Updated Individual Consequences Breakdown
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Total logs: {stats?.totalCount ?? 0}
            </span>
          </div>

          <div style={modalStyles.breakdownGrid}>
            {/* C1 - C2 Warnings */}
            <div style={{ ...modalStyles.breakdownCard, borderColor: 'rgba(59, 130, 246, 0.35)' }}>
              <div style={modalStyles.breakdownCardHeader}>
                <span style={{ color: '#93c5fd', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>C1 - C2 Warnings</span>
                <span style={modalStyles.pillBlue}>1 - 2 pts</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#60a5fa', margin: '4px 0' }}>
                {stats?.c1c2CombinedCount ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                C1: {stats?.c1Count ?? 0} &bull; C2: {stats?.c2Count ?? 0}
              </div>
            </div>

            {/* C3 Informal */}
            <div style={{ ...modalStyles.breakdownCard, borderColor: 'rgba(234, 179, 8, 0.35)' }}>
              <div style={modalStyles.breakdownCardHeader}>
                <span style={{ color: '#fde047', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>C3 Informal</span>
                <span style={modalStyles.pillYellow}>3 pts each</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#eab308', margin: '4px 0' }}>
                {stats?.c3Count ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Informal sanctions ({(stats?.c3Count ?? 0) * 3} pts)
              </div>
            </div>

            {/* C4 Detentions */}
            <div style={{ ...modalStyles.breakdownCard, borderColor: 'rgba(245, 158, 11, 0.35)' }}>
              <div style={modalStyles.breakdownCardHeader}>
                <span style={{ color: '#fcd34d', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>C4 Detentions</span>
                <span style={modalStyles.pillAmber}>4 pts each</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f59e0b', margin: '4px 0' }}>
                {stats?.c4Count ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {(stats?.c4Count ?? 0) * 4} consequence points
              </div>
            </div>

            {/* C5 Suspensions */}
            <div style={{ ...modalStyles.breakdownCard, borderColor: 'rgba(239, 68, 68, 0.35)' }}>
              <div style={modalStyles.breakdownCardHeader}>
                <span style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>C5 Suspensions</span>
                <span style={modalStyles.pillRed}>5 pts each</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', margin: '4px 0' }}>
                {stats?.c5Count ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                2-Day Lockouts ({(stats?.c5Count ?? 0) * 5} pts)
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={modalStyles.footerRow}>
          {onViewAll && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewAll();
              }}
              className="btn-secondary"
              style={modalStyles.viewAllBtn}
            >
              <span>View All Staff Consequences</span>
              <ArrowUpRight size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-primary"
            style={modalStyles.confirmBtn}
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  container: {
    width: '100%',
    maxWidth: '680px',
    maxHeight: '92vh',
    overflowY: 'auto',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96))',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '18px',
    padding: '26px',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(37, 99, 235, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    animation: 'fadeIn 0.2s ease-out'
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
  },
  checkIconWrapper: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.2px',
  },
  badgeSuccess: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  modalSub: {
    margin: '4px 0 0 0',
    fontSize: '0.84rem',
    color: '#94a3b8',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffProfileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '12px',
    padding: '12px 16px',
    flexWrap: 'wrap',
  },
  avatarCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    flexShrink: 0,
  },
  staffNameText: {
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  robloxHandleText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  roleBadge: {
    background: 'rgba(59, 130, 246, 0.18)',
    color: '#93c5fd',
    fontSize: '0.72rem',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },
  emailText: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '2px',
  },
  changePill: {
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '8px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: 'auto',
  },
  sanctionJustIssuedCard: {
    borderRadius: '12px',
    border: '1px solid',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  scoreHeroCard: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.8))',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
  },
  scoreHeroLabel: {
    fontSize: '0.82rem',
    fontWeight: '800',
    color: '#f87171',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  progressTrack: {
    width: '100%',
    height: '10px',
    background: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
  },
  breakdownCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  breakdownCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillBlue: {
    fontSize: '0.68rem',
    fontWeight: '700',
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  pillYellow: {
    fontSize: '0.68rem',
    fontWeight: '700',
    background: 'rgba(234, 179, 8, 0.2)',
    color: '#fde047',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  pillAmber: {
    fontSize: '0.68rem',
    fontWeight: '700',
    background: 'rgba(245, 158, 11, 0.2)',
    color: '#fcd34d',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  pillRed: {
    fontSize: '0.68rem',
    fontWeight: '700',
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    paddingTop: '16px',
    flexWrap: 'wrap',
  },
  viewAllBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '700',
    cursor: 'pointer',
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
  }
};
