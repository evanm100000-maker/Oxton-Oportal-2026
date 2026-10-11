import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, ClipboardList, Calendar, FileText, 
  AlertTriangle, Slash, Settings, LogOut, ArrowLeft, User, Trophy, Medal, Award, MessageSquare, Eye,
  Activity, CheckSquare, LifeBuoy, BarChart2, Megaphone, Bell, Battery, BatteryCharging, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Clock
} from 'lucide-react';

// Subcomponents (we will create these next)
import Announcements from './Announcements';
import AllocationRequests from './AllocationRequests';
import Performance from './Performance';
import Tasks from './Tasks';
import SupportTickets from './SupportTickets';
import Analytics from './Analytics';
import FlightLogs from './FlightLogs';
import LeaveOfAbsence from './LeaveOfAbsence';
import Documents from './Documents';
import Reports from './Reports';
import Infractions from './Infractions';
import AdminPanel from './AdminPanel';
import Leaderboard from './Leaderboard';
import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';
import StaffChat from './StaffChat';
import AllStaff from './AllStaff';
import Events from './Events';
import Meetings from './Meetings';
import CalendarPage from './CalendarPage';
import { formatCustomLongDate } from '../utils/timeUtils';

const tabToPath = {
  home: '/',
  calendar: '/calendar',
  announcements: '/announcements',
  events: '/events',
  meetings: '/meetings',
  performance: '/performance',
  tasks: '/tasks',
  tickets: '/tickets',
  staffChat: '/staff-chat',
  leaderboard: '/leaderboard',
  allStaff: '/all-staff',
  reports: '/reports',
  logs: '/logs',
  allocation: '/allocation-requests',
  loa: '/loa',
  documents: '/documents',
  analytics: '/analytics',
  infractions: '/infractions',
  admin: '/admin'
};
const pathToTab = Object.fromEntries(Object.entries(tabToPath).map(([k, v]) => [v, k]));

