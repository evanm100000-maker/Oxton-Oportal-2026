export const APPEAL_STATUSES = ['Pending', 'In Review', 'Escalated', 'Declined'];

export function normalizeAppealStatus(status) {
  if (!status) return 'Pending';
  const s = String(status).trim().toLowerCase();
  if (s === 'declined') return 'Declined';
  if (s === 'escalated' || s === 'excalated') return 'Escalated';
  if (s === 'in review' || s === 'in_review' || s === 'review') return 'In Review';
  return 'Pending';
}

export function getAppealReplies(appeal) {
  if (!appeal) return [];
  if (Array.isArray(appeal.replies) && appeal.replies.length > 0) {
    return appeal.replies.filter(Boolean);
  }
  if (appeal.replies && typeof appeal.replies === 'object') {
    const vals = Object.values(appeal.replies).filter(Boolean);
    if (vals.length > 0) return vals;
  }
  if (appeal.adminReply) {
    return [
      {
        id: 'legacy-reply',
        text: appeal.adminReply,
        authorName: appeal.adminReplyByName || appeal.adminReplyBy || 'Administrator',
        authorRole: 'Admin',
        isAdmin: true,
        timestamp: appeal.adminReplyAt || appeal.statusUpdatedAt || appeal.date,
      },
    ];
  }
  return [];
}
