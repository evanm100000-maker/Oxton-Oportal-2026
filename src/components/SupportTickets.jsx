import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LifeBuoy, Plus, MessageSquare, ShieldAlert, CheckCircle, Send } from 'lucide-react';

export default function SupportTickets() {
  const { currentUser, tickets, createTicket, updateTicketStatus, addTicketComment } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expandedTicket, setExpandedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const commentsEndRef = useRef(null);

  useEffect(() => {
    const scrollToBottom = () => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };
    scrollToBottom();
    setTimeout(scrollToBottom, 100);
  }, [expandedTicket, tickets]);

  const myTickets = tickets.filter(t => t.authorEmail === currentUser.email);
  const ticketsToDisplay = (currentUser.isAdmin || currentUser.siteRole === 'Moderator') ? tickets : myTickets;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) return;
    createTicket({ title, description });
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  const handleReply = (e, ticketId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    addTicketComment(ticketId, replyText);
    setReplyText('');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '#3b82f6';
      case 'Escalated': return '#f59e0b';
      case 'Closed': return '#10b981';
      default: return '#9ca3af';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h3 style={styles.title}>Support Tickets</h3>
          <p style={styles.subtitle}>{(currentUser.isAdmin || currentUser.siteRole === 'Moderator') ? 'Manage staff support requests and inquiries.' : 'Open a ticket for private support from admins.'}</p>
        </div>
        {(!currentUser.isAdmin && currentUser.siteRole !== 'Moderator') && (
          <button style={styles.newButton} onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> {showForm ? 'Cancel' : 'New Ticket'}
          </button>
        )}
      </div>

      {(!currentUser.isAdmin && currentUser.siteRole !== 'Moderator') && (
        <div style={{...styles.sectionNotice, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#93c5fd', fontSize: '0.9rem', marginBottom: '16px'}}>
          <ShieldAlert size={18} />
          <span><strong>Privacy Notice:</strong> Tickets you create here are strictly confidential. Only you and Administrators can view your tickets. No other staff member can see this.</span>
        </div>
      )}

      {showForm && (!currentUser.isAdmin && currentUser.siteRole !== 'Moderator') && (
        <form onSubmit={handleSubmit} className="glass-panel" style={styles.form}>
          <h4 style={styles.formTitle}>Create Support Ticket</h4>
          <div style={styles.formGroup}>
            <label style={styles.label}>Issue Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} placeholder="Brief summary of your issue..." />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} style={{...styles.input, minHeight: '100px'}} placeholder="Provide as much detail as possible..."></textarea>
          </div>
          <button type="submit" style={styles.submitBtn}>Submit Ticket</button>
        </form>
      )}

      <div style={styles.ticketList}>
        {ticketsToDisplay.length === 0 ? (
          <div className="glass-panel" style={styles.emptyState}>
            <LifeBuoy size={48} color="rgba(255,255,255,0.2)" />
            <p>No support tickets found.</p>
          </div>
        ) : (
          [...ticketsToDisplay].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(ticket => {
            const isExpanded = expandedTicket === ticket.id;
            const statusColor = getStatusColor(ticket.status);

            return (
              <div key={ticket.id} className="glass-panel" style={{...styles.ticketCard, ...(isExpanded ? styles.ticketCardExpanded : {})}}>
                <div style={styles.ticketHeader} onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}>
                  <div style={styles.ticketTitleRow}>
                    <h4 style={styles.ticketTitle}>{ticket.title}</h4>
                    <span style={{...styles.statusBadge, borderColor: statusColor, color: statusColor}}>
                      {ticket.status}
                    </span>
                  </div>
                  <div style={styles.ticketMeta}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Opened by {ticket.authorName}
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        background: ticket.authorType === 'Passenger' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: ticket.authorType === 'Passenger' ? '#34d399' : '#60a5fa',
                        textTransform: 'uppercase'
                      }}>
                        {ticket.authorType || 'Staff'}
                      </span>
                    </span>
                    <span> • {new Date(ticket.timestamp).toLocaleString()}</span>
                    <span> • {ticket.comments?.length || 0} replies</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.ticketBody}>
                    <div style={styles.ticketDescription}>
                      <strong>Description:</strong>
                      <p style={{whiteSpace: 'pre-wrap', marginTop: '8px'}}>{ticket.description}</p>
                    </div>

                    <div style={styles.commentsSection}>
                      <h5 style={styles.commentsTitle}>Replies</h5>
                      {(ticket.comments || []).length === 0 ? (
                        <p style={styles.noComments}>No replies yet.</p>
                      ) : (
                        <div style={styles.commentsList}>
                          {(ticket.comments || []).map(comment => (
                            <div key={comment.id} style={{...styles.comment, ...(comment.isAdmin ? styles.adminComment : {})}}>
                              <div style={styles.commentHeader}>
                                <strong style={{color: comment.isAdmin ? '#f87171' : '#60a5fa'}}>
                                  {comment.authorName} {comment.isAdmin && '(Admin)'}
                                </strong>
                                <span>{new Date(comment.timestamp).toLocaleString()}</span>
                              </div>
                              <p style={styles.commentText}>{comment.text}</p>
                            </div>
                          ))}
                          <div ref={commentsEndRef} />
                        </div>
                      )}

                      {ticket.status !== 'Closed' && (
                        <form onSubmit={(e) => handleReply(e, ticket.id)} style={styles.replyForm}>
                          <input 
                            type="text" 
                            value={replyText} 
                            onChange={(e) => setReplyText(e.target.value)} 
                            placeholder="Type your reply..." 
                            style={styles.replyInput} 
                          />
                          <button type="submit" style={styles.replyBtn}><Send size={16} /></button>
                        </form>
                      )}
                    </div>

                    {(currentUser.isAdmin || currentUser.siteRole === 'Moderator') && (
                      <div style={styles.adminActions}>
                        <strong style={styles.actionLabel}>Admin Actions:</strong>
                        <div style={styles.actionButtons}>
                          {ticket.status !== 'Open' && (
                            <button onClick={() => updateTicketStatus(ticket.id, 'Open')} style={{...styles.actionBtn, color: '#3b82f6', borderColor: '#3b82f6'}}>Mark Open</button>
                          )}
                          {ticket.status !== 'Escalated' && (
                            <button onClick={() => updateTicketStatus(ticket.id, 'Escalated')} style={{...styles.actionBtn, color: '#f59e0b', borderColor: '#f59e0b'}}>Escalate</button>
                          )}
                          {ticket.status !== 'Closed' && (
                            <button onClick={() => updateTicketStatus(ticket.id, 'Closed')} style={{...styles.actionBtn, color: '#10b981', borderColor: '#10b981'}}>Close Ticket</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)' },
  subtitle: { color: 'var(--color-text-muted)' },
  newButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' },
  formTitle: { fontSize: '1.2rem', fontWeight: '600', color: '#fff', marginBottom: '8px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '0.9rem', color: '#d1d5db', fontWeight: '500' },
  input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '0.95rem', outline: 'none' },
  submitBtn: { padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  ticketList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  emptyState: { padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  ticketCard: { display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s' },
  ticketCardExpanded: { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)' },
  ticketHeader: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  ticketTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ticketTitle: { fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#fff' },
  statusBadge: { padding: '4px 10px', borderRadius: '20px', border: '1px solid', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' },
  ticketMeta: { color: '#9ca3af', fontSize: '0.85rem' },
  ticketBody: { padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'default' },
  ticketDescription: { padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '0.95rem', color: '#d1d5db' },
  commentsSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  commentsTitle: { fontSize: '1rem', fontWeight: '600', color: '#fff', margin: 0 },
  noComments: { color: '#9ca3af', fontSize: '0.9rem', fontStyle: 'italic' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' },
  comment: { padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
  adminComment: { background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444' },
  commentHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9ca3af' },
  commentText: { fontSize: '0.95rem', color: '#fff', margin: 0, whiteSpace: 'pre-wrap' },
  replyForm: { display: 'flex', gap: '8px', marginTop: '8px' },
  replyInput: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' },
  replyBtn: { padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  adminActions: { marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '16px' },
  actionLabel: { color: '#d1d5db', fontSize: '0.9rem' },
  actionButtons: { display: 'flex', gap: '8px' },
  actionBtn: { padding: '6px 12px', background: 'transparent', border: '1px solid', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }
};
