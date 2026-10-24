import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Send, Clock, CheckCircle, XCircle, AlertCircle, History, Filter } from 'lucide-react';

export default function LeaveOfAbsence() {
  const { loaRequests = [], submitLoaRequest, requestEndLoaEarly, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'active' | 'history'
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'approved' | 'denied' | 'ended'
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (endDate < startDate) {
      setErrorMsg('End Date must be on or after Start Date.');
      return;
    }

    setErrorMsg('');
    submitLoaRequest({
      startDate,
      endDate,
      reason: reason.trim()
    });

    setStartDate('');
    setEndDate('');
    setReason('');
    setSuccessMsg('Leave of Absence request submitted successfully! Admins have been notified.');
    setActiveTab('active');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleEndEarly = (loaId) => {
    const note = window.prompt('Please enter a note explaining why you want to end your LOA early (optional):');
    if (note === null) return; // user cancelled
    requestEndLoaEarly(loaId, note);
    setSuccessMsg('Early end request submitted to administrators.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Filter requests for current logged-in user
  const userRequests = useMemo(() => {
    if (!currentUser?.email) return [];
    const myEmail = currentUser.email.toLowerCase().trim();
    return loaRequests.filter(req => req && req.userEmail && req.userEmail.toLowerCase().trim() === myEmail);
  }, [loaRequests, currentUser]);

  // Partition into Active/Pending vs History
  const activeRequests = useMemo(() => {
    return userRequests.filter(req => {
      if (req.status === 'Pending' || req.status === 'End Requested') return true;
      if (req.status === 'Approved') {
        return !req.endDate || req.endDate >= todayStr;
      }
      return false;
    });
  }, [userRequests, todayStr]);

  const historyRequests = useMemo(() => {
    return userRequests.filter(req => {
      if (req.status === 'Denied' || req.status === 'Ended Early' || req.status === 'Completed') return true;
      if (req.status === 'Approved' && req.endDate && req.endDate < todayStr) return true;
      return false;
    });
  }, [userRequests, todayStr]);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return historyRequests;
    if (historyFilter === 'approved') return historyRequests.filter(r => r.status === 'Approved' || r.status === 'Completed');
    if (historyFilter === 'denied') return historyRequests.filter(r => r.status === 'Denied');
    if (historyFilter === 'ended') return historyRequests.filter(r => r.status === 'Ended Early');
    return historyRequests;
  }, [historyRequests, historyFilter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return null;
    try {
      const s = new Date(start);
      const e = new Date(end);
      const diffTime = Math.abs(e - s);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    } catch {
      return null;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={16} color="#10b981" />;
      case 'Denied':
        return <XCircle size={16} color="#ef4444" />;
      case 'Ended Early':
        return <AlertCircle size={16} color="#f59e0b" />;
      default:
        return <Clock size={16} color="#f59e0b" />;
    }
  };

  const getStatusBadge = (status, endDate) => {
    let label = status;
    let bg = 'rgba(245, 158, 11, 0.15)';
    let color = '#f59e0b';
    let border = 'rgba(245, 158, 11, 0.3)';

    if (status === 'Approved') {
      if (endDate && endDate < todayStr) {
        label = 'Completed';
        bg = 'rgba(16, 185, 129, 0.12)';
        color = '#10b981';
        border = 'rgba(16, 185, 129, 0.3)';
      } else {
        label = 'Approved (Active)';
        bg = 'rgba(16, 185, 129, 0.18)';
        color = '#10b981';
        border = 'rgba(16, 185, 129, 0.4)';
      }
    } else if (status === 'Denied') {
      label = 'Denied';
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#ef4444';
      border = 'rgba(239, 68, 68, 0.35)';
    } else if (status === 'Ended Early') {
      label = 'Ended Early';
      bg = 'rgba(245, 158, 11, 0.15)';
      color = '#f59e0b';
      border = 'rgba(245, 158, 11, 0.3)';
    } else if (status === 'End Requested') {
      label = 'End Requested';
      bg = 'rgba(245, 158, 11, 0.2)';
      color = '#fbbf24';
      border = 'rgba(245, 158, 11, 0.4)';
    } else {
      label = 'Pending Review';
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.78rem',
        fontWeight: '700',
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`
      }}>
        {getStatusIcon(status)}
        {label}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabHeader}>
        <button
          type="button"
          onClick={() => setActiveTab('request')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'request' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
            borderColor: activeTab === 'request' ? '#2563eb' : 'transparent',
            color: activeTab === 'request' ? '#ffffff' : '#9ca3af',
            fontWeight: activeTab === 'request' ? '700' : '500'
          }}
        >
          <Calendar size={16} />
          Submit LOA Request
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'active' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
            borderColor: activeTab === 'active' ? '#2563eb' : 'transparent',
            color: activeTab === 'active' ? '#ffffff' : '#9ca3af',
            fontWeight: activeTab === 'active' ? '700' : '500'
          }}
        >
          <Clock size={16} />
          Active & Pending LOAs ({activeRequests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'history' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
            borderColor: activeTab === 'history' ? '#2563eb' : 'transparent',
            color: activeTab === 'history' ? '#ffffff' : '#9ca3af',
            fontWeight: activeTab === 'history' ? '700' : '500'
          }}
        >
          <History size={16} />
          LOA History ({historyRequests.length})
        </button>
      </div>

      {successMsg && (
        <div style={styles.successAlert}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={styles.errorAlert}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: SUBMIT LOA */}
      {activeTab === 'request' && (
        <form onSubmit={handleSubmit} style={styles.form} className="glass-panel">
          <div>
            <h3 style={styles.sectionTitle}>Request Leave of Absence (LOA)</h3>
            <p style={styles.subtitle}>
              Submit dates when you will be away or unable to attend flights. An admin will review and record their decision reason.
            </p>
          </div>

          <div style={styles.row}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Start Date <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>End Date (Inclusive) <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div style={{ fontSize: '0.82rem', color: '#60a5fa', marginTop: '-10px' }}>
              Duration: <strong>{calculateDays(startDate, endDate) || 'Calculating...'}</strong>
            </div>
          )}

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Detailed Reason <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain clearly why you are requesting leave (e.g. exams, medical, vacation, personal commitments)..."
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
      )}

      {/* TAB 2: ACTIVE & PENDING LOAS */}
      {activeTab === 'active' && (
        <div style={styles.historyContainer}>
          {activeRequests.length === 0 ? (
            <div style={styles.emptyState} className="glass-panel">
              <Calendar size={48} color="rgba(255,255,255,0.2)" />
              <p style={styles.emptyText}>You have no active or pending Leave of Absence requests.</p>
              <button 
                type="button" 
                onClick={() => setActiveTab('request')} 
                className="btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem', marginTop: '8px' }}
              >
                Submit New LOA
              </button>
            </div>
          ) : (
            <div style={styles.requestsList}>
              {activeRequests.map((req) => {
                const days = calculateDays(req.startDate, req.endDate);
                const isApprovedActive = req.status === 'Approved';

                return (
                  <div key={req.id} style={styles.requestCard} className="glass-panel">
                    <div style={styles.cardHeader}>
                      <div style={styles.dateRange}>
                        <span style={styles.dateBadge}>{formatDate(req.startDate)}</span>
                        <span style={styles.connector}>to</span>
                        <span style={styles.dateBadge}>{formatDate(req.endDate)}</span>
                        {days && <span style={styles.durationBadge}>{days}</span>}
                      </div>
                      {getStatusBadge(req.status, req.endDate)}
                    </div>

                    <div style={styles.reasonSection}>
                      <h4 style={styles.sectionLabel}>Your Reason:</h4>
                      <p style={styles.reasonText}>{req.reason}</p>
                    </div>

                    {/* Admin Decision Note */}
                    {req.adminComment ? (
                      <div style={{
                        ...styles.adminCommentBox,
                        borderColor: req.status === 'Approved' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)',
                        background: req.status === 'Approved' ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{
                            ...styles.sectionLabel,
                            color: req.status === 'Approved' ? '#10b981' : '#f59e0b'
                          }}>
                            Admin Decision Reason:
                          </h4>
                          {req.reviewedByName && (
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              Reviewed by: <strong style={{ color: '#d1d5db' }}>{req.reviewedByName}</strong>
                            </span>
                          )}
                        </div>
                        <p style={styles.commentText}>"{req.adminComment}"</p>
                      </div>
                    ) : (
                      req.status === 'Pending' && (
                        <div style={styles.pendingNotice}>
                          <Clock size={15} color="#f59e0b" />
                          <span>This request is awaiting review by staff administration.</span>
                        </div>
                      )
                    )}

                    <div style={styles.cardFooter}>
                      <span>Submitted on: {formatDate(req.timestamp)}</span>
                      {isApprovedActive && (
                        <button
                          type="button"
                          onClick={() => handleEndEarly(req.id)}
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}
                        >
                          Request to End Early
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOA HISTORY */}
      {activeTab === 'history' && (
        <div style={styles.historyContainer}>
          {/* History Filters */}
          <div style={styles.filterBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '0.85rem' }}>
              <Filter size={15} />
              <span>Filter:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                style={{
                  ...styles.filterBtn,
                  background: historyFilter === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.04)',
                  borderColor: historyFilter === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: historyFilter === 'all' ? '#ffffff' : '#9ca3af'
                }}
              >
                All Past ({historyRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('approved')}
                style={{
                  ...styles.filterBtn,
                  background: historyFilter === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                  borderColor: historyFilter === 'approved' ? '#10b981' : 'rgba(255,255,255,0.1)',
                  color: historyFilter === 'approved' ? '#a7f3d0' : '#9ca3af'
                }}
              >
                Completed ({historyRequests.filter(r => r.status === 'Approved' || r.status === 'Completed').length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('denied')}
                style={{
                  ...styles.filterBtn,
                  background: historyFilter === 'denied' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                  borderColor: historyFilter === 'denied' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                  color: historyFilter === 'denied' ? '#fca5a5' : '#9ca3af'
                }}
              >
                Denied ({historyRequests.filter(r => r.status === 'Denied').length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('ended')}
                style={{
                  ...styles.filterBtn,
                  background: historyFilter === 'ended' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                  borderColor: historyFilter === 'ended' ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                  color: historyFilter === 'ended' ? '#fde68a' : '#9ca3af'
                }}
              >
                Ended Early ({historyRequests.filter(r => r.status === 'Ended Early').length})
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div style={styles.emptyState} className="glass-panel">
              <History size={48} color="rgba(255,255,255,0.2)" />
              <p style={styles.emptyText}>No past LOA records found for this filter.</p>
            </div>
          ) : (
            <div style={styles.requestsList}>
              {filteredHistory.map((req) => {
                const days = calculateDays(req.startDate, req.endDate);
                const isDenied = req.status === 'Denied';
                const isEndedEarly = req.status === 'Ended Early';

                return (
                  <div key={req.id} style={{ ...styles.requestCard, opacity: 0.95 }} className="glass-panel">
                    <div style={styles.cardHeader}>
                      <div style={styles.dateRange}>
                        <span style={styles.dateBadge}>{formatDate(req.startDate)}</span>
                        <span style={styles.connector}>to</span>
                        <span style={styles.dateBadge}>{formatDate(req.endDate)}</span>
                        {days && <span style={styles.durationBadge}>{days}</span>}
                      </div>
                      {getStatusBadge(req.status, req.endDate)}
                    </div>

                    <div style={styles.reasonSection}>
                      <h4 style={styles.sectionLabel}>Your Stated Reason:</h4>
                      <p style={styles.reasonText}>{req.reason || 'None specified'}</p>
                    </div>

                    {/* Admin Decision Reason Box */}
                    <div style={{
                      ...styles.adminCommentBox,
                      borderColor: isDenied 
                        ? 'rgba(239,68,68,0.35)' 
                        : (isEndedEarly ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)'),
                      background: isDenied 
                        ? 'rgba(239,68,68,0.06)' 
                        : (isEndedEarly ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)'),
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{
                          ...styles.sectionLabel,
                          color: isDenied ? '#ef4444' : (isEndedEarly ? '#f59e0b' : '#10b981')
                        }}>
                          Admin Decision Reason:
                        </h4>
                        {req.reviewedByName && (
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            Decided by: <strong style={{ color: '#d1d5db' }}>{req.reviewedByName}</strong>
                          </span>
                        )}
                      </div>
                      <p style={styles.commentText}>
                        "{req.adminComment || (isDenied ? 'Denied without note' : 'Approved')}"
                      </p>
                      {req.reviewedAt && (
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
                          Decision Date: {formatDate(req.reviewedAt)}
                        </span>
                      )}
                    </div>

                    <div style={styles.cardFooter}>
                      <span>Submitted on: {formatDate(req.timestamp)}</span>
                      <span style={{ color: '#6b7280' }}>ID: {req.id}</span>
                    </div>
                  </div>
                );
              })}
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
    gap: '20px',
  },
  tabHeader: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '14px',
    flexWrap: 'wrap'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '0.88rem',
    cursor: 'pointer',
    border: '1px solid transparent',
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
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
    lineHeight: '1.45',
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
    padding: '12px 22px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '6px',
    fontWeight: '600',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '10px',
    padding: '12px 18px',
    fontSize: '0.9rem',
    color: '#a7f3d0',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '10px',
    padding: '12px 18px',
    fontSize: '0.9rem',
    color: '#fca5a5',
  },
  historyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '600',
    cursor: 'pointer',
    border: '1px solid transparent',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '50px 20px',
    borderRadius: '16px',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '0.95rem',
    margin: 0,
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  requestCard: {
    padding: '22px 24px',
    borderRadius: '16px',
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
  dateRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  dateBadge: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: 'var(--color-text-main)',
    fontWeight: '600',
  },
  durationBadge: {
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    color: '#93c5fd',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  connector: {
    color: '#9ca3af',
    fontSize: '0.85rem',
  },
  reasonSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#60a5fa',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
  },
  reasonText: {
    fontSize: '0.92rem',
    color: '#d1d5db',
    lineHeight: '1.45',
    margin: 0,
  },
  adminCommentBox: {
    borderLeft: '4px solid transparent',
    padding: '12px 16px',
    borderRadius: '0 10px 10px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  commentText: {
    fontSize: '0.92rem',
    color: '#f3f4f6',
    fontStyle: 'italic',
    margin: 0,
    lineHeight: '1.4',
  },
  pendingNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.82rem',
    color: '#fbbf24',
    padding: '8px 12px',
    borderRadius: '8px',
    background: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.78rem',
    color: '#9ca3af',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
};