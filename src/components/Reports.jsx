import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Send, MessageSquare, Shield, Clock, Plus, X } from 'lucide-react';

export default function Reports() {
  const { reports, submitReport, addReportComment, updateReportStatus, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('outgoing');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [reportedPlayer, setReportedPlayer] = useState('');
  const [type, setType] = useState('Exploiting');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [visibleToAllStaff, setVisibleToAllStaff] = useState(true);

  // Comment input state (keyed by report ID)
  const [commentText, setCommentText] = useState({});
  // Expanded comments (keyed by report ID)
  const [expandedReports, setExpandedReports] = useState({});

  const commentsEndRef = useRef(null);

  useEffect(() => {
    const scrollToBottom = () => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };
    scrollToBottom();
    setTimeout(scrollToBottom, 100);
  }, [expandedReports, reports]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportedPlayer || !description) return;

    submitReport({
      reportedPlayer,
      type,
      description,
      severity,
      evidenceLink: '',
      visibleToAllStaff
    });

    setReportedPlayer('');
    setType('Exploiting');
    setDescription('');
    setSeverity('Medium');
    setVisibleToAllStaff(true);
    setIsModalOpen(false);
    
    setSuccessMsg('Player report submitted successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddComment = (reportId, e) => {
    e.preventDefault();
    const text = commentText[reportId];
    if (!text || !text.trim()) return;

    addReportComment(reportId, text);
    setCommentText(prev => ({ ...prev, [reportId]: '' }));
  };

  const toggleExpand = (reportId) => {
    setExpandedReports(prev => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Actioned':
        return <span className="badge badge-approved">Actioned</span>;
      case 'Dismissed':
        return <span className="badge badge-denied">Dismissed</span>;
      case 'Under Review':
        return <span className="badge badge-pending" style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.15)' }}>Under Review</span>;
      default:
        return <span className="badge badge-pending">Pending</span>;
    }
  };
  
  const getSeverityBadge = (sev) => {
    switch(sev) {
      case 'Critical': return <span style={{color: '#ef4444', fontWeight: 'bold', fontSize: '0.8rem'}}>CRITICAL</span>;
      case 'High': return <span style={{color: '#f97316', fontWeight: 'bold', fontSize: '0.8rem'}}>HIGH</span>;
      case 'Medium': return <span style={{color: '#eab308', fontWeight: 'bold', fontSize: '0.8rem'}}>MEDIUM</span>;
      case 'Low': return <span style={{color: '#34d399', fontWeight: 'bold', fontSize: '0.8rem'}}>LOW</span>;
      default: return null;
    }
  };

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const safeReports = Array.isArray(reports) ? reports : [];
  
  // Sort reports (newest first)
  const sortedReports = [...safeReports].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // "Outgoing" -> Reports created by currentUser or visible to all (or admin)
  const outgoingReports = sortedReports.filter(r => {
    if (currentUser.isAdmin) return true;
    if (r.reporterEmail === currentUser.email) return true;
    return r.visibleToAllStaff;
  });
  // "My Reports" -> Reports created by currentUser
  const myReports = sortedReports.filter(r => r.reporterEmail === currentUser.email);

  const displayedReports = activeTab === 'outgoing' ? outgoingReports : myReports;

  return (
    <div style={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={styles.tabHeader}>
          <button
            onClick={() => setActiveTab('outgoing')}
            className="btn-secondary"
            style={{
              ...styles.tabBtn,
              background: activeTab === 'outgoing' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
              borderColor: activeTab === 'outgoing' ? '#2563eb' : 'transparent',
              color: activeTab === 'outgoing' ? 'var(--color-text-main)' : '#9ca3af',
            }}
          >
            <AlertTriangle size={16} />
            Outgoing ({outgoingReports.length})
          </button>
          <button
            onClick={() => setActiveTab('myReports')}
            className="btn-secondary"
            style={{
              ...styles.tabBtn,
              background: activeTab === 'myReports' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
              borderColor: activeTab === 'myReports' ? '#2563eb' : 'transparent',
              color: activeTab === 'myReports' ? 'var(--color-text-main)' : '#9ca3af',
            }}
          >
            <Shield size={16} />
            My Reports ({myReports.length})
          </button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn-primary" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '600',
            height: 'fit-content',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={18} />
          Log New Report
        </button>
      </div>

      {successMsg && (
        <div style={styles.successAlert}>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Reports Feed */}
      <div style={styles.feed}>
        {displayedReports.length === 0 ? (
          <div style={styles.emptyGrid}>
            <Shield size={48} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
            <p style={styles.emptyText}>No reports found in this section.</p>
          </div>
        ) : (
          displayedReports.map(report => (
            <div key={report.id} style={styles.reportCard} className="glass-panel hover-card">
              <div style={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={styles.avatar}>
                    {report.reporterName.charAt(0)}
                  </div>
                  <div>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                      {report.reporterName}
                      {getStatusBadge(report.status)}
                    </strong>
                    <div style={styles.cardMeta}>
                      <Clock size={12} />
                      {formatDate(report.timestamp)}
                    </div>
                  </div>
                </div>
                {currentUser.isAdmin && report.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateReportStatus(report.id, 'Under Review')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Review</button>
                    <button onClick={() => updateReportStatus(report.id, 'Actioned')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Action</button>
                    <button onClick={() => updateReportStatus(report.id, 'Dismissed')} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Dismiss</button>
                  </div>
                )}
                {currentUser.isAdmin && report.status === 'Under Review' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => updateReportStatus(report.id, 'Actioned')} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Action</button>
                    <button onClick={() => updateReportStatus(report.id, 'Dismissed')} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Dismiss</button>
                  </div>
                )}
              </div>

              <div style={styles.cardBody}>
                <div style={styles.reportDetailGrid}>
                  <div style={styles.detailBox}>
                    <span style={styles.detailLabel}>Reported Player</span>
                    <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{report.reportedPlayer}</strong>
                  </div>
                  <div style={styles.detailBox}>
                    <span style={styles.detailLabel}>Type</span>
                    <span style={{ color: '#fff' }}>{report.type}</span>
                  </div>
                  <div style={styles.detailBox}>
                    <span style={styles.detailLabel}>Severity</span>
                    {getSeverityBadge(report.severity || 'Medium')}
                  </div>
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <span style={styles.detailLabel}>Reason / Description</span>
                  <p style={{ color: '#d1d5db', lineHeight: '1.6', marginTop: '4px' }}>{report.description}</p>
                </div>
              </div>

              <div style={styles.cardFooter}>
                <button 
                  onClick={() => toggleExpand(report.id)}
                  style={{
                    background: 'transparent', border: 'none', color: '#9ca3af',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    fontSize: '0.9rem', padding: '4px 0'
                  }}
                >
                  <MessageSquare size={16} />
                  {report.comments ? report.comments.length : 0} Comments
                </button>
              </div>

              {expandedReports[report.id] && (
                <div style={styles.commentsSection}>
                  <div style={styles.commentsList}>
                    {report.comments && report.comments.map(c => (
                      <div key={c.id} style={styles.comment}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{c.authorName}</strong>
                          <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>{formatDate(c.timestamp)}</span>
                        </div>
                        <div style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{c.text}</div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                  
                  <form onSubmit={(e) => handleAddComment(report.id, e)} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText[report.id] || ''}
                      onChange={e => setCommentText({...commentText, [report.id]: e.target.value})}
                      style={styles.commentInput}
                    />
                    <button type="submit" className="btn-primary" style={{ padding: '0 16px', borderRadius: '8px' }}>Send</button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Log New Report Modal */}
      {isModalOpen && (
        <div style={styles.overlay}>
          <div className="glass-panel" style={styles.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-text-main)' }}>Log New Report</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Username *</label>
                <input
                  type="text"
                  required
                  value={reportedPlayer}
                  onChange={e => setReportedPlayer(e.target.value)}
                  className="input-field"
                  placeholder="Roblox Username"
                />
              </div>

              <div style={styles.row}>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Type *</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="input-field"
                  >
                    <option value="Exploiting">Exploiting / Hacking</option>
                    <option value="Trolling">Trolling / Disruption</option>
                    <option value="Bypassing">Bypassing Chat Filter</option>
                    <option value="Glitching">Glitching / Bug Abuse</option>
                    <option value="Staff Abuse">Staff Abuse</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Severity *</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    className="input-field"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Reason *</label>
                <textarea
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="input-field"
                  rows="4"
                  placeholder="Provide a detailed reason and context for this report..."
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <input 
                  type="checkbox" 
                  id="visibleToAllStaff"
                  checked={visibleToAllStaff} 
                  onChange={(e) => setVisibleToAllStaff(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="visibleToAllStaff" style={{ ...styles.label, cursor: 'pointer', margin: 0, textTransform: 'none' }}>
                  Visible to All Staff
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ padding: '12px 24px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>
                  Submit Report
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
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 0',
  },
  tabHeader: {
    display: 'flex',
    gap: '12px',
    background: 'rgba(0,0,0,0.2)',
    padding: '8px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1px solid transparent',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#9ca3af',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  reportCard: {
    padding: '24px',
    borderRadius: '16px',
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '16px',
    marginBottom: '16px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1.2rem',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#6b7280',
    fontSize: '0.8rem',
    marginTop: '4px',
  },
  cardBody: {
    marginBottom: '16px',
  },
  reportDetailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    background: 'rgba(0,0,0,0.2)',
    padding: '16px',
    borderRadius: '12px',
  },
  detailBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },
  commentsSection: {
    marginTop: '16px',
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  commentsList: {
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '8px',
  },
  comment: {
    background: 'rgba(255,255,255,0.03)',
    padding: '12px',
    borderRadius: '8px',
  },
  commentInput: {
    flex: 1,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    outline: 'none',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#34d399',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '500',
  },
  emptyGrid: {
    textAlign: 'center',
    padding: '60px 0',
  },
  emptyText: {
    color: '#9ca3af',
    margin: 0,
    fontSize: '1.1rem',
  },
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
  },
  modal: {
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#1e293b',
    padding: '32px',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  }
};
