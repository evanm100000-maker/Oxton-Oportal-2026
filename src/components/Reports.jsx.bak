import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, Send, MessageSquare, Shield, Clock, ExternalLink, RefreshCw, Upload } from 'lucide-react';
import { compressImage } from '../utils/compressImage';

export default function Reports() {
  const { reports, submitReport, addReportComment, updateReportStatus, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('active');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form state
  const [reportedPlayer, setReportedPlayer] = useState('');
  const [type, setType] = useState('Exploiting');
  const [description, setDescription] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

    setIsUploading(true);

    try {
      let finalEvidenceUrl = '';
      
      if (evidenceFile) {
        if (evidenceFile.size > 5 * 1024 * 1024) {
          alert('File is too large. Please upload a file smaller than 5MB.');
          setIsUploading(false);
          return;
        }
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(evidenceFile);
        });

        finalEvidenceUrl = await compressImage(dataUrl, 800, 0.6);
      }

      submitReport({
        reportedPlayer,
        type,
        description,
        evidenceLink: finalEvidenceUrl
      });

      setReportedPlayer('');
      setType('Exploiting');
      setDescription('');
      setEvidenceFile(null);
      setSuccessMsg('Player report submitted successfully. Admin review is pending.');
      setActiveTab('active');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error uploading evidence:', err);
      alert('Failed to upload evidence. Please try again.');
    } finally {
      setIsUploading(false);
    }
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

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabHeader}>
        <button
          onClick={() => setActiveTab('active')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'active' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            borderColor: activeTab === 'active' ? '#2563eb' : 'transparent',
            color: activeTab === 'active' ? 'var(--color-text-main)' : '#9ca3af',
          }}
        >
          <AlertTriangle size={16} />
          Active Incident Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('submit')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'submit' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            borderColor: activeTab === 'submit' ? '#2563eb' : 'transparent',
            color: activeTab === 'submit' ? 'var(--color-text-main)' : '#9ca3af',
          }}
        >
          <Send size={16} />
          Log Player Report
        </button>
      </div>

      {successMsg && (
        <div style={styles.successAlert}>
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'submit' ? (
        <form onSubmit={handleSubmit} style={styles.form} className="glass-panel">
          <h3 style={styles.sectionTitle}>File Player Infraction Report</h3>
          <p style={styles.subtitle}>
            Report players exploiting, violating rules, or causing disruption in Oxton servers.
          </p>

          <div style={styles.row}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Offender Roblox Username *</label>
              <input
                type="text"
                required
                value={reportedPlayer}
                onChange={(e) => setReportedPlayer(e.target.value)}
                placeholder="e.g. HackerGuy123"
                className="input-field"
              />
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Violation Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-field"
              >
                <option value="Exploiting">Exploiting / Cheating</option>
                <option value="Toxicity">Toxicity / Harassment</option>
                <option value="Glitching">Glitching / Bug Abuse</option>
                <option value="FRP">Fail Roleplay</option>
                <option value="LTA">Leaving to Avoid</option>
              </select>
            </div>
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Evidence File (Image/Video)</label>
            <label style={{ ...styles.inputInner, cursor: 'pointer', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '8px', border: '1px solid var(--color-border)' }}>
              <Upload size={16} />
              <span>{evidenceFile ? evidenceFile.name : 'Choose File'}</span>
              <input 
                type="file" 
                accept="image/*,video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setEvidenceFile(e.target.files[0]);
                  }
                }} 
                style={{ display: 'none' }} 
              />
            </label>
            {evidenceFile && (
              <button type="button" onClick={() => setEvidenceFile(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', marginTop: '4px', textAlign: 'left' }}>
                Remove file
              </button>
            )}
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Incident Details & Explanation *</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, what warning was issued, and the player response..."
              className="input-field"
              style={styles.textarea}
              rows={4}
            />
          </div>

          <button type="submit" disabled={isUploading} className="btn-primary" style={{ ...styles.submitBtn, opacity: isUploading ? 0.7 : 1 }}>
            <Send size={16} />
            <span>{isUploading ? 'Uploading & Filing...' : 'File Incident Report'}</span>
          </button>
        </form>
      ) : (
        <div style={styles.reportsContainer}>
          {reports.length === 0 ? (
            <div style={styles.emptyState}>
              <AlertTriangle size={48} color="rgba(255,255,255,0.15)" />
              <p style={styles.emptyText}>No reports have been submitted yet.</p>
            </div>
          ) : (
            <div style={styles.reportsList}>
              {reports.map((report) => {
                const isExpanded = expandedReports[report.id];
                return (
                  <div key={report.id} style={styles.reportCard} className="glass-panel">
                    <div style={styles.cardHeader}>
                      <div style={styles.headerInfo}>
                        <h4 style={styles.targetPlayer}>Player: {report.reportedPlayer}</h4>
                        <span style={styles.violationType}>{report.type}</span>
                      </div>
                      <div style={styles.headerRight}>
                        {getStatusBadge(report.status)}
                        <span style={styles.reportTime}>{formatDate(report.timestamp)}</span>
                      </div>
                    </div>

                    <div style={styles.reportContent}>
                      <p style={styles.descriptionText}>{report.description}</p>
                      
                      {report.evidenceLink && (
                        <a
                          href={report.evidenceLink}
                          rel="noreferrer"
                          style={styles.evidenceBtn}
                          className="btn-secondary"
                        >
                          <ExternalLink size={12} />
                          <span>View Evidence Link</span>
                        </a>
                      )}
                    </div>

                    <div style={styles.reportFooter}>
                      <span style={styles.reporterInfo}>
                        Reporter: <strong>{report.reporterName}</strong>
                      </span>

                      <div style={styles.footerActions}>
                        {currentUser.isAdmin && (
                          <div style={styles.adminActionDropdown}>
                            <Shield size={12} color="#06b6d4" />
                            <select
                              value={report.status}
                              onChange={(e) => updateReportStatus(report.id, e.target.value)}
                              style={styles.statusSelect}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Actioned">Actioned</option>
                              <option value="Dismissed">Dismissed</option>
                            </select>
                          </div>
                        )}

                        <button
                          onClick={() => toggleExpand(report.id)}
                          className="btn-secondary"
                          style={styles.discussBtn}
                        >
                          <MessageSquare size={14} />
                          <span>Discussion ({report.comments?.length || 0})</span>
                        </button>
                      </div>
                    </div>

                    {/* Expandable comments thread */}
                    {isExpanded && (
                      <div style={styles.discussionThread}>
                        <h5 style={styles.threadTitle}>Case Discussion & Admin Inquiry</h5>
                        
                        <div style={styles.commentsList}>
                          {!report.comments || report.comments.length === 0 ? (
                            <p style={styles.emptyThreadText}>No messages logged. Admin replies or inquiries will appear here.</p>
                          ) : (
                            report.comments.map(c => (
                              <div
                                key={c.id}
                                style={{
                                  ...styles.commentBubble,
                                  alignSelf: c.isAdmin ? 'flex-start' : 'flex-end',
                                  background: c.isAdmin ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                  borderColor: c.isAdmin ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div style={styles.commentHeader}>
                                  <span style={styles.commentAuthor}>
                                    {c.authorName}
                                    {c.isAdmin && <span className="badge badge-admin" style={styles.miniAdminBadge}>Admin</span>}
                                  </span>
                                  <span style={styles.commentTime}>{formatDate(c.timestamp)}</span>
                                </div>
                                <p style={styles.commentText}>{c.text}</p>
                              </div>
                            ))
                          )}
                          <div ref={commentsEndRef} />
                        </div>

                        <form onSubmit={(e) => handleAddComment(report.id, e)} style={styles.commentForm}>
                          <input
                            type="text"
                            value={commentText[report.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [report.id]: e.target.value }))}
                            placeholder={currentUser.isAdmin ? "Reply to report or request more information..." : "Reply to admin inquiry..."}
                            className="input-field"
                            style={styles.commentInput}
                          />
                          <button type="submit" className="btn-primary" style={styles.commentSendBtn}>
                            <Send size={14} />
                          </button>
                        </form>
                      </div>
                    )}
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
  reportsContainer: {
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
  reportsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  reportCard: {
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  targetPlayer: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  },
  violationType: {
    fontSize: '0.75rem',
    color: '#f59e0b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '6px',
  },
  reportTime: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },
  reportContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  descriptionText: {
    fontSize: '0.9rem',
    color: '#e5e7eb',
    lineHeight: '1.45',
  },
  evidenceBtn: {
    alignSelf: 'flex-start',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textDecoration: 'none',
  },
  reportFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.03)',
    paddingTop: '12px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  reporterInfo: {
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  footerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  adminActionDropdown: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  statusSelect: {
    background: 'transparent',
    border: 'none',
    color: '#06b6d4',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none',
  },
  discussBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  discussionThread: {
    borderTop: '1px dashed rgba(255,255,255,0.08)',
    paddingTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  threadTitle: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-text-main)',
  },
  commentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '200px',
    overflowY: 'auto',
    paddingRight: '6px',
  },
  emptyThreadText: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  commentBubble: {
    width: 'fit-content',
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  commentAuthor: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--color-text-main)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  miniAdminBadge: {
    fontSize: '0.6rem',
    padding: '1px 6px',
  },
  commentTime: {
    fontSize: '0.65rem',
    color: '#9ca3af',
  },
  commentText: {
    fontSize: '0.85rem',
    color: '#d1d5db',
    lineHeight: '1.4',
  },
  commentForm: {
    display: 'flex',
    gap: '8px',
    marginTop: '6px',
  },
  commentInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '0.8rem',
  },
  commentSendBtn: {
    padding: '0 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
