import React, { useState } from 'react';
import { MessageSquare, Send, ShieldCheck, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { APPEAL_STATUSES, normalizeAppealStatus, getAppealReplies } from '../utils/appealUtils';

const APPEAL_STATUS_META = {
  Pending: {
    label: 'Pending',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: Clock,
  },
  'In Review': {
    label: 'In Review',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.16)',
    border: 'rgba(56, 189, 248, 0.4)',
    icon: MessageSquare,
  },
  Escalated: {
    label: 'Escalated',
    color: '#fb923c',
    bg: 'rgba(249, 115, 22, 0.18)',
    border: 'rgba(249, 115, 22, 0.45)',
    icon: AlertTriangle,
  },
  Declined: {
    label: 'Declined',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.4)',
    icon: XCircle,
  },
};

export function AppealStatusBadge({ status }) {
  const normalized = normalizeAppealStatus(status);
  const meta = APPEAL_STATUS_META[normalized] || APPEAL_STATUS_META.Pending;
  const Icon = meta.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 9px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: '700',
        letterSpacing: '0.02em',
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

/**
 * Isolated appeal display + admin reply & status controls.
 * Keeping replyText local avoids re-rendering parent consequence lists on keystrokes.
 */
const AppealSection = React.memo(function AppealSection({
  appeal,
  infId = null,
  staffEmail = null,
  canManage = false,
  onReply,
  onStatusChange,
  compact = false,
}) {
  const [replyText, setReplyText] = useState('');
  const [selectedReplyStatus, setSelectedReplyStatus] = useState('');
  const [feedback, setFeedback] = useState('');

  if (!appeal || !appeal.text) return null;

  const currentStatus = normalizeAppealStatus(appeal.status);
  const replies = getAppealReplies(appeal);

  const handleStatusSelect = (nextStatus) => {
    if (!onStatusChange || nextStatus === currentStatus) return;
    onStatusChange({ infId, staffEmail, status: nextStatus });
    setFeedback(`Marked as ${nextStatus}`);
    setTimeout(() => setFeedback(''), 2500);
  };

  const handleSubmitReply = (e) => {
    e.preventDefault();
    const cleaned = replyText.trim();
    if (!cleaned || !onReply) return;
    onReply({
      infId,
      staffEmail,
      replyText: cleaned,
      status: selectedReplyStatus || null,
    });
    setReplyText('');
    setSelectedReplyStatus('');
    setFeedback('Reply sent');
    setTimeout(() => setFeedback(''), 2500);
  };

  return (
    <div
      style={{
        marginTop: compact ? '8px' : '12px',
        padding: compact ? '10px 12px' : '14px 16px',
        borderRadius: '10px',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        borderLeft: '3px solid #3b82f6',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Header: Staff Appeal + Status Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Staff Appeal
          </span>
          {appeal.date && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {new Date(appeal.date).toLocaleString()}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {feedback && (
            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600' }}>{feedback}</span>
          )}
          <AppealStatusBadge status={currentStatus} />
        </div>
      </div>

      {/* Staff Appeal Message */}
      <p style={{ margin: 0, fontSize: '0.86rem', color: '#e2e8f0', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
        {appeal.text}
      </p>

      {appeal.statusUpdatedByName && appeal.statusUpdatedAt && (
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          Status marked <strong>{currentStatus}</strong> by {appeal.statusUpdatedByName} ({new Date(appeal.statusUpdatedAt).toLocaleString()})
        </div>
      )}

      {/* Admin Replies Thread */}
      {replies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={13} />
            Admin {replies.length === 1 ? 'Response' : `Responses (${replies.length})`}
          </div>
          {replies.map((rep, idx) => (
            <div
              key={rep.id || idx}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.55)',
                border: '1px solid rgba(16, 185, 129, 0.22)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#6ee7b7' }}>
                  {rep.authorName || 'Administrator'}
                  {rep.authorRole ? ` · ${rep.authorRole}` : ''}
                </span>
                {rep.timestamp && (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {new Date(rep.timestamp).toLocaleString()}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#f1f5f9', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                {rep.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Admin Controls: Mark Status + Reply */}
      {canManage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.73rem', fontWeight: '700', color: '#94a3b8', marginRight: '4px' }}>
              Appeal Status:
            </span>
            {APPEAL_STATUSES.map(statusOpt => {
              const meta = APPEAL_STATUS_META[statusOpt];
              const isActive = currentStatus === statusOpt;
              return (
                <button
                  key={statusOpt}
                  type="button"
                  onClick={() => handleStatusSelect(statusOpt)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.73rem',
                    fontWeight: '700',
                    cursor: isActive ? 'default' : 'pointer',
                    border: `1px solid ${isActive ? meta.border : 'rgba(255,255,255,0.12)'}`,
                    background: isActive ? meta.bg : 'rgba(255,255,255,0.04)',
                    color: isActive ? meta.color : '#cbd5e1',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  {statusOpt}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmitReply} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write an admin reply to this appeal..."
                className="input-field"
                style={{ flex: '1 1 220px', padding: '8px 12px', fontSize: '0.84rem' }}
              />
              <select
                value={selectedReplyStatus}
                onChange={e => setSelectedReplyStatus(e.target.value)}
                className="input-field"
                style={{ width: 'auto', minWidth: '150px', padding: '8px 10px', fontSize: '0.8rem' }}
                title="Optionally update status when sending reply"
              >
                <option value="">Keep status ({currentStatus})</option>
                {APPEAL_STATUSES.map(st => (
                  <option key={st} value={st}>Set: {st}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="btn-primary"
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: replyText.trim() ? 1 : 0.55,
                  cursor: replyText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={14} />
                Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
});

export default AppealSection;