export default function Dashboard() {
  const { currentUser, logout, chatMessages, infractions, flights, pageConfig, superAdminEmail, tasks, announcements, documents, reports, showClockBattery, use24HourClock, useLongDateFormat } = useApp();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam) return tabParam;
    
    const currentPath = window.location.pathname;
    if (pathToTab[currentPath]) {
      return pathToTab[currentPath];
    }
    
    return sessionStorage.getItem('oxton_activeTab') || 'home';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [lastReadChatCount, setLastReadChatCount] = useState(0);
  const [lastReadFlightCount, setLastReadFlightCount] = useState(0);
  const [lastReadAnnouncementsCount, setLastReadAnnouncementsCount] = useState(0);
  const [lastReadDocumentsCount, setLastReadDocumentsCount] = useState(0);
  const [lastReadReportsCount, setLastReadReportsCount] = useState(0);
  const [reviewedInfractionIds, setReviewedInfractionIds] = useState([]);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isCharging, setIsCharging] = useState(false);
  const [hasBattery, setHasBattery] = useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        const checkBattery = () => {
          // If level is 1 (100%), charging is true, chargingTime is 0, dischargingTime is Infinity
          // It's likely a desktop PC without a real battery (or a fully charged laptop on AC).
          const isDesktopFake = battery.charging && battery.chargingTime === 0 && battery.dischargingTime === Infinity && battery.level === 1;
          setHasBattery(!isDesktopFake);
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        checkBattery();
        battery.addEventListener('levelchange', checkBattery);
        battery.addEventListener('chargingchange', checkBattery);
      }).catch(() => {
        setHasBattery(false);
      });
    }
  }, []);

  React.useEffect(() => {
    if (currentUser?.email) {
      try {
        const chatRead = localStorage.getItem(`oxton_chat_read_${currentUser.email}`);
        if (chatRead !== null) setLastReadChatCount(parseInt(chatRead, 10) || 0);

        const flightRead = localStorage.getItem(`oxton_flight_read_${currentUser.email}`);
        if (flightRead !== null) setLastReadFlightCount(parseInt(flightRead, 10) || 0);

        const annRead = localStorage.getItem(`oxton_ann_read_${currentUser.email}`);
        if (annRead !== null) setLastReadAnnouncementsCount(parseInt(annRead, 10) || 0);

        const docRead = localStorage.getItem(`oxton_doc_read_${currentUser.email}`);
        if (docRead !== null) setLastReadDocumentsCount(parseInt(docRead, 10) || 0);

        const reportRead = localStorage.getItem(`oxton_report_read_${currentUser.email}`);
        if (reportRead !== null) setLastReadReportsCount(parseInt(reportRead, 10) || 0);

        const infractionsRead = localStorage.getItem(`oxton_infraction_reviewed_${currentUser.email}`);
        if (infractionsRead !== null) {
          try {
            const parsed = JSON.parse(infractionsRead);
            if (Array.isArray(parsed)) setReviewedInfractionIds(parsed);
          } catch (e) {
            console.error('Failed to parse reviewed infractions', e);
          }
        }
      } catch (e) {
        console.error('Failed to access localStorage', e);
      }
    }
  }, [currentUser?.email]);

  // Update read count when opening the chat
  React.useEffect(() => {
    if (activeTab === 'staffChat') {
      const chatLen = Array.isArray(chatMessages) ? chatMessages.length : 0;
      setLastReadChatCount(chatLen);
      localStorage.setItem(`oxton_chat_read_${currentUser.email}`, chatLen);
    }
    if (activeTab === 'allocation') {
      const flightLen = Array.isArray(flights) ? flights.length : 0;
      setLastReadFlightCount(flightLen);
      localStorage.setItem(`oxton_flight_read_${currentUser.email}`, flightLen);
    }
    if (activeTab === 'announcements') {
      const annLen = Array.isArray(announcements) ? announcements.length : 0;
      setLastReadAnnouncementsCount(annLen);
      localStorage.setItem(`oxton_ann_read_${currentUser.email}`, annLen);
    }
    if (activeTab === 'documents') {
      const docLen = Array.isArray(documents) ? documents.length : 0;
      setLastReadDocumentsCount(docLen);
      localStorage.setItem(`oxton_doc_read_${currentUser.email}`, docLen);
    }
    if (activeTab === 'reports') {
      const repLen = Array.isArray(reports) ? reports.length : 0;
      setLastReadReportsCount(repLen);
      localStorage.setItem(`oxton_report_read_${currentUser.email}`, repLen);
    }
  }, [activeTab, chatMessages, flights, announcements, documents, reports, currentUser.email]);

  React.useEffect(() => {
    sessionStorage.setItem('oxton_activeTab', activeTab);
    window.scrollTo(0, 0);
    
    const newPath = tabToPath[activeTab] || '/';
    if (window.location.pathname !== newPath) {
      const url = new URL(window.location.href);
      url.pathname = newPath;
      if (activeTab !== 'allocation') {
         url.searchParams.delete('flightId');
         url.searchParams.delete('tab');
      }
      window.history.pushState({}, '', url.toString());
    }
  }, [activeTab]);

  React.useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (pathToTab[currentPath]) {
        setActiveTab(pathToTab[currentPath]);
      } else {
        setActiveTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const safeChatMessages = Array.isArray(chatMessages) ? chatMessages : [];
  const unreadChatCount = Math.max(0, safeChatMessages.length - lastReadChatCount);
  const unreadFlightCount = Math.max(0, (Array.isArray(flights) ? flights.length : 0) - lastReadFlightCount);
  const unreadAnnouncementsCount = Math.max(0, (Array.isArray(announcements) ? announcements.length : 0) - lastReadAnnouncementsCount);
  const unreadDocumentsCount = Math.max(0, (Array.isArray(documents) ? documents.length : 0) - lastReadDocumentsCount);
  const unreadReportsCount = Math.max(0, (Array.isArray(reports) ? reports.length : 0) - lastReadReportsCount);
  const myInfractions = React.useMemo(
    () => infractions.filter(inf => inf.staffEmail === currentUser.email),
    [infractions, currentUser.email]
  );
  const unreadInfractions = myInfractions.filter(inf => !reviewedInfractionIds.includes(inf.id));

  const myTasks = React.useMemo(
    () => (tasks || []).filter(t => t.assignedToEmail === currentUser.email && t.status !== 'Completed'),
    [tasks, currentUser.email]
  );
  const pendingTasksCount = myTasks.length;

  const markInfractionsReviewed = React.useCallback(() => {
    const reviewedIds = Array.from(new Set([
      ...reviewedInfractionIds,
      ...myInfractions.map(inf => inf.id)
    ]));
    setReviewedInfractionIds(reviewedIds);
    localStorage.setItem(`oxton_infraction_reviewed_${currentUser.email}`, JSON.stringify(reviewedIds));
  }, [currentUser.email, myInfractions, reviewedInfractionIds]);

  const reviewInfractions = () => {
    markInfractionsReviewed();
    setActiveTab('infractions');
  };

  const navItems = [
    // Row 1: Personal & Daily Use
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'View the latest news and updates from the administration.',
      icon: Megaphone,
      color: '#8b5cf6',
      component: Announcements,
      badgeCount: unreadAnnouncementsCount
    },
    {
      id: 'events',
      title: 'Upcoming Events',
      description: 'View scheduled events and meetings.',
      icon: Calendar,
      color: '#10b981',
      component: Events
    },
    {
      id: 'meetings',
      title: 'Upcoming Meetings',
      description: 'View scheduled meetings and receive reminders.',
      icon: Calendar,
      color: '#60a5fa',
      component: Meetings
    },
    {
      id: 'performance',
      title: 'My Performance',
      description: 'View your activity, logs, badges, and overall performance.',
      icon: Activity,
      color: '#ec4899',
      component: Performance
    },
    {
      id: 'tasks',
      title: 'Tasks & Assignments',
      description: 'Manage and complete tasks assigned by administrators.',
      icon: CheckSquare,
      color: '#14b8a6',
      component: Tasks,
      badgeCount: pendingTasksCount
    },
    {
      id: 'tickets',
      title: 'Support Tickets',
      description: 'Open a ticket for private support and communication with admins.',
      icon: LifeBuoy,
      color: '#f43f5e',
      component: SupportTickets
    },
    
    // Row 2
    {
      id: 'staffChat',
      title: 'Messages',
      description: 'Communicate with staff and security in real-time.',
      icon: MessageSquare,
      color: '#10b981',
      component: StaffChat,
      badgeCount: unreadChatCount
    },
    {
      id: 'leaderboard',
      title: 'Staff of the Week',
      description: 'View the top performing staff based on approved flights.',
      icon: Trophy,
      color: '#f59e0b',
      component: Leaderboard
    },
    {
      id: 'allStaff',
      title: 'All Staff',
      description: 'View the complete staff roster and online presence.',
      icon: User,
      color: '#8b5cf6',
      component: AllStaff
    },
    {
      id: 'reports',
      title: 'Reports',
      description: 'Report rule-breaking players. Review admin actions.',
      icon: AlertTriangle,
      color: '#2563eb',
      component: Reports,
      badgeCount: unreadReportsCount
    },

    // Row 3
    {
      id: 'calendar',
      title: 'Calendar Overview',
      description: 'View upcoming flights, events, and meetings for the year.',
      icon: Calendar,
      color: '#f59e0b',
      component: CalendarPage
    },
    {
      id: 'logs',
      title: 'Flight Logs',
      description: 'Submit and inspect detailed flight operations reports.',
      icon: ClipboardList,
      color: '#3b82f6',
      component: FlightLogs
    },
    {
      id: 'allocation',
      title: 'Allocation Requests',
      description: 'View airport flight allocations and server connections.',
      icon: Plane,
      color: '#2563eb',
      component: AllocationRequests,
      badgeCount: unreadFlightCount
    },
    {
      id: 'loa',
      title: 'Leave of Absence Requests',
      description: 'Request time off and monitor administrative replies.',
      icon: Calendar,
      color: '#1d4ed8',
      component: LeaveOfAbsence
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Read operations manuals, protocols, and manuals.',
      icon: FileText,
      color: '#1e40af',
      component: Documents,
      badgeCount: unreadDocumentsCount
    },

    // Row 4
    ...(currentUser.isAdmin ? [{
      id: 'analytics',
      title: 'Analytics',
      description: 'View server-wide statistics, staff activity, and analytics.',
      icon: BarChart2,
      color: '#8b5cf6',
      component: Analytics
    }] : []),
    {
      id: 'infractions',
      title: 'My Consequences',
      description: 'Track disciplinary alerts and official performance marks.',
      icon: Slash,
      color: '#1e3a8a',
      component: Infractions,
      badgeCount: unreadInfractions.length
    }
  ];

  // Framer Motion Animation Settings
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.045,
        delayChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 20,
      opacity: 0,
    },
    show: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.2
      }
    }
  };

  const renderActiveComponent = () => {
    if (activeTab === 'admin') {
      if (pageConfig && !pageConfig.adminPanel && currentUser?.email !== superAdminEmail) {
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center'}}>
            <Slash size={48} color="#ef4444" style={{marginBottom: '20px'}} />
            <h2 style={{color: '#fff', fontSize: '1.5rem', marginBottom: '10px'}}>Temporarily Unavailable</h2>
            <p style={{color: '#94a3b8'}}>This page has been temporarily disabled by the administration.</p>
          </div>
        );
      }
      return <AdminPanel />;
    }
    const item = navItems.find(i => i.id === activeTab);
    if (item) {
      if (pageConfig && pageConfig[item.id] === false) {
        return (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', textAlign: 'center'}}>
            <Slash size={48} color="#ef4444" style={{marginBottom: '20px'}} />
            <h2 style={{color: '#fff', fontSize: '1.5rem', marginBottom: '10px'}}>Temporarily Unavailable</h2>
            <p style={{color: '#94a3b8'}}>This page has been temporarily disabled by the administration.</p>
          </div>
        );
      }
      const Component = item.component;
      return <Component />;
    }
    return null;
  };

  return (
    <div style={styles.appWrapper}>
      {/* Navbar */}
      <nav className="glass-panel dashboard-navbar" style={styles.navbar}>
        <div className="dashboard-nav-brand" style={styles.navBrand} onClick={() => setActiveTab('home')}>
          <img src="./logo.png" alt="Oxton Logo" style={styles.navLogo} />
          <span style={styles.navBrandText}>Oxton Oportal <span style={{ fontFamily: 'monospace', fontSize: '0.6em', color: '#60a5fa', fontWeight: 'bold', marginLeft: '4px' }}>BETA</span></span>
        </div>

        <div style={styles.navControls}>
          {currentUser.isAdmin && (
            <button
              onClick={() => setActiveTab(activeTab === 'admin' ? 'home' : 'admin')}
              className="btn-secondary"
              style={{
                ...styles.adminNavBtn,
                background: activeTab === 'admin' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                borderColor: activeTab === 'admin' ? '#06b6d4' : 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <Settings size={16} />
              <span>Admin Panel</span>
            </button>
          )}
          {/* InstallAppButton removed */}

          <div style={styles.profileBadge}>
            {currentUser.profilePicture ? (
              <img src={currentUser.profilePicture} alt="PFP" style={{width: 24, height: 24, borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
              <User size={14} color="#3b82f6" />
            )}
            <span style={styles.profileText}>
              {currentUser.firstName} ({currentUser.robloxUsername})
            </span>
            {currentUser.isAdmin && <span className="badge badge-admin">Admin</span>}
          </div>

          <button onClick={() => setIsNotificationsOpen(true)} className="btn-secondary" style={{...styles.logoutBtn, color: 'var(--color-text-main)'}}>
            <Bell size={16} />
          </button>

          <button onClick={() => setIsSettingsOpen(true)} className="btn-secondary" style={{...styles.logoutBtn, color: 'var(--color-text-main)'}}>
            <Settings size={16} />
          </button>
          
          <button onClick={logout} className="btn-secondary" style={styles.logoutBtn}>
            <LogOut size={16} />
          </button>
        </div>

        {showClockBattery && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-text-main)', fontSize: '0.95rem', fontWeight: '600', letterSpacing: '-0.2px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '12px', zIndex: 10, backdropFilter: 'blur(20px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} />
              <span>
                {useLongDateFormat 
                  ? formatCustomLongDate(currentTime)
                  : currentTime.toLocaleDateString()}
              </span>
              <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.2)' }} />
              <span>
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !use24HourClock })}
              </span>
            </div>
            {hasBattery && batteryLevel !== null && (
              <>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.2)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {(() => {
                    if (isCharging) return <BatteryCharging size={18} color="#10b981" />;
                    if (batteryLevel > 80) return <BatteryFull size={18} />;
                    if (batteryLevel > 40) return <BatteryMedium size={18} />;
                    if (batteryLevel > 15) return <BatteryLow size={18} />;
                    return <BatteryWarning size={18} color="#ef4444" />;
                  })()}
                  <span style={{ color: batteryLevel <= 20 && !isCharging ? "#ef4444" : "inherit" }}>{batteryLevel}%</span>
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      {unreadInfractions.length > 0 && activeTab !== 'infractions' && (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          style={styles.infractionAlert}
          className="glass-panel"
          role="alert"
        >
          <div style={styles.infractionAlertIcon}>
            <AlertTriangle size={22} color="var(--color-text-main)" />
          </div>
          <div style={styles.infractionAlertBody}>
            <span style={styles.infractionAlertKicker}>NEW INFRACTION</span>
            <strong style={styles.infractionAlertTitle}>
              {unreadInfractions.length === 1
                ? 'A new infraction has been added to your staff record.'
                : `${unreadInfractions.length} new infractions have been added to your staff record.`}
            </strong>
          </div>
          <button onClick={reviewInfractions} className="btn-danger" style={styles.infractionReviewBtn}>
            <Eye size={16} />
            <span>Review</span>
          </button>
        </motion.div>
      )}

      {/* Banner removed */}

      {/* Main Area */}
      <main className="dashboard-main-content" style={styles.mainContent}>
        <AnimatePresence mode="wait">
          {activeTab === 'home' ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={styles.homeContainer}
            >
            {/* Header Greeting */}
            <motion.div
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              style={styles.greetingHeader}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px', justifyContent: 'space-between' }}>
                <h1 style={{ ...styles.greetingText, marginBottom: 0 }}>
                  {(() => {
                    const hour = currentTime.getHours();
                    if (hour >= 6 && hour < 12) return 'Morning';
                    if (hour >= 12 && hour < 18) return 'Afternoon';
                    if (hour >= 18 && hour < 21) return 'Evening';
                    return 'Night';
                  })()}, {currentUser.firstName}!
                </h1>
              </div>
              <p style={{ ...styles.greetingSub, marginTop: '8px' }}>
                Welcome back. Use the cards below to view, log, and request staff actions.
              </p>
              
              {(currentUser.goldMedals > 0 || currentUser.silverMedals > 0 || currentUser.bronzeMedals > 0) && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '12px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', marginRight: '8px' }}>Star of the Week Medals:</div>
                  {currentUser.goldMedals > 0 && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><Trophy size={16}/> {currentUser.goldMedals}</span>}
                  {currentUser.silverMedals > 0 && <span style={{ color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><Medal size={16}/> {currentUser.silverMedals}</span>}
                  {currentUser.bronzeMedals > 0 && <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}><Award size={16}/> {currentUser.bronzeMedals}</span>}
                </div>
              )}
            </motion.div>

            <motion.div 
              key={`dashboard-card-grid-${activeTab}`}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={styles.cardGrid}
              className="dashboard-card-grid"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.015,
                      y: -3,
                      boxShadow: '0 12px 30px rgba(37, 99, 235, 0.2)',
                      borderColor: 'rgba(37, 99, 235, 0.4)'
                    }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => item.id === 'infractions' ? reviewInfractions() : setActiveTab(item.id)}
                    className="glass-panel interactive-card"
                    style={styles.menuCard}
                  >
                    <div style={{ ...styles.cardIconWrapper, backgroundColor: `${item.color}15`, position: 'relative' }}>
                      <Icon size={24} color={item.color} />
                      {item.badgeCount > 0 && (
                        <div style={styles.notificationBadge}>
                          {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </div>
                      )}
                    </div>
                    <div style={styles.cardInfo}>
                      <h2 style={styles.cardTitle}>{item.title}</h2>
                      <p style={styles.cardDescription}>{item.description}</p>
                    </div>
                  </motion.div>
                );
              })}

              {currentUser.isAdmin && (
                <motion.div
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.015,
                    y: -3,
                    boxShadow: '0 12px 30px rgba(6, 182, 212, 0.2)',
                    borderColor: 'rgba(6, 182, 212, 0.4)'
                  }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setActiveTab('admin')}
                  className="glass-panel interactive-card"
                  style={{ ...styles.menuCard, border: '1px dashed rgba(6, 182, 212, 0.3)' }}
                >
                  <div style={{ ...styles.cardIconWrapper, backgroundColor: 'rgba(6, 182, 212, 0.15)' }}>
                    <Settings size={24} color="#06b6d4" />
                  </div>
                  <div style={styles.cardInfo}>
                    <h2 style={{ ...styles.cardTitle, color: '#22d3ee' }}>Admin Control Center</h2>
                    <p style={styles.cardDescription}>
                      Manage approvals, allocate staff schedules, review LOAs, post documents, and log infractions.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
          ) : (
          /* Sub-pages Container */
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div style={styles.backBar}>
              <button onClick={() => setActiveTab('home')} className="btn-secondary" style={styles.backBtn}>
                <ArrowLeft size={16} />
                <span>Return to Dashboard</span>
              </button>
              <div style={styles.pageTitleContainer}>
                <h2 style={styles.pageTitle}>
                  {activeTab === 'admin' ? 'Admin Control Center' : navItems.find(i => i.id === activeTab)?.title}
                </h2>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={styles.pageCard}
              className="glass-panel"
            >
              {renderActiveComponent()}
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
}

