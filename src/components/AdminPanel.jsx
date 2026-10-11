import React, { useState, useEffect } from 'react';
import { useApp, canTakeAction, getRankWeight } from '../context/AppContext';
import { 
  UserCheck, Users, Plane, Calendar, 
  Plus, Check, X, ShieldAlert, Trash2, Settings, Activity, Key, Award, FileText, MessageSquare
} from 'lucide-react';

export default function AdminPanel() {
  const { 
    users, 
    currentUser, 
    superAdminEmail, 
    approveUser, 
    rejectUser, 
    removeUser,
    addPoints,
    changeSiteRole,
    setCustomRole,
    suspendUser,
    unsuspendUser,
    infractions,
    addInfraction,
    deleteInfraction,
    addFlight, 
    editFlight,
    flights = [],
    flightLogs,
    approveFlightLog,
    rejectFlightLog,
    loaRequests, 
    updateLoaStatus,
    warningConfig,
    maintenanceConfig,
    setWarning,
    setMaintenance,
    auditLogs,
    passwordResets,
    approvePasswordReset,
    rejectPasswordReset,
    chatMessages,
    addChatMessage,
    events,
    addEvent,
    deleteEvent,
    meetings,
    addMeeting,
    deleteMeeting,
    addAnnouncement,
    setBypassAnnouncement,
    pageConfig,
    updatePageConfig,
    announcements = [],
    deleteAnnouncement,
    addInformalSanction,
    informalSanctions = [],
    deleteInformalSanction,
    logMissedFlight,
    pointLogs,
    unavailableDates,
    addUnavailableDate,
    removeUnavailableDate
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('approvals');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [consequencesSearchQuery, setConsequencesSearchQuery] = useState('');
  const [infCategory, setInfCategory] = useState('Behavior');
  const [successMsg, setSuccessMsg] = useState('');

  const [flightCode, setFlightCode] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [serverLink, setServerLink] = useState('');
  const [host, setHost] = useState('');
  
  const [editingFlightId, setEditingFlightId] = useState(null);

  // Announcement states
  const [annType, setAnnType] = useState('Normal');
  const [annTitle, setAnnTitle] = useState('');
  const [annSubtitle, setAnnSubtitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annTargetAudience, setAnnTargetAudience] = useState('All');
  const [annCountdownDate, setAnnCountdownDate] = useState('');
  const [bypassTitle, setBypassTitle] = useState('');
  const [bypassMessage, setBypassMessage] = useState('');

  // Events Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');

  // Meetings Form State
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');

  const [newUnavailableDate, setNewUnavailableDate] = useState('');

  // LOA Review comments
  const [loaComments, setLoaComments] = useState({});

  // Points state
  const [pointsAmounts, setPointsAmounts] = useState({});
  const [pointsReasons, setPointsReasons] = useState({});

  // Roles state
  const [roleInputs, setRoleInputs] = useState({});

  // Suspensions state
  const [suspendModalUser, setSuspendModalUser] = useState(null);
  const [suspendModalHours, setSuspendModalHours] = useState('');
  const [suspendModalReason, setSuspendModalReason] = useState('');
  
  // Infractions state
  const [showInfractionModal, setShowInfractionModal] = useState(false);
  const [infStaffEmail, setInfStaffEmail] = useState('');
  const [infType, setInfType] = useState('Warning');
  const [infMainMessage, setInfMainMessage] = useState('');
  const [infConfidentialMessage, setInfConfidentialMessage] = useState('');
  const [expandedInfractions, setExpandedInfractions] = useState({});

  // Password reset state
  const [newPasswords, setNewPasswords] = useState({});

  // System Status States
  const [warnActive, setWarnActive] = useState(warningConfig?.isActive || false);
  const [warnTitle, setWarnTitle] = useState(warningConfig?.title || '');
  const [warnMessage, setWarnMessage] = useState(warningConfig?.message || '');
  const [warnType, setWarnType] = useState(warningConfig?.type || 'info');
  const [warnCountdownEnabled, setWarnCountdownEnabled] = useState(warningConfig?.countdownEnabled || false);
  const [warnCountdownTarget, setWarnCountdownTarget] = useState(warningConfig?.countdownTarget || '');
  const [maintActive, setMaintActive] = useState(maintenanceConfig?.isActive || false);
  const [maintMessage, setMaintMessage] = useState(maintenanceConfig?.message || '');

  // Applications Form
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionType, setNewQuestionType] = useState('text');
  const [newQuestionOptions, setNewQuestionOptions] = useState('');

  // Audit modal state
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);



  const displaySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };



  const handleCreateFlight = (e) => {
    e.preventDefault();
    if (!flightCode || !date || !time || !location || !serverLink || !host) return;
    
    if (editingFlightId) {
      editFlight(editingFlightId, { flightCode, date, time, location, serverLink, host });
      displaySuccess(`Flight ${flightCode} successfully updated!`);
      setEditingFlightId(null);
    } else {
      addFlight({ flightCode, date, time, location, serverLink, host });
      displaySuccess(`Flight ${flightCode} successfully scheduled!`);
    }
    setFlightCode(''); setDate(''); setTime(''); setLocation(''); setServerLink(''); setHost('');
  };

  const startEditFlight = (flight) => {
    setEditingFlightId(flight.id);
    setFlightCode(flight.flightCode || '');
    setDate(flight.date || '');
    setTime(flight.time || '');
    setLocation(flight.location || '');
    setServerLink(flight.serverLink || '');
    setHost(flight.host || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const cancelEditFlight = () => {
    setEditingFlightId(null);
    setFlightCode(''); setDate(''); setTime(''); setLocation(''); setServerLink(''); setHost('');
  };

  const handleLoaAction = (loaId, status) => {
    const comment = loaComments[loaId] || '';
    updateLoaStatus(loaId, status, comment);
    setLoaComments(prev => ({ ...prev, [loaId]: '' }));
    displaySuccess(`LOA request status updated to ${status}.`);
  };

  const handleAddPoints = (email) => {
    const amount = parseInt(pointsAmounts[email], 10);
    const reason = pointsReasons[email] || 'Manual admin addition';
    if (!amount) return;
    addPoints(email, amount, reason);
    setPointsAmounts(prev => ({...prev, [email]: ''}));
    setPointsReasons(prev => ({...prev, [email]: ''}));
    displaySuccess(`Added ${amount} points to ${email}.`);
  };

  const handleSetRole = (email) => {
    const role = roleInputs[email];
    if (role === undefined) return;
    setCustomRole(email, role);
    displaySuccess(`Role updated to ${role}`);
  };

  const handleSuspend = (e) => {
    e.preventDefault();
    const hours = parseFloat(suspendModalHours);
    if (!hours || hours <= 0 || !suspendModalReason.trim()) return alert('Please enter valid hours and a reason.');
    suspendUser(suspendModalUser.email, hours, suspendModalReason);
    setSuspendModalUser(null);
    setSuspendModalHours('');
    setSuspendModalReason('');
    displaySuccess(`User suspended for ${hours} hours.`);
  };

  const handleAddInfraction = (e) => {
    e.preventDefault();
    if (!infStaffEmail || !infMainMessage.trim()) return;

    if (infType === 'Informal Sanction') {
      const wasLogged = addInformalSanction({
        staffEmail: infStaffEmail,
        reason: infMainMessage
      });
      if (!wasLogged) {
        alert('The informal sanction could not be logged. Please check the staff member and message.');
        return;
      }
    } else {
      const wasLogged = addInfraction({ staffEmail: infStaffEmail, type: infType, mainMessage: `[${infCategory}] ${infMainMessage}`, confidentialMessage: infConfidentialMessage });
      if (!wasLogged) {
        alert('The consequence could not be logged. Please check the staff member and message.');
        return;
      }
    }

    const targetedUser = users.find(u => u.email === infStaffEmail);

    setInfStaffEmail('');
    setInfType('Warning');
    setInfMainMessage('');
    setInfConfidentialMessage('');
    setShowInfractionModal(false);
    displaySuccess('Consequence successfully logged against staff member.');

    if (targetedUser) {
      setSuspendModalUser(targetedUser);
    }
  };

  const handleSaveSystemStatus = (e) => {
    e.preventDefault();
    setWarning(warnActive, warnTitle, warnMessage, warnType, warnCountdownEnabled, warnCountdownTarget);
    setMaintenance(maintActive, maintMessage);
    displaySuccess('System status configuration updated!');
  };

  const handleApprovePassword = (reqId, email) => {
    const pwd = newPasswords[reqId];
    if (!pwd) return alert('Please enter a new password to approve this request.');
    approvePasswordReset(reqId, email, pwd);
    setNewPasswords(prev => ({...prev, [reqId]: ''}));
    displaySuccess(`Password reset approved for ${email}.`);
  };

  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    if (!annMessage.trim()) return;
    addAnnouncement({ type: annType, title: annTitle, subtitle: annSubtitle, message: annMessage, targetAudience: annTargetAudience, countdownDate: annCountdownDate || null });
    setAnnTitle('');
    setAnnSubtitle('');
    setAnnMessage('');
    setAnnType('Normal');
    setAnnTargetAudience('All');
    setAnnCountdownDate('');
    displaySuccess('Announcement posted successfully.');
  };

  const handleBypassPost = (e) => {
    e.preventDefault();
    if (!bypassMessage.trim()) return;
    if (setBypassAnnouncement) {
      setBypassAnnouncement(bypassTitle, bypassMessage);
      setBypassTitle('');
      setBypassMessage('');
      displaySuccess('Global screen takeover triggered.');
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;
    addEvent({ title: eventTitle, description: eventDescription, date: eventDate });
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    displaySuccess('Event scheduled!');
  };

  const handleAddMeeting = (e) => {
    e.preventDefault();
    if (!meetingTitle || !meetingDate) return;
    addMeeting({ title: meetingTitle, description: meetingDescription, date: meetingDate });
    setMeetingTitle('');
    setMeetingDescription('');
    setMeetingDate('');
    displaySuccess('Meeting scheduled!');
  };

  // Derived lists
  const pendingUsers = users.filter(u => !u.approved && u.role !== 'passenger');
  const approvedUsers = users.filter(u => u.approved && u.role !== 'passenger');
  const pendingLoas = loaRequests.filter(req => req.status === 'Pending');
  const activeLoas = loaRequests.filter(req => req.status === 'Approved' || req.status === 'End Requested');
  const pendingFlightLogs = flightLogs.filter(log => log.status === 'Pending');
  const pendingPasswords = passwordResets.filter(r => r.status === 'Pending');

  const groupedInfractions = Object.values([...infractions, ...informalSanctions].reduce((acc, inf) => {
    if (!acc[inf.staffEmail]) acc[inf.staffEmail] = { 
      name: inf.staffName || (() => { const u = users.find(u => u.email === inf.staffEmail); return u ? `${u.firstName} ${u.lastName}` : inf.staffEmail; })(), 
      email: inf.staffEmail, 
      items: [], 
      suspensions: 0, 
      regular: 0,
      informal: 0
    };
    acc[inf.staffEmail].items.push(inf);
    if (inf.type === 'Suspension') acc[inf.staffEmail].suspensions++;
    else if (!inf.type && inf.reason) acc[inf.staffEmail].informal++;
    else acc[inf.staffEmail].regular++;
    return acc;
  }, {}));

  const isSuperAdmin = currentUser.email === superAdminEmail;


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeSubTab]);

  return (
    <div className="admin-layout" style={styles.layoutContainer}>
      {/* Sub tabs navigation */}
      <div className="admin-sidebar" style={styles.sidebar}>
        <button type="button" onClick={() => setActiveSubTab('approvals')} style={getTabStyle(activeSubTab === 'approvals')}>
          <UserCheck size={16} /> Approvals ({pendingUsers.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('staffManagement')} style={getTabStyle(activeSubTab === 'staffManagement')}>
          <Users size={16} /> Staff Management
        </button>
        <button type="button" onClick={() => setActiveSubTab('infractions')} style={getTabStyle(activeSubTab === 'infractions')}>
          <ShieldAlert size={16} /> Consequences
        </button>
        <button type="button" onClick={() => setActiveSubTab('flights')} style={getTabStyle(activeSubTab === 'flights')}>
          <Plane size={16} /> Schedule
        </button>
        <button type="button" onClick={() => setActiveSubTab('flight_logs')} style={getTabStyle(activeSubTab === 'flight_logs')}>
          <FileText size={16} /> Flight Logs ({pendingFlightLogs.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('loas')} style={getTabStyle(activeSubTab === 'loas')}>
          <Calendar size={16} /> LOAs ({pendingLoas.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('announcements')} style={getTabStyle(activeSubTab === 'announcements')}>
          <MessageSquare size={16} /> Announcements
        </button>
        <button type="button" onClick={() => setActiveSubTab('events')} style={getTabStyle(activeSubTab === 'events')}>
          <Calendar size={16} /> Events
        </button>
        <button type="button" onClick={() => setActiveSubTab('meetings')} style={getTabStyle(activeSubTab === 'meetings')}>
          <Calendar size={16} /> Meetings
        </button>
        <button type="button" onClick={() => setActiveSubTab('passwords')} style={getTabStyle(activeSubTab === 'passwords')}>
          <Key size={16} /> Passwords ({pendingPasswords.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('status')} style={getTabStyle(activeSubTab === 'status')}>
          <Settings size={16} /> System Status
        </button>

        <button type="button" onClick={() => setActiveSubTab('pointLogs')} style={getTabStyle(activeSubTab === 'pointLogs')}>
          <Award size={16} /> Point Logs
        </button>
      </div>

      <div style={styles.mainContent}>
      {successMsg && (
        <div style={styles.successAlert}><span>{successMsg}</span></div>
      )}

      {/* Sub Tab: Approvals */}
      {activeSubTab === 'approvals' && (
<div id="section-approvals">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>Pending User Registrations</h3>
          {pendingUsers.length === 0 ? (
            <div style={styles.emptyGrid}><UserCheck size={36} color="rgba(255,255,255,0.15)" /><p style={styles.emptyText}>No pending user accounts.</p></div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user.email} style={styles.trBody}>
                      <td style={styles.td}><strong>{user.firstName} {user.lastName}</strong><br/>@{user.robloxUsername}</td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button type="button" onClick={() => {approveUser(user.email); displaySuccess('User approved!');}} className="btn-success" style={styles.actionMiniBtn}><Check size={14} /> Approve</button>
                          <button type="button" onClick={() => {rejectUser(user.email); displaySuccess('User rejected.');}} className="btn-danger" style={styles.actionMiniBtn}><X size={14} /> Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      )}
      {/* Sub Tab: Infractions */}
      {activeSubTab === 'infractions' && (
<div id="section-infractions">
        <div style={styles.panelSection}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={styles.panelTitle}>Staff Consequences</h3>
            <div style={{ display: 'flex', gap: '16px', flex: 1, margin: '0 24px', marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={consequencesSearchQuery} 
                onChange={(e) => setConsequencesSearchQuery(e.target.value)} 
                className="input-field" 
                style={{ width: '100%', maxWidth: '300px' }} 
              />
            </div>
            <button type="button" className="btn-danger" onClick={() => setShowInfractionModal(true)} style={{padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <ShieldAlert size={16} /> Log New Consequence
            </button>
          </div>

          
          <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '24px' }}>
            <h3 style={{...styles.panelTitle, color: '#ef4444', marginBottom: '16px'}}>Active Suspensions</h3>
            {approvedUsers.filter(u => u.suspendedUntil && new Date(u.suspendedUntil).getTime() > Date.now()).length === 0 ? (
              <p style={{color: '#9ca3af', margin: 0}}>No staff are currently suspended.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {approvedUsers.filter(u => u.suspendedUntil && new Date(u.suspendedUntil).getTime() > Date.now()).map(user => (
                  <div key={user.email} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff' }}>{user.firstName} {user.lastName}</strong>
                        <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>Until: {new Date(user.suspendedUntil).toLocaleString()}</div>
                      </div>
                      <button 
                        onClick={() => { unsuspendUser(user.email); displaySuccess('User unsuspended.'); }} 
                        className="btn-success" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Lift
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {groupedInfractions.length === 0 ? (
              <p style={{padding: '20px', color: '#9ca3af', textAlign: 'center'}}>No consequences logged.</p>
            ) : (
              groupedInfractions.filter(group => `${group.name} ${group.email}`.toLowerCase().includes(consequencesSearchQuery.toLowerCase())).map(group => (
                <div key={group.email} className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <div 
                    style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}
                    onClick={() => setExpandedInfractions(prev => ({ ...prev, [group.email]: !prev[group.email] }))}
                  >
                    <div>
                      <h4 style={{ color: 'var(--color-text-main)', margin: 0 }}>{group.name}</h4>
                      <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{group.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ color: '#f87171', fontSize: '0.9rem' }}>{group.regular} Infractions</span>
                      <span style={{ color: '#fb923c', fontSize: '0.9rem' }}>{group.suspensions} Suspensions</span>
                      <span style={{ color: '#eab308', fontSize: '0.9rem' }}>{group.informal} Informal Sanctions</span>
                    </div>
                  </div>
                  
                  {expandedInfractions[group.email] && (
                    <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                          <thead>
                            <tr style={styles.trHead}>
                              <th style={styles.th}>Type</th>
                              <th style={styles.th}>Message & Appeal</th>
                              <th style={styles.th}>Logged By</th>
                              <th style={styles.th}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map(inf => {
                              const isInformal = !inf.type && inf.reason;
                              return (
                              <tr key={inf.id} style={styles.trBody}>
                                <td style={styles.td}><span style={{...styles.infractionBadge, background: isInformal ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isInformal ? '#eab308' : '#ef4444'}}>{isInformal ? 'Informal Sanction' : inf.type}</span></td>
                                <td style={styles.td}>
                                  <div style={{ marginBottom: '8px' }}>{isInformal ? inf.reason : inf.mainMessage}</div>
                                  {inf.appeal && (
                                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6', borderRadius: '4px', marginBottom: '8px' }}>
                                      <span style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 'bold' }}>STAFF APPEAL:</span>
                                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#bfdbfe' }}>{inf.appeal.text}</p>
                                    </div>
                                  )}
                                  {inf.confidentialMessage && <div style={styles.confidentialNote}>Admin note: {inf.confidentialMessage}</div>}
                                </td>
                                <td style={styles.td}>{isInformal ? inf.issuedByName : inf.adminName}<br />{isInformal ? new Date(inf.timestamp).toLocaleDateString() : inf.date}</td>
                                <td style={styles.td}>
                                  <button type="button" onClick={() => isInformal ? deleteInformalSanction(inf.id) : deleteInfraction(inf.id)} className="btn-danger" style={styles.actionMiniBtn}>
                                    <Trash2 size={14} /> Remove
                                  </button>
                                </td>
                              </tr>
                            )})}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      )}
      {/* Sub Tab: Staff Management */}
      {activeSubTab === 'staffManagement' && (
      <div id="section-staffManagement">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>Staff Management</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Search staff..." 
              value={staffSearchQuery} 
              onChange={(e) => setStaffSearchQuery(e.target.value)} 
              className="input-field" 
              style={{ width: '100%', maxWidth: '300px' }} 
            />
          </div>
          {!(currentUser?.siteRole === 'Admin' || currentUser?.siteRole === 'Owner' || currentUser?.email?.toLowerCase() === 'evanm.100000@gmail.com') && (
            <div style={styles.securityAlert}><ShieldAlert size={18} /><span>NOTE: You do not have permission to modify account roles.</span></div>
          )}
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Staff Member</th>
                  <th style={styles.th}>Role & Permissions</th>
                  <th style={styles.th}>Points</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvedUsers.filter(user => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(staffSearchQuery.toLowerCase())).map(user => {
                  const isSuspended = user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now();
                  return (
                    <tr key={user.email} style={styles.trBody}>
                      <td style={styles.td}>
                        <strong>{user.firstName} {user.lastName}</strong><br/>{user.email}
                        {isSuspended && <div style={{color: '#ef4444', fontSize: '0.8rem', marginTop: '4px'}}>Suspended until: {new Date(user.suspendedUntil).toLocaleString()}</div>}
                      </td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            {user.siteRole === 'Owner' ? <span className="badge badge-admin" style={{background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.5)'}}>Owner</span> : 
                             user.siteRole === 'Admin' ? <span className="badge badge-admin">Admin</span> : 
                             user.siteRole === 'Moderator' ? <span className="badge badge-admin" style={{background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.5)'}}>Moderator</span> : 
                             <span className="badge">Staff</span>}
                            
                            <select 
                              value={user.siteRole || 'Staff'} 
                              onChange={(e) => {
                                changeSiteRole(user.email, e.target.value); 
                                displaySuccess('Role updated');
                              }}
                              className="input-field"
                              style={{padding: '4px', fontSize: '0.85rem'}}
                              disabled={!canTakeAction(currentUser, user)}
                            >
                              <option value="Staff">Staff</option>
                              <option value="Moderator">Moderator</option>
                              {getRankWeight(currentUser) >= 60 && (
                                <option value="Admin">Admin</option>
                              )}
                              {getRankWeight(currentUser) >= 80 && (
                                <option value="Owner">Owner</option>
                              )}
                            </select>
                          </div>
                          <div style={{display: 'flex', gap: '8px'}}>
                            <input type="text" placeholder={user.customRole || "Custom Role"} value={roleInputs[user.email] !== undefined ? roleInputs[user.email] : user.customRole} onChange={e => setRoleInputs({...roleInputs, [user.email]: e.target.value})} className="input-field" style={{width: '120px', padding: '6px'}} />
                            <button type="button" onClick={() => handleSetRole(user.email)} className="btn-primary" style={{padding: '6px 10px', borderRadius: '6px'}}>Save</button>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{marginBottom: '4px'}}>Current: <strong>{user.points || 0}</strong></div>
                        <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                          <input type="number" placeholder="Amt" value={pointsAmounts[user.email] || ''} onChange={e => setPointsAmounts({...pointsAmounts, [user.email]: e.target.value})} className="input-field" style={{width: '60px', padding: '6px'}} />
                          <input type="text" placeholder="Reason" value={pointsReasons[user.email] || ''} onChange={e => setPointsReasons({...pointsReasons, [user.email]: e.target.value})} className="input-field" style={{width: '100px', padding: '6px'}} />
                          <button type="button" onClick={() => handleAddPoints(user.email)} className="btn-primary" style={{padding: '6px', borderRadius: '6px'}}><Plus size={14}/></button>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                          <button type="button" onClick={() => {
                            if (window.confirm(`Log Missed Flight for ${user.firstName}?`)) {
                              logMissedFlight(user.email);
                              displaySuccess('Missed flight logged.');
                            }
                          }} className="btn-secondary" style={{padding: '6px 10px', fontSize: '0.8rem'}}>
                            Missed Flight
                          </button>

                          {isSuspended ? (
                            <button type="button" disabled={!canTakeAction(currentUser, user)} onClick={() => {unsuspendUser(user.email); displaySuccess('User unsuspended.');}} className="btn-success" style={{padding: '6px 10px', fontSize: '0.8rem', opacity: (!canTakeAction(currentUser, user)) ? 0.5 : 1}}>
                              Unsuspend
                            </button>
                          ) : (
                            <button type="button" disabled={!canTakeAction(currentUser, user)} onClick={() => setSuspendModalUser(user)} className="btn-danger" style={{padding: '6px 10px', fontSize: '0.8rem', opacity: (!canTakeAction(currentUser, user)) ? 0.5 : 1}}>Suspend</button>
                          )}

                          {user.email !== currentUser.email && canTakeAction(currentUser, user) && (
                            <button type="button" onClick={() => {removeUser(user.email); displaySuccess('Staff removed.');}} className="btn-danger" style={{padding: '6px 10px', fontSize: '0.8rem'}}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      )}
      {/* Sub Tab: Flight Logs Review */}
      {activeSubTab === 'flight_logs' && (
<div id="section-flight_logs">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>Pending Flight Logs</h3>
          {pendingFlightLogs.length === 0 ? (
            <div style={styles.emptyGrid}><FileText size={36} color="rgba(255,255,255,0.15)" /><p style={styles.emptyText}>No pending logs.</p></div>
          ) : (
             <div style={styles.loaList}>
               {(() => {
                 const groupedPending = {};
                 const unassignedPending = [];
                 pendingFlightLogs.forEach(log => {
                   if (log.flightId) {
                     if (!groupedPending[log.flightId]) groupedPending[log.flightId] = [];
                     groupedPending[log.flightId].push(log);
                   } else {
                     unassignedPending.push(log);
                   }
                 });

                 return (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                     {Object.keys(groupedPending).map(flightId => {
                       const group = groupedPending[flightId];
                       const flightCode = group[0]?.flightCode || 'Unknown Flight';
                       return (
                         <div key={flightId} style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                           <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                             Flight: {flightCode}
                           </h4>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                             {group.map(log => (
                               <div key={log.id} style={styles.loaCard} className="glass-panel">
                                 <div style={styles.loaCardHeader}>
                                   <div><h4 style={{color: 'var(--color-text-main)'}}>{log.flightCode}</h4><span style={{color:'#9ca3af', fontSize:'0.8rem'}}>Pilot: {log.pilot} {log.coPilot ? `| CoPilot: ${log.coPilot}` : ''}</span></div>
                                   <span style={styles.loaDateText}>{new Date(log.timestamp).toLocaleDateString()}</span>
                                 </div>
                                 {log.photoProof && (
                                   <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                     <span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>Photo Proof:</span>
                                     <img src={log.photoProof} alt="Proof" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                                   </div>
                                 )}
                                 <div style={styles.loaReasonBox}>
                                   <span style={styles.loaReasonLabel}>Notes & Details:</span>
                                   <p style={styles.loaReasonText}>{log.notes || 'None'}</p>
                                   <p style={{fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px'}}>Logged by: {log.submitterName}</p>
                                 </div>
                                 <div style={styles.loaActionButtons}>
                                   <button type="button" onClick={() => {approveFlightLog(log.id); displaySuccess('Log approved and points added.');}} className="btn-success" style={styles.loaActionBtn}><Check size={14}/> Approve</button>
                                   <button type="button" onClick={() => {rejectFlightLog(log.id); displaySuccess('Log rejected.');}} className="btn-danger" style={styles.loaActionBtn}><X size={14}/> Reject</button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       );
                     })}
                     
                     {unassignedPending.length > 0 && (
                       <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                         <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                           Unassigned Logs
                         </h4>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                           {unassignedPending.map(log => (
                             <div key={log.id} style={styles.loaCard} className="glass-panel">
                               <div style={styles.loaCardHeader}>
                                 <div><h4 style={{color: 'var(--color-text-main)'}}>{log.flightCode}</h4><span style={{color:'#9ca3af', fontSize:'0.8rem'}}>Pilot: {log.pilot} {log.coPilot ? `| CoPilot: ${log.coPilot}` : ''}</span></div>
                                 <span style={styles.loaDateText}>{new Date(log.timestamp).toLocaleDateString()}</span>
                               </div>
                               {log.photoProof && (
                                 <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                   <span style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>Photo Proof:</span>
                                   <img src={log.photoProof} alt="Proof" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                                 </div>
                               )}
                               <div style={styles.loaReasonBox}>
                                 <span style={styles.loaReasonLabel}>Notes & Details:</span>
                                 <p style={styles.loaReasonText}>{log.notes || 'None'}</p>
                                 <p style={{fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px'}}>Logged by: {log.submitterName}</p>
                               </div>
                               <div style={styles.loaActionButtons}>
                                 <button type="button" onClick={() => {approveFlightLog(log.id); displaySuccess('Log approved and points added.');}} className="btn-success" style={styles.loaActionBtn}><Check size={14}/> Approve</button>
                                 <button type="button" onClick={() => {rejectFlightLog(log.id); displaySuccess('Log rejected.');}} className="btn-danger" style={styles.loaActionBtn}><X size={14}/> Reject</button>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })()}
             </div>
          )}
        </div>
      </div>

      )}
      {/* Sub Tab: Schedule Flight */}
      {activeSubTab === 'flights' && (
<div id="section-flights">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>{editingFlightId ? 'Edit Flight' : 'Schedule New Flight'}</h3>
          <form onSubmit={handleCreateFlight} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.inputWrapper}><label style={styles.label}>Flight Code *</label><input type="text" required value={flightCode} onChange={e=>setFlightCode(e.target.value)} className="input-field" /></div>
              <div style={styles.inputWrapper}><label style={styles.label}>Location *</label><input type="text" required value={location} onChange={e=>setLocation(e.target.value)} className="input-field" /></div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.inputWrapper}><label style={styles.label}>Date *</label><input type="date" required value={date} onChange={e=>setDate(e.target.value)} className="input-field" /></div>
              <div style={styles.inputWrapper}><label style={styles.label}>Time (LOCAL) *</label><input type="time" required value={time} onChange={e=>setTime(e.target.value)} className="input-field" /></div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Host *</label>
                <select required value={host} onChange={e=>setHost(e.target.value)} className="input-field">
                  <option value="">Select Host...</option>
                  {users.filter(u => u.approved).map(u => (
                    <option key={u.email} value={u.email}>{u.firstName} {u.lastName} (@{u.robloxUsername})</option>
                  ))}
                </select>
              </div>
              <div style={styles.inputWrapper}><label style={styles.label}>Roblox Server Direct Link *</label><input type="url" required value={serverLink} onChange={e=>setServerLink(e.target.value)} className="input-field" /></div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" style={{ ...styles.submitBtn, flex: 1 }}>
                {editingFlightId ? 'Update Flight' : <><Plus size={16} /> Schedule Flight</>}
              </button>
              {editingFlightId && (
                <button type="button" onClick={cancelEditFlight} className="btn-secondary" style={{ padding: '0 20px', borderRadius: '8px' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={{...styles.panelSection, marginTop: '24px'}}>
          <h3 style={styles.panelTitle}>Scheduled Flights</h3>
          {flights.length === 0 ? (
            <div style={styles.emptyGrid}><Plane size={36} color="rgba(255,255,255,0.15)" /><p style={styles.emptyText}>No flights currently scheduled.</p></div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Flight Code</th>
                    <th style={styles.th}>Date & Time (LOCAL)</th>
                    <th style={styles.th}>Host</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map(flight => {
                    const hostUser = users.find(u => u.email === flight.host);
                    return (
                      <tr key={flight.id} style={styles.trBody}>
                        <td style={styles.td}><strong>{flight.flightCode}</strong><br/><span style={{fontSize:'0.8rem', color:'#9ca3af'}}>{flight.location}</span></td>
                        <td style={styles.td}>{flight.date} at {flight.time}</td>
                        <td style={styles.td}>{hostUser ? `${hostUser.firstName} ${hostUser.lastName}` : flight.host}</td>
                        <td style={styles.td}>
                          <div style={styles.actionRow}>
                            <button type="button" onClick={() => startEditFlight(flight)} className="btn-secondary" style={styles.actionMiniBtn}>Edit</button>
                            {/* The Cancel Flight button is already in AllocationRequests, but admins might want it here too, though not strictly required */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      )}
      {/* Sub Tab: LOA Review */}
      {activeSubTab === 'loas' && (
<div id="section-loas">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>Pending LOAs</h3>
          {pendingLoas.length === 0 ? (
            <div style={styles.emptyGrid}><Calendar size={36} color="rgba(255,255,255,0.15)" /><p style={styles.emptyText}>No pending LOAs.</p></div>
          ) : (
            <div style={styles.loaList}>
              {pendingLoas.map(req => (
                <div key={req.id} style={styles.loaCard} className="glass-panel">
                  <div style={styles.loaCardHeader}>
                    <div><h4 style={{color: 'var(--color-text-main)'}}>{req.userName}</h4><span style={{color:'#9ca3af', fontSize:'0.8rem'}}>{req.userEmail}</span></div>
                    <div style={styles.loaDates}>
                      <span style={styles.loaDateText}>{req.startDate}</span> <span style={{color:'#9ca3af'}}>to</span> <span style={styles.loaDateText}>{req.endDate}</span>
                    </div>
                  </div>
                  <div style={styles.loaReasonBox}>
                    <span style={styles.loaReasonLabel}>Reason:</span>
                    <p style={styles.loaReasonText}>{req.reason}</p>
                  </div>
                  <div style={styles.loaActionPanel}>
                    <div style={styles.commentWrapper}>
                      <label style={styles.commentLabel}>Decision Note:</label>
                      <input type="text" value={loaComments[req.id] || ''} onChange={e => setLoaComments({...loaComments, [req.id]: e.target.value})} className="input-field" style={{padding: '8px 12px'}} />
                    </div>
                    <div style={styles.loaActionButtons}>
                      <button type="button" onClick={() => handleLoaAction(req.id, 'Approved')} className="btn-success" style={styles.loaActionBtn}><Check size={14}/> Approve</button>
                      <button type="button" onClick={() => handleLoaAction(req.id, 'Denied')} className="btn-danger" style={styles.loaActionBtn}><X size={14}/> Deny</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{...styles.panelSection, marginTop: '24px'}}>
          <h3 style={styles.panelTitle}>Active LOAs</h3>
          {activeLoas.length === 0 ? (
            <div style={styles.emptyGrid}><Calendar size={36} color="rgba(255,255,255,0.15)" /><p style={styles.emptyText}>No active LOAs.</p></div>
          ) : (
            <div style={styles.loaList}>
              {activeLoas.map(req => (
                <div key={req.id} style={styles.loaCard} className="glass-panel">
                  <div style={styles.loaCardHeader}>
                    <div><h4 style={{color: 'var(--color-text-main)'}}>{req.userName}</h4><span style={{color:'#9ca3af', fontSize:'0.8rem'}}>{req.userEmail}</span></div>
                    <div style={styles.loaDates}>
                      <span style={styles.loaDateText}>{req.startDate}</span> <span style={{color:'#9ca3af'}}>to</span> <span style={styles.loaDateText}>{req.endDate}</span>
                    </div>
                  </div>
                  <div style={styles.loaReasonBox}>
                     <span style={styles.loaReasonLabel}>Status:</span>
                     <p style={{color: req.status === 'End Requested' ? '#f59e0b' : '#10b981', fontWeight: 'bold'}}>{req.status === 'End Requested' ? 'End Requested' : 'Approved'}</p>
                  </div>
                  <div style={styles.loaActionPanel}>
                    <div style={styles.commentWrapper}>
                      <label style={styles.commentLabel}>End Early Note:</label>
                      <input type="text" value={loaComments[req.id] || ''} onChange={e => setLoaComments({...loaComments, [req.id]: e.target.value})} className="input-field" style={{padding: '8px 12px'}} />
                    </div>
                    <div style={styles.loaActionButtons}>
                      <button type="button" onClick={() => handleLoaAction(req.id, 'Ended Early')} className="btn-danger" style={styles.loaActionBtn}><X size={14}/> End LOA Early</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      )}
      {/* Sub Tab: Password Resets */}
      {activeSubTab === 'announcements' && (
        <div id="section-announcements" className="admin-section active">
          <div className="section-header">
            <h2><MessageSquare size={20} /> Manage Announcements</h2>
            <p>Post announcements or trigger global screen takeovers.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={styles.composeBox}>
              <h3 style={styles.composeTitle}>Post Announcement</h3>
              <form onSubmit={handlePostAnnouncement} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Type</label>
                    <select value={annType} onChange={e => setAnnType(e.target.value)} className="input-field">
                      <option value="Normal">Normal</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Target</label>
                    <select value={annTargetAudience} onChange={e => setAnnTargetAudience(e.target.value)} className="input-field">
                      <option value="All">All</option>
                      <option value="Staff">Staff</option>
                      <option value="Passenger">Passengers</option>
                    </select>
                  </div>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Title</label>
                    <input type="text" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} className="input-field" placeholder="Optional" />
                  </div>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Subtitle</label>
                    <input type="text" value={annSubtitle} onChange={e=>setAnnSubtitle(e.target.value)} className="input-field" placeholder="Optional" />
                  </div>
                </div>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Message</label>
                  <textarea value={annMessage} onChange={e=>setAnnMessage(e.target.value)} className="input-field" rows="2" required />
                </div>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Countdown Target (Optional)</label>
                  <input type="datetime-local" value={annCountdownDate} onChange={e=>setAnnCountdownDate(e.target.value)} className="input-field" />
                </div>
                <button type="submit" className="btn-primary" style={styles.submitBtn}>Post Announcement</button>
              </form>
            </div>

            <div className="glass-panel" style={{...styles.composeBox, borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.02)'}}>
              <h3 style={{...styles.composeTitle, color: '#ef4444'}}>Send Global Screen Takeover (Bypass Announcement)</h3>
              <form onSubmit={handleBypassPost} style={styles.form}>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Alert Title</label>
                  <input type="text" value={bypassTitle} onChange={e=>setBypassTitle(e.target.value)} className="input-field" required />
                </div>
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Alert Message</label>
                  <textarea value={bypassMessage} onChange={e=>setBypassMessage(e.target.value)} className="input-field" rows="2" required />
                </div>
                <button type="submit" className="btn-danger" style={styles.submitBtn}>Trigger Screen Takeover</button>
              </form>
            </div>
            
            <div>
              <h3 style={{...styles.composeTitle, marginTop: '20px'}}>Active Announcements</h3>
              {announcements.map(ann => (
                <div key={ann.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{ann.title || 'Untitled'}</strong> ({ann.type})
                  </div>
                  <button onClick={() => deleteAnnouncement(ann.id)} className="btn-danger" style={{ padding: '4px 12px' }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'events' && (
        <div id="section-events" className="admin-section active">
          <div className="section-header">
            <h2><Calendar size={20} /> Manage Events</h2>
            <p>Schedule upcoming events for passengers and staff.</p>
          </div>
          <div className="glass-panel" style={styles.composeBox}>
            <form onSubmit={handleAddEvent} style={styles.form}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Event Title</label>
                <input type="text" value={eventTitle} onChange={e=>setEventTitle(e.target.value)} className="input-field" required />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Event Description (Optional)</label>
                <textarea value={eventDescription} onChange={e=>setEventDescription(e.target.value)} className="input-field" rows="2" />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Event Date & Time (LOCAL)</label>
                <input type="datetime-local" value={eventDate} onChange={e=>setEventDate(e.target.value)} className="input-field" required />
              </div>
              <button type="submit" className="btn-primary" style={styles.submitBtn}>Schedule Event</button>
            </form>
          </div>
          <div style={{ marginTop: '24px' }}>
            <h3 style={styles.composeTitle}>Scheduled Events</h3>
            {events && events.map(event => (
              <div key={event.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{event.title}</strong> - {new Date(event.date).toLocaleString()}
                </div>
                <button onClick={() => deleteEvent(event.id)} className="btn-danger" style={{ padding: '4px 12px' }}>Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'meetings' && (
        <div id="section-meetings" className="admin-section active">
          <div className="section-header">
            <h2><Calendar size={20} /> Manage Meetings</h2>
            <p>Schedule upcoming meetings for staff.</p>
          </div>
          <div className="glass-panel" style={styles.composeBox}>
            <form onSubmit={handleAddMeeting} style={styles.form}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Meeting Title</label>
                <input type="text" value={meetingTitle} onChange={e=>setMeetingTitle(e.target.value)} className="input-field" required />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Meeting Description (Optional)</label>
                <textarea value={meetingDescription} onChange={e=>setMeetingDescription(e.target.value)} className="input-field" rows="2" />
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Meeting Date & Time (LOCAL)</label>
                <input type="datetime-local" value={meetingDate} onChange={e=>setMeetingDate(e.target.value)} className="input-field" required />
              </div>
              <button type="submit" className="btn-primary" style={styles.submitBtn}>Schedule Meeting</button>
            </form>
          </div>
          <div style={{ marginTop: '24px' }}>
            <h3 style={styles.composeTitle}>Scheduled Meetings</h3>
            {meetings && meetings.map(meeting => (
              <div key={meeting.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{meeting.title}</strong> - {new Date(meeting.date).toLocaleString()}
                </div>
                <button onClick={() => deleteMeeting(meeting.id)} className="btn-danger" style={{ padding: '4px 12px' }}>Cancel</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'passwords' && (
<div id="section-passwords">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>Password Reset Requests</h3>
          {pendingPasswords.length === 0 ? (
            <div style={styles.emptyGrid}><Key size={36} color="rgba(255,255,255,0.15)" /><p style={styles.emptyText}>No reset requests.</p></div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHead}>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>New Password</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPasswords.map(req => (
                    <tr key={req.id} style={styles.trBody}>
                      <td style={styles.td}>{req.email}</td>
                      <td style={styles.td}>{new Date(req.timestamp).toLocaleString()}</td>
                      <td style={styles.td}>
                        <input type="text" placeholder="Enter new password" value={newPasswords[req.id] || ''} onChange={e => setNewPasswords({...newPasswords, [req.id]: e.target.value})} className="input-field" style={{padding: '6px'}} />
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button type="button" onClick={() => handleApprovePassword(req.id, req.email)} className="btn-success" style={styles.actionMiniBtn}><Check size={14} /> Approve</button>
                          <button type="button" onClick={() => {rejectPasswordReset(req.id, req.email); displaySuccess('Request rejected');}} className="btn-danger" style={styles.actionMiniBtn}><X size={14} /> Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      )}
      {/* Sub Tab: System Status */}
      {activeSubTab === 'status' && (
<div id="section-status">
        <div style={styles.panelSection}>
          <h3 style={styles.panelTitle}>System Status Configuration</h3>
          <p style={styles.panelSubtitle}>Configure warning banners and full site maintenance lockouts.</p>
          <form onSubmit={handleSaveSystemStatus} style={styles.form}>
            <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '12px' }}>Warning Banner</h4>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                <input type="checkbox" id="warnActive" checked={warnActive} onChange={e => setWarnActive(e.target.checked)} style={{width: '20px', height: '20px'}} />
                <label htmlFor="warnActive" style={{fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: '600'}}>Enable Global Warning Banner</label>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Banner Title</label>
                <input type="text" value={warnTitle} onChange={e=>setWarnTitle(e.target.value)} placeholder="e.g. Goalbound Outfits Issue" className="input-field" disabled={!warnActive} />
              </div>
              <div style={{...styles.inputWrapper, marginTop: '12px'}}>
                <label style={styles.label}>Banner Message</label>
                <textarea value={warnMessage} onChange={e=>setWarnMessage(e.target.value)} className="input-field" rows="2" disabled={!warnActive} />
              </div>
              <div style={{...styles.inputWrapper, marginTop: '12px'}}>
                <label style={styles.label}>Banner Type</label>
                <select value={warnType} onChange={e=>setWarnType(e.target.value)} className="input-field" disabled={!warnActive}>
                  <option value="warning">Warning (Yellow)</option>
                  <option value="issue">Issue (Red)</option>
                  <option value="resolved">Resolved (Green)</option>
                </select>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', marginBottom: '12px'}}>
                <input type="checkbox" id="warnCountdown" checked={warnCountdownEnabled} onChange={e => setWarnCountdownEnabled(e.target.checked)} style={{width: '20px', height: '20px'}} disabled={!warnActive} />
                <label htmlFor="warnCountdown" style={{fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: '600'}}>Enable Countdown Timer</label>
              </div>
              {warnCountdownEnabled && (
                <div style={styles.inputWrapper}>
                  <label style={styles.label}>Countdown Target Date/Time (BST)</label>
                  <input type="datetime-local" value={warnCountdownTarget} onChange={e=>setWarnCountdownTarget(e.target.value)} className="input-field" disabled={!warnActive} />
                </div>
              )}
            </div>

            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h4 style={{ color: '#ef4444', marginBottom: '12px' }}>Site Maintenance Mode</h4>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
                <input type="checkbox" id="maintActive" checked={maintActive} onChange={e => setMaintActive(e.target.checked)} style={{width: '20px', height: '20px'}} />
                <label htmlFor="maintActive" style={{fontSize: '1rem', color: 'var(--color-text-main)', fontWeight: '600'}}>Enable Full Site Lockout</label>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Maintenance Message</label>
                <textarea value={maintMessage} onChange={e=>setMaintMessage(e.target.value)} className="input-field" rows="3" disabled={!maintActive} placeholder="The system is currently undergoing scheduled maintenance..." />
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginTop: '8px' }}>
              <h4 style={{ color: '#60a5fa', marginBottom: '8px' }}>Page Access Toggles</h4>
              <p style={{fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px'}}>Enable or disable specific pages. Disabled pages will show a "Temporarily unavailable" screen.</p>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px'}}>
                {Object.keys(pageConfig || {}).map(key => (
                  <div key={key} style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'}}>
                    <input 
                      type="checkbox" 
                      id={`toggle-${key}`}
                      checked={pageConfig[key]}
                      onChange={(e) => updatePageConfig(key, e.target.checked)}
                      style={{width: '18px', height: '18px'}}
                    />
                    <label htmlFor={`toggle-${key}`} style={{fontSize: '0.9rem', color: 'var(--color-text-main)', textTransform: 'capitalize', cursor: 'pointer', flex: 1}}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', marginTop: '8px' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '8px' }}>Calendar Management</h4>
              <p style={{fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px'}}>Manage dates that are completely unavailable for flights. These will be highlighted in the calendar.</p>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="date"
                  value={newUnavailableDate}
                  onChange={(e) => setNewUnavailableDate(e.target.value)}
                  className="input-field"
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  onClick={() => {
                    if (newUnavailableDate) {
                      addUnavailableDate(newUnavailableDate);
                      setNewUnavailableDate('');
                    }
                  }} 
                  className="btn-primary" 
                  style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                >
                  <Plus size={16} /> Add Date
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {unavailableDates && unavailableDates.length > 0 ? (
                  unavailableDates.map((dateObj) => (
                    <div key={dateObj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: '#e5e7eb', fontSize: '0.9rem' }}>{dateObj.date}</span>
                      <button 
                        type="button" 
                        onClick={() => removeUnavailableDate(dateObj.date)} 
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Remove Date"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>No unavailable dates set.</div>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={styles.submitBtn}>Save System Status Settings</button>
          </form>
        </div>
      </div>

      )}

      
      {/* Sub Tab: Point Logs */}
      {activeSubTab === 'pointLogs' && (
      <div id="section-pointlogs">
        <div style={styles.panelSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.panelTitle}><Award size={20} color="var(--color-primary)" /> Point Transaction Logs</h3>
          </div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Date & Time</th>
                  <th style={styles.th}>Staff Member</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Issued By</th>
                </tr>
              </thead>
              <tbody>
                {(!pointLogs || pointLogs.length === 0) ? (
                  <tr><td colSpan="5" style={{...styles.td, textAlign: 'center', padding: '30px'}}>No point transactions found.</td></tr>
                ) : pointLogs.map((log) => (
                  <tr key={log.id} style={styles.trBody}>
                    <td style={styles.td}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={styles.td}>{log.staffEmail}</td>
                    <td style={{...styles.td, color: log.amount > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>
                      {log.amount > 0 ? `+${log.amount}` : log.amount}
                    </td>
                    <td style={styles.td}>{log.reason}</td>
                    <td style={styles.td}>{log.adminEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* Audit Log Modal */}
      {selectedAuditLog && (
        <div style={styles.overlay}>
          <div className="glass-panel" style={{...styles.modal, width: '500px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
              <h3 style={{color: 'var(--color-text-main)', fontSize: '1.2rem'}}>Audit Log Details</h3>
              <button type="button" onClick={() => setSelectedAuditLog(null)} style={{background: 'transparent', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer'}}><X size={20}/></button>
            </div>
            <div style={{background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', overflowX: 'auto'}}>
              <pre style={{color: '#a7f3d0', fontSize: '0.85rem', margin: 0}}>
                {JSON.stringify(selectedAuditLog, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {suspendModalUser && (
        <div style={styles.overlay}>
          <div className="glass-panel" style={{...styles.modal, width: '400px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
               <h3 style={{color: 'var(--color-text-main)', fontSize: '1.2rem'}}>Suspend {suspendModalUser.firstName}</h3>
               <button type="button" onClick={() => setSuspendModalUser(null)} style={{background: 'transparent', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer'}}><X size={20}/></button>
            </div>
            <form onSubmit={handleSuspend} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
               <div style={styles.inputWrapper}>
                 <label style={styles.label}>Duration (Hours) *</label>
                 <input type="number" required min="1" value={suspendModalHours} onChange={e => setSuspendModalHours(e.target.value)} className="input-field" />
               </div>
               <div style={styles.inputWrapper}>
                 <label style={styles.label}>Reason for Suspension *</label>
                 <textarea required value={suspendModalReason} onChange={e => setSuspendModalReason(e.target.value)} className="input-field" rows="3" placeholder="Explain the reason for this suspension..."></textarea>
               </div>
               <button type="submit" className="btn-danger" style={{padding: '10px', borderRadius: '8px', cursor: 'pointer'}}>Confirm Suspension</button>
            </form>
          </div>
        </div>
      )}

      {/* Infraction Modal */}
      {showInfractionModal && (
        <div style={styles.overlay}>
          <div className="glass-panel" style={{...styles.modal, width: '500px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
               <h3 style={{color: 'var(--color-text-main)', fontSize: '1.2rem'}}>Log New Consequence</h3>
               <button type="button" onClick={() => setShowInfractionModal(false)} style={{background: 'transparent', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer'}}><X size={20}/></button>
            </div>
            <form onSubmit={handleAddInfraction} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Staff Member *</label>
                <select required value={infStaffEmail} onChange={e => setInfStaffEmail(e.target.value)} className="input-field">
                  <option value="">Choose active staff...</option>
                  {approvedUsers.filter(user => user.email !== currentUser.email && canTakeAction(currentUser, user)).map(user => (
                    <option key={user.email} value={user.email}>
                      {user.firstName} {user.lastName} (@{user.robloxUsername})
                      {(user.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now()) ? ' - Suspended' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Action Level</label>
                <select value={infType} onChange={e => {
                  if (e.target.value === 'Suspension') {
                    setShowInfractionModal(false);
                    setActiveSubTab('staffManagement');
                    return;
                  }
                  setInfType(e.target.value);
                }} className="input-field">
                  <option value="Informal Sanction">Informal sanction</option>
                  <option value="Infraction">Infraction</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Warning">Warning</option>
                </select>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Reason Category</label>
                <select value={infCategory} onChange={e => setInfCategory(e.target.value)} className="input-field">
                  <option value="Behavior">Behavior</option>
                  <option value="Verbal assault">Verbal assault</option>
                  <option value="Refusing a reasonable request">Refusing a reasonable request</option>
                  <option value="Absence">Absence</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Main Message * (Visible to the staff member)</label>
                <textarea
                  required
                  value={infMainMessage}
                  onChange={e => setInfMainMessage(e.target.value)}
                  placeholder="e.g. Unexcused absence from flight shift on June 12."
                  className="input-field"
                  rows="3"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Confidential Message (Admins Only)</label>
                <textarea
                  value={infConfidentialMessage}
                  onChange={e => setInfConfidentialMessage(e.target.value)}
                  placeholder="Optional private admin note."
                  className="input-field"
                  rows="2"
                  style={styles.confidentialTextarea}
                />
              </div>

              <button type="submit" className="btn-danger" style={styles.submitBtn}>
                <ShieldAlert size={16} /> Publish Consequence
              </button>
            </form>
          </div>
        </div>
      )}


      </div>

    </div>
  );
}

const getTabStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px',
  borderRadius: '12px', border: '1px solid ' + (isActive ? 'rgba(59, 130, 246, 0.5)' : 'transparent'),
  fontSize: '0.9rem', fontWeight: isActive ? '700' : '500', cursor: 'pointer',
  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
  color: isActive ? '#60a5fa' : '#94a3b8',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap'
});

const styles = {
  layoutContainer: { display: 'flex', gap: '32px', alignItems: 'flex-start', paddingBottom: '40px' },
  sidebar: { width: '260px', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, height: 'max-content', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: 'rgba(30, 41, 59, 0.5)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' },
  mainContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: '64px', minWidth: 0, paddingBottom: '30vh' },
  subTabContainer: { display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)', overflowX: 'auto' },
  successAlert: { background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '12px 16px', fontSize: '0.9rem', color: '#a7f3d0' },
  securityAlert: { background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' },
  panelSection: { display: 'flex', flexDirection: 'column', gap: '16px' },
  panelTitle: { fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-main)' },
  panelSubtitle: { fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '-8px' },
  emptyGrid: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '60px 0' },
  emptyText: { color: 'var(--color-text-muted)', fontSize: '0.95rem' },
  tableWrapper: { width: '100%', overflowX: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--color-border)' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' },
  trHead: { borderBottom: '1px solid var(--color-border)' },
  th: { padding: '12px 16px', fontWeight: '600', color: 'var(--color-primary)', fontSize: '0.8rem', textTransform: 'uppercase' },
  trBody: { borderBottom: '1px solid rgba(255,255,255,0.03)' },
  td: { padding: '12px 16px', color: 'var(--color-text-main)', verticalAlign: 'middle' },
  actionRow: { display: 'flex', gap: '8px' },
  actionMiniBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' },
  roleBtn: { padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--color-border)', padding: '24px', borderRadius: '16px' },
  formRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  inputWrapper: { flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.85rem', fontWeight: '500', color: 'var(--color-text-muted)' },
  textarea: { resize: 'vertical', minHeight: '110px' },
  confidentialTextarea: { resize: 'vertical', borderStyle: 'dashed', borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.02)' },
  submitBtn: { padding: '10px 20px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' },
  infractionBadge: { background: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  confidentialNote: { marginTop: '8px', color: '#67e8f9', fontSize: '0.8rem', fontStyle: 'italic' },
  loaList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  loaCard: { padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' },
  loaCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' },
  loaDateText: { background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: '600' },
  loaReasonBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
  loaReasonLabel: { fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-primary)', textTransform: 'uppercase' },
  loaReasonText: { fontSize: '0.875rem', color: 'var(--color-text-main)', lineHeight: '1.4' },
  loaActionPanel: { borderTop: '1px dashed var(--color-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  loaActionButtons: { display: 'flex', gap: '10px' },
  loaActionBtn: { padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { padding: '24px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
  composeBox: { padding: '24px', borderRadius: '12px' },
  composeTitle: { fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '16px' }
};
