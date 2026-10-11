import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Send, Clock, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export default function LeaveOfAbsence() {
  const { loaRequests, submitLoaRequest, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('request');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    submitLoaRequest({
      startDate,
      endDate,
      reason
    });

    setStartDate('');
    setEndDate('');
    setReason('');
    setSuccessMsg('Leave of Absence request submitted successfully!');
    setActiveTab('my-requests');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={16} color="#10b981" />;
      case 'Denied':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <Clock size={16} color="#f59e0b" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'badge-approved';
      case 'Denied':
        return 'badge-denied';
      default:
        return 'badge-pending';
    }
  };

  const myRequests = loaRequests.filter(req => req.userEmail === currentUser.email);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabHeader}>
        <button
          onClick={() => setActiveTab('request')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'request' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            borderColor: activeTab === 'request' ? '#2563eb' : 'transparent',
            color: activeTab === 'request' ? 'var(--color-text-main)' : '#9ca3af',
          }}
        >
          <Calendar size={16} />
          Submit LOA Request
        </button>
        <button
          onClick={() => setActiveTab('my-requests')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'my-requests' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            borderColor: activeTab === 'my-requests' ? '#2563eb' : 'transparent',
            color: activeTab === 'my-requests' ? 'var(--color-text-main)' : '#9ca3af',
          }}
        >
          <Clock size={16} />
          My Requests ({myRequests.length})
        </button>
      </div>

      {successMsg && (
        <div style={styles.successAlert}>
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'request' ? (
        <form onSubmit={handleSubmit} style={styles.form} className="glass-panel">
          <h3 style={styles.sectionTitle}>Request Leave of Absence (LOA)</h3>
          <p style={styles.subtitle}>
            If you are going to be inactive or cannot attend scheduled flights, please submit your dates.
          </p>

          <div style={styles.row}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>End Date (Inclusive) *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Detailed Reason *</label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain in detail why you are requesting leave (e.g. exams, vacation, illness)..."
              className="input-field"
              style={styles.textarea}
              rows={4}
            />
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn}>
            <Send size={16} />
            <span>Submit LOA Application</span>
          </button>
        </form>
      ) : (
        <div style={styles.historyContainer}>
          {myRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <Calendar size={48} color="rgba(255,255,255,0.15)" />
              <p style={styles.emptyText}>You have not submitted any LOA requests.</p>
            </div>
          ) : (
            <div style={styles.requestsList}>
              {myRequests.map((req) => (
                <div key={req.id} style={styles.requestCard} className="glass-panel">
                  <div style={styles.cardHeader}>
                    <div style={styles.dateRange}>
                      <span style={styles.dateBadge}>{formatDate(req.startDate)}</span>
                      <span style={styles.connector}>to</span>
                      <span style={styles.dateBadge}>{formatDate(req.endDate)}</span>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(req.status)}`} style={styles.statusBadge}>
                      {getStatusIcon(req.status)}
                      <span style={{ marginLeft: '4px' }}>{req.status}</span>
                    </span>
                  </div>

                  <div style={styles.reasonSection}>
                    <h4 style={styles.sectionLabel}>Reason for Leave:</h4>
                    <p style={styles.reasonText}>{req.reason}</p>
                  </div>

                  {req.adminComment && (
                    <div style={{
                      ...styles.adminCommentBox,
                      borderColor: req.status === 'Approved' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                      background: req.status === 'Approved' ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
                    }}>
                      <h4 style={{
                        ...styles.sectionLabel,
                        color: req.status === 'Approved' ? '#10b981' : '#ef4444'
                      }}>
                        Admin Comment:
                      </h4>
                      <p style={styles.commentText}>{req.adminComment}</p>
                    </div>
                  )}

                  <div style={styles.cardFooter}>
                    <span>Submitted on: {formatDate(req.timestamp)}</span>
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
    transition: 'all 0.2s ease',
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
    flexWrap: 'wrap',
  },
  inputWrapper: {
    flex: 1,
    minWidth: '240px',
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
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '0.9rem',
    color: '#a7f3d0',
  },
  historyContainer: {
    display: 'flex',
    flexDirection: 'column',
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
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  requestCard: {
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
  dateRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dateBadge: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    color: 'var(--color-text-main)',
    fontWeight: '600',
  },
  connector: {
    color: '#9ca3af',
    fontSize: '0.85rem',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  reasonSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sectionLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  reasonText: {
    fontSize: '0.9rem',
    color: '#d1d5db',
    lineHeight: '1.45',
  },
  adminCommentBox: {
    borderLeft: '3px solid transparent',
    padding: '12px 16px',
    borderRadius: '0 8px 8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  commentText: {
    fontSize: '0.9rem',
    color: '#e5e7eb',
    fontStyle: 'italic',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '0.75rem',
    color: '#9ca3af',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '12px',
  },
};