const styles = {
  appWrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    margin: '16px auto',
    width: 'calc(100% - 32px)',
    maxWidth: '1200px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
  },
  navLogo: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    objectFit: 'contain',
  },
  navBrandText: {
    fontWeight: '700',
    fontSize: '1.25rem',
    letterSpacing: '-0.3px',
    color: 'var(--color-text-main)',
  },
  navControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  adminNavBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  profileText: {
    fontWeight: '500',
    color: '#e5e7eb',
  },
  logoutBtn: {
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#ef4444',
  },
  mainContent: {
    flex: 1,
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px 40px 16px',
  },
  infractionAlert: {
    width: 'calc(100% - 32px)',
    maxWidth: '1200px',
    margin: '0 auto 18px auto',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.78), rgba(15, 23, 42, 0.86))',
    boxShadow: '0 18px 44px rgba(239, 68, 68, 0.2)',
  },
  infractionAlertIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: '#ef4444',
    boxShadow: '0 0 0 6px rgba(239, 68, 68, 0.16)',
  },
  infractionAlertBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    flex: 1,
  },
  infractionAlertKicker: {
    color: '#fecaca',
    fontSize: '0.78rem',
    fontWeight: '900',
    letterSpacing: '0',
  },
  infractionAlertTitle: {
    color: 'var(--color-text-main)',
    fontSize: '0.98rem',
    lineHeight: 1.35,
  },
  infractionReviewBtn: {
    padding: '10px 14px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  homeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    perspective: '1000px', // Enhances 3D card rotation during slam
  },
  greetingHeader: {
    marginTop: '24px',
  },
  greetingText: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    letterSpacing: '-0.5px',
  },
  greetingSub: {
    fontSize: '1.05rem',
    color: '#9ca3af',
    marginTop: '4px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
    transformStyle: 'preserve-3d',
  },
  menuCard: {
    padding: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '18px',
    borderRadius: '16px',
  },
  cardIconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  },
  cardDescription: {
    fontSize: '0.85rem',
    color: '#9ca3af',
    lineHeight: '1.4',
  },
  backBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    marginTop: '20px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '0.85rem',
  },
  pageTitleContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
  },
  pageCard: {
    padding: '32px',
    minHeight: '400px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    background: '#ef4444',
    color: 'var(--color-text-main)',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '10px',
    border: '2px solid var(--color-bg-deep)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  }
};
