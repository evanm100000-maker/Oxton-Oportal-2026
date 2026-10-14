import React, { useState, useEffect } from 'react';
import { useApp, canTakeAction, getRankWeight } from '../context/AppContext';
import FlightRegister from './FlightRegister';
import FlightQuotaProgress from './FlightQuotaProgress';
import ConsequenceLoggedModal, { computeStaffConsequenceStats } from './ConsequenceLoggedModal';
import { getSharedAudioContext } from '../utils/sirenAudio';
import { 
  UserCheck, Users, Plane, Calendar, 
  Plus, Check, X, ShieldAlert, Trash2, Settings, Activity, Key, Award, FileText, MessageSquare,
  LifeBuoy, Bell, AlertOctagon, Send, Lock, Eye, EyeOff, Clock, ClipboardList, Target, ExternalLink
} from 'lucide-react';
import { renderTextWithLinks, normalizeUrl } from '../utils/linkUtils';

const PAGE_TOGGLES_DEF = [
  // Operations & Flight Schedule
  { key: 'allocation', label: 'Allocation Requests', group: 'Operations & Schedule' },
  { key: 'calendar', label: 'Calendar Overview', group: 'Operations & Schedule' },
  { key: 'events', label: 'Upcoming Events', group: 'Operations & Schedule' },
  { key: 'meetings', label: 'Upcoming Meetings', group: 'Operations & Schedule' },
  { key: 'flightRegister', label: 'Flight Register', alias: 'logs', group: 'Operations & Schedule' },

  // Communications & Team
  { key: 'announcements', label: 'Announcements', group: 'Communications & Team' },
  { key: 'staffChat', label: 'Staff Messages / Chat', group: 'Communications & Team' },
  { key: 'allStaff', label: 'All Staff Roster', group: 'Communications & Team' },
  { key: 'leaderboard', label: 'Staff of the Week', group: 'Communications & Team' },

  // Staff Duties & Workspace
  { key: 'performance', label: 'My Performance', group: 'Duties & Workspace' },
  { key: 'tasks', label: 'Tasks & Assignments', group: 'Duties & Workspace' },
  { key: 'loa', label: 'Leave of Absence (LOA)', group: 'Duties & Workspace' },
  { key: 'tickets', label: 'Support Tickets', group: 'Duties & Workspace' },
  { key: 'infractions', label: 'Staff Consequences', group: 'Duties & Workspace' },

  // Documentation & Moderation
  { key: 'documents', label: 'Documents & Manuals', group: 'Documentation & Reports' },
  { key: 'reports', label: 'Player Reports', group: 'Documentation & Reports' },

  // Administration & Portals
  { key: 'adminPanel', label: 'Admin Control Center', alias: 'admin', group: 'Administration & Portals' },
  { key: 'analytics', label: 'Server Analytics', group: 'Administration & Portals' },
  { key: 'passengerPortal', label: 'Passenger Portal', group: 'Administration & Portals' },
];

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
    pointLogs = [],
    unavailableDates,
    addUnavailableDate,
    removeUnavailableDate,
    tickets = [],
    claimTicket,
    escalateTicket,
    closeTicket,
    updateTicketStatus,
    addTicketComment,
    emergencyAlertConfig,
    dispatchEmergencyAlert,
    clearEmergencyAlert,
    passDetention,
    failDetention,
    rescheduleDetention
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
  const [annLinkUrl, setAnnLinkUrl] = useState('');
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
  
  // Infractions / Consequences state
  const [showInfractionModal, setShowInfractionModal] = useState(false);
  const [infStaffEmail, setInfStaffEmail] = useState('');
  const [infType, setInfType] = useState('C1 Warning');
  const [infMainMessage, setInfMainMessage] = useState('');
  const [infConfidentialMessage, setInfConfidentialMessage] = useState('');
  const [infDetentionLocation, setInfDetentionLocation] = useState('Hall');
  const [infDetentionTime, setInfDetentionTime] = useState('14:55 - 15:15');
  const [infDetentionDate, setInfDetentionDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [expandedInfractions, setExpandedInfractions] = useState({});

  // Consequence count summary UI modal for admin
  const [showLoggedSummaryModal, setShowLoggedSummaryModal] = useState(false);
  const [loggedSummaryData, setLoggedSummaryData] = useState(null);

  // Detention Register states
  const [detentionDateFilter, setDetentionDateFilter] = useState(() => new Date().toISOString().split('T')[0]);
  const [rescheduleModalItem, setRescheduleModalItem] = useState(null);
  const [rescheduleNewDate, setRescheduleNewDate] = useState('');
  const [rescheduleNewTime, setRescheduleNewTime] = useState('');
  const [rescheduleNewLocation, setRescheduleNewLocation] = useState('Hall');

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

  // Emergency Alert States
  const [alertHeader, setAlertHeader] = useState('Emergency Alert');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSound, setAlertSound] = useState('standard'); // 'standard' (less severe) | 'severe' (loud siren)
  const [alertPassword, setAlertPassword] = useState('');
  const [alertPasswordError, setAlertPasswordError] = useState('');
  const [showAlertPassword, setShowAlertPassword] = useState(false);

  // Support Tickets States in Admin Panel
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all' | 'unclaimed' | 'mine' | 'escalated' | 'closed'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [adminTicketReplies, setAdminTicketReplies] = useState({});

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

    const targetEmail = infStaffEmail;
    const isDetention = infType.startsWith('C4');

    // Prevent duplicate C4 on the same date for this user
    if (isDetention) {
      const scheduledDate = (infDetentionDate || '').trim();
      const existingC4ForDate = (infractions || []).find(inf => 
        inf &&
        inf.staffEmail?.toLowerCase() === targetEmail.toLowerCase() &&
        (inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')) &&
        (inf.detentionDate || '').trim() === scheduledDate
      );

      if (existingC4ForDate) {
        alert('Unable to log (C4 Already Scheduled for this date for this user.)');
        return;
      }
    }

    const targetUser = users.find(u => u && u.email?.toLowerCase() === targetEmail.toLowerCase());
    const consequenceData = {
      type: infType,
      mainMessage: `[${infCategory}] ${infMainMessage}`,
      confidentialMessage: infConfidentialMessage,
      detentionLocation: isDetention ? (infDetentionLocation || 'Hall') : null,
      detentionDate: isDetention ? infDetentionDate : null,
      detentionTime: isDetention ? infDetentionTime : null
    };

    // Calculate new stats including this consequence before clearing form
    const newStats = computeStaffConsequenceStats(targetEmail, infractions, informalSanctions, infType);

    if (infType === 'Informal Sanction') {
      const wasLogged = addInformalSanction({
        staffEmail: targetEmail,
        reason: infMainMessage
      });
      if (!wasLogged) {
        alert('The informal sanction could not be logged. Please check the staff member and message.');
        return;
      }
    } else {
      const wasLogged = addInfraction({ 
        staffEmail: targetEmail, 
        type: infType, 
        mainMessage: consequenceData.mainMessage, 
        confidentialMessage: infConfidentialMessage,
        detentionDate: consequenceData.detentionDate,
        detentionTime: consequenceData.detentionTime,
        detentionLocation: consequenceData.detentionLocation
      });
      if (!wasLogged) {
        alert('The consequence could not be logged. Please check the staff member and message.');
        return;
      }
    }

    // Set summary modal data and open it to show the admin the updated consequence count
    setLoggedSummaryData({
      targetUser,
      targetEmail,
      loggedConsequence: consequenceData,
      stats: newStats
    });
    setShowLoggedSummaryModal(true);

    setInfStaffEmail('');
    setInfType('C1 Warning');
    setInfMainMessage('');
    setInfConfidentialMessage('');
    setInfDetentionLocation('Hall');
    setInfDetentionTime('14:55 - 15:15');
    setShowInfractionModal(false);
    displaySuccess('Consequence successfully logged against staff member.');
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
    addAnnouncement({ 
      type: annType, 
      title: annTitle, 
      subtitle: annSubtitle, 
      message: annMessage, 
      targetAudience: annTargetAudience, 
      countdownDate: annCountdownDate || null,
      linkUrl: annLinkUrl.trim() || ''
    });
    setAnnTitle('');
    setAnnSubtitle('');
    setAnnMessage('');
    setAnnLinkUrl('');
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

  // Emergency Alert Dispatch Handler
  const handleDispatchEmergencyAlert = (e) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;

    const enteredPassword = alertPassword.trim();
    if (enteredPassword !== '2025' && enteredPassword !== 'LumaAirways2025') {
      setAlertPasswordError('Incorrect authorization password. Alert cannot be dispatched.');
      return;
    }

    // Warm up audio context directly during the admin user gesture click
    try {
      getSharedAudioContext();
    } catch {
      // ignore
    }

    setAlertPasswordError('');
    dispatchEmergencyAlert(alertHeader.trim() || 'Emergency Alert', alertMessage.trim(), alertSound);
    displaySuccess(`Emergency alert (${alertHeader}) dispatched system-wide with ${alertSound === 'severe' ? 'LOUD' : 'Standard'} alarm!`);
    setAlertMessage('');
    setAlertPassword('');
  };

  const handleClearEmergencyAlert = () => {
    clearEmergencyAlert();
    displaySuccess('Active emergency alert cleared globally.');
  };

  // Support Tickets Reply Handler
  const handleAdminTicketReply = (e, ticketId) => {
    e.preventDefault();
    const replyText = (adminTicketReplies[ticketId] || '').trim();
    if (!replyText) return;
    addTicketComment(ticketId, replyText);
    setAdminTicketReplies(prev => ({ ...prev, [ticketId]: '' }));
    displaySuccess('Reply added to ticket.');
  };

  // Derived lists
  const pendingUsers = users.filter(u => !u.approved && u.role !== 'passenger');
  const approvedUsers = users.filter(u => u.approved && u.role !== 'passenger');
  const pendingLoas = loaRequests.filter(req => req.status === 'Pending');
  const activeLoas = loaRequests.filter(req => req.status === 'Approved' || req.status === 'End Requested');
  const pendingFlightLogs = flightLogs.filter(log => log.status === 'Pending');
  const pendingPasswords = passwordResets.filter(r => r.status === 'Pending');

  // Support Tickets list & counters
  const openTickets = tickets.filter(t => t.status === 'Open');
  const unclaimedTickets = tickets.filter(t => t.status === 'Open' && !t.claimedByEmail);
  const myClaimedTickets = tickets.filter(t => t.claimedByEmail === currentUser.email && t.status !== 'Closed');
  const escalatedTickets = tickets.filter(t => t.status === 'Escalated');
  const closedTickets = tickets.filter(t => t.status === 'Closed');

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'unclaimed') return t.status === 'Open' && !t.claimedByEmail;
    if (ticketFilter === 'mine') return t.claimedByEmail === currentUser.email && t.status !== 'Closed';
    if (ticketFilter === 'escalated') return t.status === 'Escalated';
    if (ticketFilter === 'closed') return t.status === 'Closed';
    return true; // 'all'
  });

  const groupedInfractions = Object.values([...infractions, ...informalSanctions].reduce((acc, inf) => {
    if (!inf || !inf.staffEmail) return acc;
    const emailKey = inf.staffEmail.toLowerCase().trim();
    if (!acc[emailKey]) {
      acc[emailKey] = { 
        name: inf.staffName || (() => { const u = users.find(u => u && u.email?.toLowerCase() === emailKey); return u ? `${u.firstName} ${u.lastName}` : inf.staffEmail; })(), 
        email: inf.staffEmail, 
        items: []
      };
    }
    acc[emailKey].items.push(inf);
    return acc;
  }, {})).map(group => {
    const stats = computeStaffConsequenceStats(group.email, infractions, informalSanctions);
    return {
      ...group,
      stats
    };
  });

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
        <button type="button" onClick={() => setActiveSubTab('detention_register')} style={getTabStyle(activeSubTab === 'detention_register')}>
          <Clock size={16} /> Detention Register
        </button>
        <button type="button" onClick={() => setActiveSubTab('flights')} style={getTabStyle(activeSubTab === 'flights')}>
          <Plane size={16} /> Schedule
        </button>
        <button type="button" onClick={() => setActiveSubTab('flight_register')} style={getTabStyle(activeSubTab === 'flight_register' || activeSubTab === 'flight_logs')}>
          <ClipboardList size={16} /> Flight Register
        </button>
        <button type="button" onClick={() => setActiveSubTab('flight_quotas')} style={getTabStyle(activeSubTab === 'flight_quotas')}>
          <Target size={16} /> Flight Quotas
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
        <button type="button" onClick={() => setActiveSubTab('tickets')} style={getTabStyle(activeSubTab === 'tickets')}>
          <LifeBuoy size={16} /> Support Tickets ({unclaimedTickets.length > 0 ? `${unclaimedTickets.length} new` : tickets.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('passwords')} style={getTabStyle(activeSubTab === 'passwords')}>
          <Key size={16} /> Passwords ({pendingPasswords.length})
        </button>
        <button type="button" onClick={() => setActiveSubTab('status')} style={getTabStyle(activeSubTab === 'status')}>
          <Settings size={16} /> System Status
        </button>
        <button 
          type="button" 
          onClick={() => setActiveSubTab('emergencyAlert')} 
          style={{
            ...getTabStyle(activeSubTab === 'emergencyAlert'), 
            color: activeSubTab === 'emergencyAlert' 
              ? (emergencyAlertConfig?.isActive ? '#ef4444' : '#60a5fa') 
              : (emergencyAlertConfig?.isActive ? '#f87171' : '#f87171'),
            borderColor: emergencyAlertConfig?.isActive 
              ? 'rgba(239, 68, 68, 0.6)' 
              : (activeSubTab === 'emergencyAlert' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.25)'),
            background: activeSubTab === 'emergencyAlert'
              ? (emergencyAlertConfig?.isActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.2)')
              : (emergencyAlertConfig?.isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.05)'),
            fontWeight: '700'
          }}
        >
          <AlertOctagon size={16} color={emergencyAlertConfig?.isActive ? '#ef4444' : '#f87171'} /> 
          <span>Emergency Alert</span>
          {emergencyAlertConfig?.isActive && (
            <span style={{ 
              fontSize: '0.65rem', 
              background: '#ef4444', 
              color: '#ffffff', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontWeight: '800',
              marginLeft: '4px'
            }}>
              LIVE
            </span>
          )}
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
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px'}}>
            <h3 style={styles.panelTitle}>Staff Consequences</h3>
            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '220px', maxWidth: '400px' }}>
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={consequencesSearchQuery} 
                onChange={(e) => setConsequencesSearchQuery(e.target.value)} 
                className="input-field" 
                style={{ width: '100%' }} 
              />
            </div>
            <button type="button" className="btn-danger" onClick={() => setShowInfractionModal(true)} style={{padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap'}}>
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
                    style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                    onClick={() => setExpandedInfractions(prev => ({ ...prev, [group.email]: !prev[group.email] }))}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ color: 'var(--color-text-main)', margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>{group.name}</h4>
                        {group.stats?.totalPoints >= 35 && (
                          <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.68rem', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Terminated
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#94a3af' }}>{group.email}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Total Consequence Points pill */}
                      <span style={{
                        background: group.stats?.totalPoints >= 30 ? 'rgba(239, 68, 68, 0.2)' : group.stats?.totalPoints >= 18 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: group.stats?.totalPoints >= 30 ? '#ef4444' : group.stats?.totalPoints >= 18 ? '#f59e0b' : '#60a5fa',
                        border: `1px solid ${group.stats?.totalPoints >= 30 ? 'rgba(239, 68, 68, 0.4)' : group.stats?.totalPoints >= 18 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700'
                      }}>
                        {group.stats?.totalPoints || 0} / 35 Points
                      </span>

                      {/* C1 - C2 Warnings */}
                      <span style={{
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600'
                      }}>
                        {group.stats?.c1c2CombinedCount || 0} C1-2s
                      </span>

                      {/* C3 Informal */}
                      <span style={{
                        background: 'rgba(234, 179, 8, 0.12)',
                        color: '#eab308',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600'
                      }}>
                        {group.stats?.c3Count || 0} C3s
                      </span>

                      {/* C4 Detentions */}
                      <span style={{
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600'
                      }}>
                        {group.stats?.c4Count || 0} C4s
                      </span>

                      {/* C5 Suspensions */}
                      <span style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#f87171',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600'
                      }}>
                        {group.stats?.c5Count || 0} C5s
                      </span>
                    </div>
                  </div>
                  
                  {expandedInfractions[group.email] && (
                    <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                          <thead>
                            <tr style={styles.trHead}>
                              <th style={styles.th}>Level</th>
                              <th style={styles.th}>Message & Appeal</th>
                              <th style={styles.th}>Logged By & Date</th>
                              <th style={styles.th}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map(inf => {
                              const isInformal = !inf.type && inf.reason;
                              const isC5 = inf.type?.startsWith('C5') || inf.type?.toLowerCase().includes('suspension');
                              const isC4 = inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention');
                              const isC3 = isInformal || inf.type?.startsWith('C3') || inf.type?.toLowerCase().includes('informal');
                              const isC2 = inf.type?.startsWith('C2');
                              const isC1 = inf.type?.startsWith('C1');

                              const badgeBg = isC5 
                                ? 'rgba(239, 68, 68, 0.18)' 
                                : isC4 
                                ? 'rgba(245, 158, 11, 0.18)' 
                                : isC3 
                                ? 'rgba(234, 179, 8, 0.18)' 
                                : 'rgba(59, 130, 246, 0.18)';
                              const badgeColor = isC5 ? '#ef4444' : isC4 ? '#f59e0b' : isC3 ? '#eab308' : '#60a5fa';
                              const badgeBorder = isC5 ? 'rgba(239, 68, 68, 0.35)' : isC4 ? 'rgba(245, 158, 11, 0.35)' : isC3 ? 'rgba(234, 179, 8, 0.35)' : 'rgba(59, 130, 246, 0.35)';
                              const displayType = isInformal ? 'C3 Informal Sanction' : (inf.type || 'C1 Warning');

                              return (
                              <tr key={inf.id} style={styles.trBody}>
                                <td style={styles.td}>
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{
                                      ...styles.infractionBadge, 
                                      background: badgeBg, 
                                      color: badgeColor,
                                      borderColor: badgeBorder
                                    }}>
                                      {displayType}
                                    </span>
                                    {inf.isEscalation && (
                                      <span style={{ fontSize: '0.68rem', color: '#fb923c', fontWeight: '700' }}>
                                        Escalated
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={styles.td}>
                                  <div style={{ marginBottom: '6px', lineHeight: '1.4' }}>{isInformal ? inf.reason : inf.mainMessage}</div>
                                  {isC4 && (
                                    <div style={{ fontSize: '0.8rem', color: '#fcd34d', margin: '4px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <Clock size={13} />
                                      <span><strong>Detention:</strong> {inf.detentionLocation || 'Hall'} &bull; {inf.detentionDate} &bull; {inf.detentionTime || '14:55'} (Status: {inf.detentionStatus || 'Scheduled'})</span>
                                    </div>
                                  )}
                                  {inf.appeal && (
                                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid #3b82f6', borderRadius: '4px', margin: '6px 0' }}>
                                      <span style={{ color: '#60a5fa', fontSize: '0.78rem', fontWeight: 'bold' }}>STAFF APPEAL:</span>
                                      <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#bfdbfe' }}>{inf.appeal.text}</p>
                                    </div>
                                  )}
                                  {inf.confidentialMessage && <div style={styles.confidentialNote}>Admin note: {inf.confidentialMessage}</div>}
                                </td>
                                <td style={styles.td}>
                                  <div>{isInformal ? inf.issuedByName : (inf.issuedByName || inf.adminName || 'Admin')}</div>
                                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{isInformal ? new Date(inf.timestamp).toLocaleDateString() : (inf.date || new Date(inf.timestamp || Date.now()).toLocaleDateString())}</div>
                                </td>
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

      {/* Sub Tab: Detention Register */}
      {activeSubTab === 'detention_register' && (
      <div id="section-detention_register">
        <div style={styles.panelSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={styles.panelTitle}>Detention Register</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                Manage scheduled C4 detentions (C4A 20 min, C4B 40 min). Pass completes the sanction on log, Fail escalates to C4B or 2-day C5 suspension.
              </p>
            </div>

            {/* Next 7 Days Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>Select Date:</label>
              <select
                value={detentionDateFilter}
                onChange={(e) => setDetentionDateFilter(e.target.value)}
                className="input-field"
                style={{ minWidth: '220px', padding: '10px 14px', borderRadius: '10px' }}
              >
                <option value="all">All Scheduled Detentions</option>
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() + i);
                  const dateStr = d.toISOString().split('T')[0];
                  const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                  return (
                    <option key={dateStr} value={dateStr}>
                      {i === 0 ? `Today (${label})` : i === 1 ? `Tomorrow (${label})` : label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Detention List */}
          {(() => {
            const filteredDetentions = infractions.filter(inf => {
              const isDetention = inf.type?.startsWith('C4') || inf.detentionStatus;
              if (!isDetention) return false;
              if (detentionDateFilter === 'all') return true;
              return inf.detentionDate === detentionDateFilter;
            });

            if (filteredDetentions.length === 0) {
              return (
                <div style={styles.emptyGrid}>
                  <Clock size={40} color="rgba(255,255,255,0.15)" />
                  <p style={styles.emptyText}>No C4 detentions scheduled for {new Date(detentionDateFilter).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}.</p>
                </div>
              );
            }

            return (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}>
                      <th style={styles.th}>Staff Member</th>
                      <th style={styles.th}>Sanction Level</th>
                      <th style={styles.th}>Location & Time</th>
                      <th style={styles.th}>Reason</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDetentions.map(item => {
                      const isPassed = item.detentionStatus === 'Passed';
                      const isFailed = item.detentionStatus === 'Failed';
                      const isScheduled = !isPassed && !isFailed;
                      const isC4b = item.type?.includes('C4B') || item.type?.toLowerCase().includes('40m');

                      return (
                        <tr key={item.id} style={styles.trBody}>
                          <td style={styles.td}>
                            <strong>{item.staffName}</strong><br />
                            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{item.staffEmail}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                ...styles.infractionBadge,
                                background: isC4b ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: isC4b ? '#f59e0b' : '#60a5fa',
                                borderColor: isC4b ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)'
                              }}>
                                {isC4b ? 'C4B (40m)' : 'C4A (20m)'}
                              </span>
                              {item.isEscalation && (
                                <span style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  color: '#ef4444',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  Escalated
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div><strong>{item.detentionLocation || 'Hall'}</strong></div>
                            <span style={{ fontSize: '0.82rem', color: '#9ca3af' }}>
                              {item.detentionTime || (isC4b ? '14:55 - 15:35' : '14:55 - 15:15')}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ maxWidth: '300px', fontSize: '0.88rem' }}>{item.mainMessage}</div>
                          </td>
                          <td style={styles.td}>
                            {isPassed && (
                              <span style={{ color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} /> Passed (Complete)
                              </span>
                            )}
                            {isFailed && (
                              <span style={{ color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <X size={14} /> Failed & Escalated
                              </span>
                            )}
                            {isScheduled && (
                              <span style={{ color: '#f59e0b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} /> Scheduled
                              </span>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {isScheduled ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      passDetention(item.id);
                                      displaySuccess(`Passed detention for ${item.staffName}. Marked as Complete.`);
                                    }}
                                    className="btn-success"
                                    style={styles.loaActionBtn}
                                    title="Mark Passed (Complete)"
                                  >
                                    <Check size={14} /> Pass
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Fail detention for ${item.staffName}? This will escalate to ${isC4b ? '2-day C5 Suspension' : 'C4B (40m detention)'}.`)) {
                                        const res = failDetention(item.id);
                                        const escalatedTo = isC4b ? 'C5 Suspension' : 'C4B - 40m Detention';
                                        const updatedStats = computeStaffConsequenceStats(item.staffEmail, infractions, informalSanctions, escalatedTo);
                                        displaySuccess(`Failed detention for ${item.staffName}. Escalated to ${escalatedTo}! Consequence points: ${updatedStats.totalPoints}/35 points.`);
                                      }
                                    }}
                                    className="btn-danger"
                                    style={styles.loaActionBtn}
                                    title="Mark Failed & Escalate"
                                  >
                                    <X size={14} /> Fail
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRescheduleModalItem(item);
                                      setRescheduleNewDate(item.detentionDate || detentionDateFilter);
                                      setRescheduleNewTime(item.detentionTime || (isC4b ? '14:55 - 15:35' : '14:55 - 15:15'));
                                      setRescheduleNewLocation(item.detentionLocation || 'Hall');
                                    }}
                                    className="btn-secondary"
                                    style={{ ...styles.loaActionBtn, color: 'var(--color-text-main)' }}
                                    title="Reschedule Detention"
                                  >
                                    Reschedule
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRescheduleModalItem(item);
                                    setRescheduleNewDate(item.detentionDate || detentionDateFilter);
                                    setRescheduleNewTime(item.detentionTime || (isC4b ? '14:55 - 15:35' : '14:55 - 15:15'));
                                    setRescheduleNewLocation(item.detentionLocation || 'Hall');
                                  }}
                                  className="btn-secondary"
                                  style={{ ...styles.loaActionBtn, color: 'var(--color-text-main)' }}
                                  title="Reschedule Detention"
                                >
                                  Reschedule
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
            );
          })()}
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
      {/* Sub Tab: Flight Attendance Register */}
      {(activeSubTab === 'flight_register' || activeSubTab === 'flight_logs') && (
        <div id="section-flight-register" className="admin-section active" style={{ width: '100%' }}>
          <FlightRegister />
        </div>
      )}

      {/* Sub Tab: Staff Flight Quota Management */}
      {activeSubTab === 'flight_quotas' && (
        <div id="section-flight-quotas" className="admin-section active" style={{ width: '100%' }}>
          <FlightQuotaProgress />
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
                <div style={styles.formRow}>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Action / External Link (Optional)</label>
                    <input type="text" value={annLinkUrl} onChange={e=>setAnnLinkUrl(e.target.value)} className="input-field" placeholder="https://..." />
                  </div>
                  <div style={styles.inputWrapper}>
                    <label style={styles.label}>Countdown Target (Optional)</label>
                    <input type="datetime-local" value={annCountdownDate} onChange={e=>setAnnCountdownDate(e.target.value)} className="input-field" />
                  </div>
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
                <div key={ann.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong>{renderTextWithLinks(ann.title || 'Untitled')}</strong>
                      <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#9ca3af' }}>{ann.type}</span>
                      {ann.linkUrl && (
                        <a
                          href={normalizeUrl(ann.linkUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.78rem', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
                        >
                          <span>Open Link</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#d1d5db', marginTop: '4px', wordBreak: 'break-word' }}>
                      {renderTextWithLinks(ann.message)}
                    </div>
                  </div>
                  <button onClick={() => deleteAnnouncement(ann.id)} className="btn-danger" style={{ padding: '6px 12px', flexShrink: 0 }}>Delete</button>
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

            <div style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ color: '#60a5fa', marginBottom: '4px', fontSize: '1.1rem', fontWeight: '700' }}>Page Access Toggles</h4>
                  <p style={{fontSize: '0.85rem', color: '#94a3b8', margin: 0}}>Enable or disable specific pages across the portal. Disabled pages will show a "Temporarily unavailable" screen to staff.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const allToggles = [
                        ...PAGE_TOGGLES_DEF,
                        ...Object.keys(pageConfig || {})
                          .filter(k => !new Set(PAGE_TOGGLES_DEF.flatMap(p => [p.key, p.alias].filter(Boolean))).has(k))
                          .map(k => ({ key: k }))
                      ];
                      allToggles.forEach(item => {
                        updatePageConfig(item.key, true);
                        if (item.alias) updatePageConfig(item.alias, true);
                      });
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '6px' }}
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const allToggles = [
                        ...PAGE_TOGGLES_DEF,
                        ...Object.keys(pageConfig || {})
                          .filter(k => !new Set(PAGE_TOGGLES_DEF.flatMap(p => [p.key, p.alias].filter(Boolean))).has(k))
                          .map(k => ({ key: k }))
                      ];
                      allToggles.forEach(item => {
                        if (item.key !== 'adminPanel' && item.key !== 'admin') {
                          updatePageConfig(item.key, false);
                          if (item.alias && item.alias !== 'admin' && item.alias !== 'adminPanel') updatePageConfig(item.alias, false);
                        }
                      });
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    Disable All
                  </button>
                </div>
              </div>

              {(() => {
                const knownKeys = new Set(PAGE_TOGGLES_DEF.flatMap(p => [p.key, p.alias].filter(Boolean)));
                const extraConfigKeys = Object.keys(pageConfig || {}).filter(k => !knownKeys.has(k));
                const allDisplayToggles = [
                  ...PAGE_TOGGLES_DEF,
                  ...extraConfigKeys.map(k => ({
                    key: k,
                    label: k.replace(/([A-Z])/g, ' $1').trim(),
                    group: 'Other Pages'
                  }))
                ];
                const groups = Array.from(new Set(allDisplayToggles.map(t => t.group)));

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {groups.map(groupName => {
                      const groupItems = allDisplayToggles.filter(t => t.group === groupName);
                      return (
                        <div key={groupName} style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93c5fd', marginBottom: '12px' }}>
                            {groupName}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                            {groupItems.map(item => {
                              const isEnabled = pageConfig ? (pageConfig[item.key] !== false && (!item.alias || pageConfig[item.alias] !== false)) : true;
                              return (
                                <div
                                  key={item.key}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: isEnabled ? 'rgba(255,255,255,0.02)' : 'rgba(239, 68, 68, 0.06)',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: isEnabled ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(239, 68, 68, 0.3)',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    id={`toggle-${item.key}`}
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      const val = e.target.checked;
                                      updatePageConfig(item.key, val);
                                      if (item.alias) updatePageConfig(item.alias, val);
                                    }}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
                                  />
                                  <label
                                    htmlFor={`toggle-${item.key}`}
                                    style={{
                                      fontSize: '0.88rem',
                                      color: isEnabled ? 'var(--color-text-main)' : '#94a3b8',
                                      cursor: 'pointer',
                                      flex: 1,
                                      fontWeight: isEnabled ? '500' : '400',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      userSelect: 'none'
                                    }}
                                  >
                                    <span>{item.label}</span>
                                    {!isEnabled && (
                                      <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase', background: 'rgba(239,68,68,0.14)', padding: '2px 5px', borderRadius: '4px' }}>
                                        Disabled
                                      </span>
                                    )}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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

      {/* Sub Tab: Emergency Alert */}
      {activeSubTab === 'emergencyAlert' && (
      <div id="section-emergency-alert">
        <div style={styles.panelSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={styles.panelTitle}><AlertOctagon size={20} color="#ef4444" /> Emergency Alert System</h3>
              <p style={styles.panelSubtitle}>Dispatch high-priority fullscreen takeover alerts to all active users with audible siren.</p>
            </div>
            {emergencyAlertConfig?.isActive && (
              <button 
                type="button" 
                onClick={handleClearEmergencyAlert} 
                className="btn-danger" 
                style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <X size={16} /> Cancel Active Alert
              </button>
            )}
          </div>

          {emergencyAlertConfig?.isActive && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontWeight: 'bold' }}>
                <ShieldAlert size={20} />
                <span>ALERT BROADCAST IN PROGRESS: {emergencyAlertConfig.header}</span>
              </div>
              <p style={{ margin: 0, color: '#fca5a5', fontSize: '0.95rem' }}>{emergencyAlertConfig.message}</p>
              <span style={{ fontSize: '0.8rem', color: '#f87171' }}>
                Dispatched by {emergencyAlertConfig.senderName} at {new Date(emergencyAlertConfig.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}

          <form onSubmit={handleDispatchEmergencyAlert} style={styles.form}>
            <div style={styles.inputWrapper}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Alert Header (Editable) *</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertHeader('Emergency Alert');
                      setAlertSound('standard');
                    }}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Preset: Emergency Alert
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAlertHeader('Severe Emergency Alert');
                      setAlertSound('severe');
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Preset: Severe Emergency Alert
                  </button>
                </div>
              </div>
              <input
                required
                type="text"
                value={alertHeader}
                onChange={e => setAlertHeader(e.target.value)}
                placeholder="e.g. Emergency Alert, Severe Weather Warning, Security Lockdown..."
                className="input-field"
                style={{ fontWeight: '700', fontSize: '1rem' }}
              />
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Alarm Sound Intensity *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid ' + (alertSound === 'standard' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.1)'),
                  background: alertSound === 'standard' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  color: alertSound === 'standard' ? '#60a5fa' : 'var(--color-text-main)'
                }}>
                  <input
                    type="radio"
                    name="alertSound"
                    value="standard"
                    checked={alertSound === 'standard'}
                    onChange={() => setAlertSound('standard')}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>Less Severe Sound</strong>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Softer dual-tone pulse warning</span>
                  </div>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid ' + (alertSound === 'severe' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.1)'),
                  background: alertSound === 'severe' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                  color: alertSound === 'severe' ? '#f87171' : 'var(--color-text-main)'
                }}>
                  <input
                    type="radio"
                    name="alertSound"
                    value="severe"
                    checked={alertSound === 'severe'}
                    onChange={() => setAlertSound('severe')}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>Severe Loud Alarm Sound</strong>
                    <span style={{ fontSize: '0.78rem', color: '#fca5a5' }}>High-pitched piercing emergency siren</span>
                  </div>
                </label>
              </div>
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Alert Message & Instructions *</label>
              <textarea
                required
                value={alertMessage}
                onChange={e => setAlertMessage(e.target.value)}
                placeholder="Enter urgent information, incident details, and required actions..."
                className="input-field"
                rows="5"
                style={styles.textarea}
              />
            </div>

            {/* Password Authorization Box */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', fontSize: '0.95rem' }}>
                <Lock size={18} />
                <span>Security Authorization Required to Dispatch</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Dispatching an emergency alert takes over all user devices with loud sirens. Enter the administrative dispatch security password to confirm this action.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
                  <input
                    required
                    type={showAlertPassword ? "text" : "password"}
                    value={alertPassword}
                    onChange={e => {
                      setAlertPassword(e.target.value);
                      if (alertPasswordError) setAlertPasswordError('');
                    }}
                    placeholder="Enter dispatch security password..."
                    className="input-field"
                    style={{
                      borderColor: alertPasswordError ? '#ef4444' : undefined,
                      width: '100%',
                      paddingRight: '40px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAlertPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                    title={showAlertPassword ? "Hide password" : "Show password"}
                  >
                    {showAlertPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {alertPasswordError && (
                  <span style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: '600' }}>
                    {alertPasswordError}
                  </span>
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#fcd34d',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Bell size={18} />
              <span><strong>Notice:</strong> All users will be locked out for 10 seconds with the selected alarm sound.</span>
            </div>

            <button 
              type="submit" 
              className="btn-danger" 
              style={{
                ...styles.submitBtn, 
                padding: '12px 24px', 
                fontSize: '0.95rem', 
                fontWeight: '700',
                background: alertSound === 'severe' || (alertHeader || '').toLowerCase().includes('severe') ? '#dc2626' : '#ea580c',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Lock size={16} /> Dispatch {alertHeader || 'Emergency Alert'}
            </button>
          </form>
        </div>
      </div>
      )}

      {/* Sub Tab: Support Tickets */}
      {activeSubTab === 'tickets' && (
      <div id="section-admin-tickets">
        <div style={styles.panelSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={styles.panelTitle}><LifeBuoy size={20} color="var(--color-primary)" /> Support Tickets Management</h3>
              <p style={styles.panelSubtitle}>Claim, reply to, escalate, or close support tickets submitted by staff and passengers.</p>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${tickets.length})` },
                { id: 'unclaimed', label: `Unclaimed (${unclaimedTickets.length})` },
                { id: 'mine', label: `Claimed by Me (${myClaimedTickets.length})` },
                { id: 'escalated', label: `Escalated (${escalatedTickets.length})` },
                { id: 'closed', label: `Closed (${closedTickets.length})` },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTicketFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: ticketFilter === f.id ? '700' : '500',
                    border: '1px solid ' + (ticketFilter === f.id ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.1)'),
                    background: ticketFilter === f.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    color: ticketFilter === f.id ? '#60a5fa' : '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div style={styles.emptyGrid}>
              <LifeBuoy size={42} color="rgba(255,255,255,0.15)" />
              <p style={styles.emptyText}>No support tickets found under this filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredTickets.map(ticket => {
                const isSelected = selectedTicketId === ticket.id;
                const isClaimedByMe = ticket.claimedByEmail === currentUser.email;

                return (
                  <div 
                    key={ticket.id} 
                    className="glass-panel" 
                    style={{
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid ' + (isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.08)'),
                      background: isSelected ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    {/* Top Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)', fontWeight: '700' }}>
                            {ticket.title}
                          </h4>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: ticket.status === 'Open' ? 'rgba(59, 130, 246, 0.15)' : ticket.status === 'Escalated' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: ticket.status === 'Open' ? '#60a5fa' : ticket.status === 'Escalated' ? '#f59e0b' : '#34d399',
                            border: '1px solid ' + (ticket.status === 'Open' ? 'rgba(59, 130, 246, 0.3)' : ticket.status === 'Escalated' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)')
                          }}>
                            {ticket.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                          <span>Opened by <strong>{ticket.authorName}</strong> ({ticket.authorType || 'Staff'})</span>
                          <span>•</span>
                          <span>{new Date(ticket.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>{ticket.comments?.length || 0} replies</span>
                        </div>
                      </div>

                      {/* Claim Status & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {ticket.claimedByName ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            background: isClaimedByMe ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: isClaimedByMe ? '#34d399' : '#818cf8',
                            border: '1px solid ' + (isClaimedByMe ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'),
                            fontWeight: '600'
                          }}>
                            {isClaimedByMe ? 'Claimed by You' : `Assisting: ${ticket.claimedByName}`}
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            background: 'rgba(239, 68, 68, 0.12)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            fontWeight: '600'
                          }}>
                            Unclaimed
                          </span>
                        )}

                        {/* Admin Action Buttons */}
                        {(!ticket.claimedByEmail || ticket.claimedByEmail !== currentUser.email) && ticket.status !== 'Closed' && (
                          <button
                            type="button"
                            onClick={() => { claimTicket(ticket.id); displaySuccess(`Ticket claimed! Automated response sent.`); }}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            Claim Ticket
                          </button>
                        )}
                        {ticket.status !== 'Escalated' && (
                          <button
                            type="button"
                            onClick={() => { escalateTicket(ticket.id); displaySuccess('Ticket escalated.'); }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              cursor: 'pointer'
                            }}
                          >
                            Escalate
                          </button>
                        )}
                        {ticket.status !== 'Closed' ? (
                          <button
                            type="button"
                            onClick={() => { closeTicket(ticket.id); displaySuccess('Ticket closed.'); }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              cursor: 'pointer'
                            }}
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { updateTicketStatus(ticket.id, 'Open'); displaySuccess('Ticket re-opened.'); }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              borderRadius: '6px',
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              cursor: 'pointer'
                            }}
                          >
                            Re-open
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedTicketId(isSelected ? null : ticket.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--color-text-main)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? 'Collapse' : 'View Thread'}
                        </button>
                      </div>
                    </div>

                    {/* Ticket Description */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '0.92rem',
                      color: 'var(--color-text-main)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {ticket.description}
                    </div>

                    {/* Thread Details when expanded */}
                    {isSelected && (
                      <div style={{
                        marginTop: '8px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <h5 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-primary)' }}>Conversation Thread</h5>

                        {(() => {
                          const threadComments = Array.isArray(ticket.comments) 
                            ? ticket.comments 
                            : (ticket.comments && typeof ticket.comments === 'object' ? Object.values(ticket.comments) : []);

                          if (threadComments.length === 0) {
                            return (
                              <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', margin: '4px 0' }}>No replies in this thread yet.</p>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {threadComments.map(c => {
                                const isSys = c.isSystem || c.authorEmail === 'system';
                                return (
                                  <div
                                    key={c.id || Math.random()}
                                    style={{
                                      background: isSys ? 'rgba(99, 102, 241, 0.1)' : c.isAdmin ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid ' + (isSys ? 'rgba(99, 102, 241, 0.25)' : c.isAdmin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)'),
                                      borderRadius: '8px',
                                      padding: '10px 14px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '4px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                      <strong style={{ color: isSys ? '#a5b4fc' : c.isAdmin ? '#f87171' : '#60a5fa' }}>
                                        {c.authorName || 'Staff'} {isSys ? '(Automated)' : c.isAdmin ? '(Admin)' : ''}
                                      </strong>
                                      <span style={{ color: '#94a3b8' }}>{c.timestamp ? new Date(c.timestamp).toLocaleString() : ''}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-main)' }}>{c.text}</p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Admin Reply Form */}
                        {ticket.status !== 'Closed' && (
                          <form onSubmit={(e) => handleAdminTicketReply(e, ticket.id)} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input
                              type="text"
                              value={adminTicketReplies[ticket.id] || ''}
                              onChange={e => setAdminTicketReplies(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              placeholder="Write admin reply..."
                              className="input-field"
                              style={{ flex: 1 }}
                            />
                            <button 
                              type="submit" 
                              className="btn-primary" 
                              disabled={!(adminTicketReplies[ticket.id] || '').trim()}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                              <Send size={15} /> Send Reply
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                <label style={styles.label}>Action Level *</label>
                <select value={infType} onChange={e => {
                  const val = e.target.value;
                  setInfType(val);
                  if (val.includes('C4B')) {
                    setInfDetentionTime('14:55 - 15:35');
                  } else if (val.includes('C4A')) {
                    setInfDetentionTime('14:55 - 15:15');
                  }
                }} className="input-field">
                  <option value="C1 Warning">C1 - Warning</option>
                  <option value="C2 Warning">C2 - Warning</option>
                  <option value="C3 Informal Sanction">C3 - Informal Sanction</option>
                  <option value="C4A - Infraction + 20m Detention">C4A - Infraction + 20 minute Detention</option>
                  <option value="C4B - 40m Detention">C4B - 40 minute Detention</option>
                  <option value="C5 Suspension">C5 - Suspension (2 Days)</option>
                </select>
              </div>

              {infType.startsWith('C4') && (
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <Clock size={16} />
                    <span>Detention Schedule & Location</span>
                  </div>
                  <div style={styles.inputWrapper}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={styles.label}>Location on C4 (Replaces "Hall") *</label>
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: '600' }}>Editable</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 6px 0' }}>
                      Controls the location displayed on the C4 sanction (e.g. C4A (Location) / C4B (Location))
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {['Hall', 'Training Room A', 'Staff Briefing Room', 'Executive Office', 'Flight Deck'].map(loc => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setInfDetentionLocation(loc)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            border: '1px solid',
                            borderColor: infDetentionLocation === loc ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                            background: infDetentionLocation === loc ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: infDetentionLocation === loc ? '#f59e0b' : '#d1d5db',
                            cursor: 'pointer'
                          }}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      required
                      value={infDetentionLocation}
                      onChange={e => setInfDetentionLocation(e.target.value)}
                      placeholder="e.g. Hall, Training Room A, Office"
                      className="input-field"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={styles.inputWrapper}>
                      <label style={styles.label}>Scheduled Date *</label>
                      <input
                        type="date"
                        required
                        value={infDetentionDate}
                        onChange={e => setInfDetentionDate(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div style={styles.inputWrapper}>
                      <label style={styles.label}>Time Slot</label>
                      <input
                        type="text"
                        value={infDetentionTime}
                        onChange={e => setInfDetentionTime(e.target.value)}
                        placeholder="e.g. 14:55 - 15:15"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Reason Category</label>
                <select value={infCategory} onChange={e => setInfCategory(e.target.value)} className="input-field">
                  <option value="Behavior">Behavior</option>
                  <option value="Verbal assault">Verbal assault</option>
                  <option value="Refusing a reasonable request">Refusing a reasonable request</option>
                  <option value="Absence">Absence</option>
                  <option value="Other">Other</option>
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

      {/* Modal: Consequence Logged Summary UI for Admin */}
      <ConsequenceLoggedModal
        isOpen={showLoggedSummaryModal}
        onClose={() => setShowLoggedSummaryModal(false)}
        targetUser={loggedSummaryData?.targetUser}
        targetEmail={loggedSummaryData?.targetEmail}
        loggedConsequence={loggedSummaryData?.loggedConsequence}
        stats={loggedSummaryData?.stats}
        onViewAll={() => setActiveSubTab('infractions')}
      />

      {/* Reschedule Detention Modal */}
      {rescheduleModalItem && (
        <div style={styles.overlay}>
          <div className="glass-panel" style={{ ...styles.modal, width: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.2rem', margin: 0 }}>
                Reschedule Detention
              </h3>
              <button 
                type="button" 
                onClick={() => setRescheduleModalItem(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--color-text-main)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#9ca3af' }}>
              Staff: <strong>{rescheduleModalItem.staffName}</strong> ({rescheduleModalItem.type})
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!rescheduleNewDate) return alert('Please enter a date.');
                rescheduleDetention(rescheduleModalItem.id, rescheduleNewDate, rescheduleNewTime, rescheduleNewLocation);
                setRescheduleModalItem(null);
                displaySuccess('Detention rescheduled successfully.');
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={styles.inputWrapper}>
                <label style={styles.label}>New Detention Date *</label>
                <input
                  type="date"
                  required
                  value={rescheduleNewDate}
                  onChange={e => setRescheduleNewDate(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Detention Time Slot *</label>
                <input
                  type="text"
                  required
                  value={rescheduleNewTime}
                  onChange={e => setRescheduleNewTime(e.target.value)}
                  placeholder="e.g. 14:55 - 15:35"
                  className="input-field"
                />
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Detention Location *</label>
                <input
                  type="text"
                  required
                  value={rescheduleNewLocation}
                  onChange={e => setRescheduleNewLocation(e.target.value)}
                  placeholder="e.g. Hall, Training Room"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleModalItem(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px' }}
                >
                  Confirm Reschedule
                </button>
              </div>
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
