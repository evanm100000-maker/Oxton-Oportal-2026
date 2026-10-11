import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Users, User, Trophy, ShieldAlert, Award, FileText, Send, X, Trash2, Medal } from 'lucide-react';

export default function AllStaff() {
  const { 
    users,
    onlineUsers, 
    flightLogs, 
    currentUser, 
    staffNotes, 
    addStaffNote, 
    deleteStaffNote, 
    awardMedal,
    infractions,
    loaRequests,
    reports
  } = useApp();
  
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [manageTab, setManageTab] = useState('notes');
  const [noteType, setNoteType] = useState('Performance');
  const [noteText, setNoteText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const displayUsers = users ? users.filter(u => u?.approved && u?.role !== 'passenger') : [];

  const calculateBadge = (email) => {
    const flightsCount = flightLogs.filter(log => log.submitterEmail === email && log.status === 'Approved').length;
    if (flightsCount >= 50) return { label: 'Platinum', color: '#e5e7eb' };
    if (flightsCount >= 30) return { label: 'Gold', color: '#fbbf24' };
    if (flightsCount >= 20) return { label: 'Silver', color: '#9ca3af' };
    if (flightsCount >= 10) return { label: 'Bronze', color: '#b45309' };
    return null;
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addStaffNote(selectedStaff.email, noteType, noteText);
    setNoteText('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h3 style={styles.title}>All Staff Members</h3>
          <p style={styles.subtitle}>View online status and roles of all active staff.</p>
        </div>
        <div style={styles.statsBadge}>
          <Users size={16} />
          <span>{displayUsers.length} Total Staff</span>
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="Search staff by name or username..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="input-field" 
          style={{ width: '100%', maxWidth: '400px' }} 
        />
      </div>

      <div style={styles.grid}>
        {displayUsers.filter(user => `${user.firstName} ${user.lastName} ${user.robloxUsername}`.toLowerCase().includes(searchQuery.toLowerCase())).map(user => {
          const isOnline = user.email && onlineUsers[user.email.replace(/\./g, ',')];
          const badge = calculateBadge(user.email);
          const goldMedals = user.goldMedals || 0;
          const silverMedals = user.silverMedals || 0;
          const bronzeMedals = user.bronzeMedals || 0;
          const hasMedals = goldMedals > 0 || silverMedals > 0 || bronzeMedals > 0;
          const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now();
          const isOnLOA = loaRequests.some(loa => loa.userEmail === user.email && loa.status === 'Approved');
          
          return (
            <div key={user.email} style={styles.card} className="glass-panel interactive-card">
              <div style={styles.profileSection}>
                <div style={styles.avatarContainer}>
                  {user.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt={user.robloxUsername} 
                      style={styles.avatar} 
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      <User size={24} color="#9ca3af" />
                    </div>
                  )}
                  {isOnline && <div style={styles.onlineDot} title="Online"></div>}
                </div>
                
                <div style={styles.userInfo}>
                  <div style={styles.nameRow}>
                    <strong style={styles.name}>{user.firstName} {user.lastName}</strong>
                    {isSuspended && (
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.2)', border: '1px solid #dc2626', color: '#f87171', fontSize: '0.7rem', fontWeight: 'bold' }}>SUSPENDED</span>
                    )}
                    {isOnLOA && (
                      <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.7rem', fontWeight: 'bold' }}>LOA</span>
                    )}
                    {badge && (
                      <span style={{...styles.rankBadge, color: badge.color, borderColor: badge.color}}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  <span style={styles.username}>@{user.robloxUsername}</span>
                  {hasMedals && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {goldMedals > 0 && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}><Trophy size={12}/> {goldMedals}</span>}
                      {silverMedals > 0 && <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '2px' }}><Medal size={12}/> {silverMedals}</span>}
                      {bronzeMedals > 0 && <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '2px' }}><Award size={12}/> {bronzeMedals}</span>}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={styles.roleSection}>
                <div style={styles.roleBadges}>
                  {user.isAdmin && <span className="badge badge-admin">Admin</span>}
                  {user.customRole ? (
                    <span style={styles.customRole}>{user.customRole}</span>
                  ) : (
                    <span style={styles.defaultRole}>Staff</span>
                  )}
                </div>
                {currentUser.isAdmin && (
                  <button onClick={() => { setSelectedStaff(user); setManageTab('notes'); }} style={styles.manageBtn}>
                    Manage
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedStaff && currentUser.isAdmin && (() => {
        const currentStaff = users.find(u => u.email === selectedStaff.email) || selectedStaff;
        return (
          <div style={styles.modalOverlay}>
            <div className="glass-panel" style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Manage Staff: {currentStaff.firstName} {currentStaff.lastName}</h3>
                <button onClick={() => setSelectedStaff(null)} style={styles.closeModalBtn}><X size={20}/></button>
              </div>

            <div style={styles.modalBody}>
              <div style={{display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px'}}>
                <button onClick={() => setManageTab('notes')} style={{...styles.tabBtn, background: manageTab === 'notes' ? '#2563eb' : 'transparent', color: manageTab === 'notes' ? '#fff' : '#9ca3af'}}>Notes & SOTW</button>
                <button onClick={() => setManageTab('history')} style={{...styles.tabBtn, background: manageTab === 'history' ? '#2563eb' : 'transparent', color: manageTab === 'history' ? '#fff' : '#9ca3af'}}>Staff History</button>
                <button onClick={() => setManageTab('promotion')} style={{...styles.tabBtn, background: manageTab === 'promotion' ? '#2563eb' : 'transparent', color: manageTab === 'promotion' ? '#fff' : '#9ca3af'}}>Promotion Checker</button>
              </div>

              {manageTab === 'notes' && (
                <>
                  <div style={styles.sotwAction}>
                    <div style={styles.sotwInfo}>
                      <Trophy size={20} color="#fbbf24" />
                      <strong>Star of the Week Medals</strong>
                      <div style={{color: '#9ca3af', fontSize: '0.9rem', display: 'flex', gap: '8px', marginTop: '4px'}}>
                        <span style={{ color: '#f59e0b' }}>🥇 {currentStaff.goldMedals || 0}</span>
                        <span style={{ color: '#9ca3af' }}>🥈 {currentStaff.silverMedals || 0}</span>
                        <span style={{ color: '#b45309' }}>🥉 {currentStaff.bronzeMedals || 0}</span>
                      </div>
                    </div>
                    { (currentUser.siteRole === 'Owner' || currentUser.email === 'evanm.100000@gmail.com') && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button 
                          onClick={() => awardMedal(currentStaff.email, 'gold')} 
                          style={{...styles.awardSotwBtn, background: '#f59e0b', color: '#fff'}}
                          disabled={currentStaff.email === currentUser.email}
                        >
                          🥇 Gold
                        </button>
                        <button 
                          onClick={() => awardMedal(currentStaff.email, 'silver')} 
                          style={{...styles.awardSotwBtn, background: '#9ca3af', color: '#fff'}}
                          disabled={currentStaff.email === currentUser.email}
                        >
                          🥈 Silver
                        </button>
                        <button 
                          onClick={() => awardMedal(currentStaff.email, 'bronze')} 
                          style={{...styles.awardSotwBtn, background: '#b45309', color: '#fff'}}
                          disabled={currentStaff.email === currentUser.email}
                        >
                          🥉 Bronze
                        </button>
                      </div>
                    )}
                  </div>

                  <div style={styles.notesSection}>
                    <h4 style={styles.notesTitle}><FileText size={18} /> Private Staff Notes</h4>
                    <p style={styles.notesDesc}>These notes are only visible to Administrators.</p>

                    <form onSubmit={handleAddNote} style={styles.noteForm}>
                      <div style={styles.noteFormRow}>
                        <select value={noteType} onChange={(e) => setNoteType(e.target.value)} style={styles.noteSelect}>
                          <option value="Performance">Performance</option>
                          <option value="Behaviour">Behaviour</option>
                          <option value="Promotion Recommendation">Promotion Recommendation</option>
                          <option value="General">General</option>
                        </select>
                        <input 
                          type="text" 
                          required 
                          value={noteText} 
                          onChange={(e) => setNoteText(e.target.value)} 
                          placeholder="Add a private note..." 
                          style={styles.noteInput} 
                        />
                        <button type="submit" style={styles.addNoteBtn}><Send size={16}/></button>
                      </div>
                    </form>

                    <div style={styles.notesList}>
                      {staffNotes.filter(n => n.staffEmail === currentStaff.email).length === 0 ? (
                        <p style={styles.emptyNotes}>No notes found for this staff member.</p>
                      ) : (
                        staffNotes.filter(n => n.staffEmail === currentStaff.email).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(note => (
                          <div key={note.id} style={styles.noteItem}>
                            <div style={styles.noteHeader}>
                              <span style={styles.noteTypeBadge}>{note.type}</span>
                              <span style={styles.noteMeta}>By {note.adminName} • {new Date(note.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p style={styles.noteTextDisplay}>{note.text}</p>
                            <button onClick={() => deleteStaffNote(note.id)} style={styles.deleteNoteBtn}><Trash2 size={14}/></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {manageTab === 'history' && (() => {
                const staffReports = reports.filter(r => r.reporterEmail === currentStaff.email);
                const staffLogs = flightLogs.filter(l => l.submitterEmail === currentStaff.email);
                const staffInfs = infractions.filter(i => i.staffEmail === currentStaff.email);
                const staffLoas = loaRequests.filter(l => l.userEmail === currentStaff.email);

                return (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                    <h4 style={{color: '#fff', margin: 0}}>Summary Record for {currentStaff.firstName}</h4>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                      <div className="glass-panel" style={{padding: '16px', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 8px 0', color: '#9ca3af'}}>Approved Flights</h5>
                        <p style={{margin: 0, fontSize: '1.5rem', color: '#fff'}}>{staffLogs.filter(l => l.status === 'Approved').length} <span style={{fontSize: '0.9rem', color: '#6b7280'}}>out of {staffLogs.length} total</span></p>
                      </div>
                      <div className="glass-panel" style={{padding: '16px', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 8px 0', color: '#9ca3af'}}>Consequences on Record</h5>
                        <p style={{margin: 0, fontSize: '1.5rem', color: staffInfs.length > 0 ? '#ef4444' : '#10b981'}}>{staffInfs.length}</p>
                      </div>
                      <div className="glass-panel" style={{padding: '16px', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 8px 0', color: '#9ca3af'}}>LOA Requests</h5>
                        <p style={{margin: 0, fontSize: '1.5rem', color: '#fff'}}>{staffLoas.length}</p>
                      </div>
                      <div className="glass-panel" style={{padding: '16px', borderRadius: '8px'}}>
                        <h5 style={{margin: '0 0 8px 0', color: '#9ca3af'}}>Reports Filed</h5>
                        <p style={{margin: 0, fontSize: '1.5rem', color: '#fff'}}>{staffReports.length}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {manageTab === 'promotion' && (() => {
                const logins = currentStaff.loginHistory || [];
                const approvedFlights = flightLogs.filter(l => l.submitterEmail === currentStaff.email && l.status === 'Approved').length;
                const infs = infractions.filter(i => i.staffEmail === currentStaff.email).length;

                const reasons = [];
                
                if (approvedFlights < 10) reasons.push(`Flights: Needs 10 approved flights (has ${approvedFlights})`);
                if (infs > 2) reasons.push(`Consequences: Must have 2 or fewer (has ${infs})`);

                const isEligible = reasons.length === 0;

                return (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <h4 style={{color: '#fff', margin: 0}}>Promotion Eligibility Checker</h4>
                    <div style={{
                      padding: '20px', 
                      borderRadius: '12px', 
                      background: isEligible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: isEligible ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      <h3 style={{color: isEligible ? '#10b981' : '#ef4444', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {isEligible ? <Award size={24} /> : <ShieldAlert size={24} />}
                        {isEligible ? 'Eligible for promotion' : 'Not eligible for promotion'}
                      </h3>
                      {!isEligible && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px'}}>
                          <strong style={{color: '#fca5a5', fontSize: '0.9rem'}}>Reason(s):</strong>
                          <ul style={{margin: 0, paddingLeft: '20px', color: '#f87171', fontSize: '0.9rem'}}>
                            {reasons.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' },
  headerText: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-main)' },
  subtitle: { fontSize: '0.9rem', color: '#9ca3af' },
  statsBadge: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', padding: '8px 16px', borderRadius: '8px', color: '#93c5fd', fontSize: '0.9rem', fontWeight: '600' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  profileSection: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarContainer: { position: 'relative', width: '48px', height: '48px' },
  avatar: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: '0', right: '0', width: '14px', height: '14px', background: '#10b981', border: '2px solid var(--color-bg-deep)', borderRadius: '50%', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' },
  userInfo: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  nameRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  name: { fontSize: '1.05rem', fontWeight: '600', color: 'var(--color-text-main)' },
  rankBadge: { padding: '2px 6px', borderRadius: '4px', border: '1px solid', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' },
  username: { fontSize: '0.85rem', color: '#9ca3af' },
  sotwWins: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px', fontWeight: '600' },
  roleSection: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' },
  roleBadges: { display: 'flex', gap: '8px', alignItems: 'center' },
  customRole: { fontSize: '0.85rem', color: '#c4b5fd', fontWeight: '500' },
  defaultRole: { fontSize: '0.85rem', color: '#9ca3af' },
  manageBtn: { padding: '4px 10px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { width: '90%', maxWidth: '600px', background: '#1e293b', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#fff' },
  closeModalBtn: { background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '70vh', overflowY: 'auto' },
  sotwAction: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px' },
  sotwInfo: { display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' },
  awardSotwBtn: { padding: '8px 16px', background: '#fbbf24', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  notesSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  notesTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', margin: 0, color: '#fff' },
  notesDesc: { margin: 0, fontSize: '0.9rem', color: '#9ca3af' },
  noteForm: { display: 'flex', flexDirection: 'column', gap: '8px' },
  noteFormRow: { display: 'flex', gap: '8px' },
  noteSelect: { padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' },
  noteInput: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none' },
  addNoteBtn: { padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notesList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' },
  emptyNotes: { color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' },
  noteItem: { padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' },
  noteHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  noteTypeBadge: { padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: '#e2e8f0' },
  noteMeta: { fontSize: '0.8rem', color: '#9ca3af' },
  noteTextDisplay: { margin: 0, fontSize: '0.95rem', color: '#d1d5db', lineHeight: '1.5' },
  deleteNoteBtn: { position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.7 },
  tabBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }
};
