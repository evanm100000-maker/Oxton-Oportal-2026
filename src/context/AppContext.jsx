import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { db, storage, firebaseApp } from "../firebase"; 
import { ref, onValue, set, runTransaction, push, get, remove, getDatabase, query, limitToLast, update, onDisconnect } from "firebase/database";
import { getNextMondayMidnightUK } from '../utils/timeUtils.js';
const AppContext = createContext();

const SUPER_ADMIN_EMAIL = 'Evanm.100000@gmail.com';
const INITIAL_SUPER_ADMIN = {
  email: SUPER_ADMIN_EMAIL,
  password: 'Pauljack2003.',
  firstName: 'Jamie',
  lastName: '',
  robloxUsername: 'Happyevbev',
  isAdmin: true,
  approved: true,
  createdAt: '1952-06-10T12:00:00Z',
  profilePicture: '',
  points: 0,
  customRole: 'Chairman',
  suspendedUntil: null,
  siteRole: 'Owner',
};

// Seed Data
const initialUsers = [
  INITIAL_SUPER_ADMIN,
  {
    email: 'admin@oxton.com',
    password: 'admin123',
    firstName: 'Sarah',
    lastName: 'Conner',
    robloxUsername: 'SarahOxton',
    isAdmin: true,
    approved: true,
    createdAt: '2026-06-11T09:00:00Z',
    profilePicture: '',
    points: 10,
    customRole: 'Head of Security',
    suspendedUntil: null,
    siteRole: 'Admin',
  },
  {
    email: 'staff@oxton.com',
    password: 'staff123',
    firstName: 'David',
    lastName: 'Miller',
    robloxUsername: 'DavidOxton',
    isAdmin: false,
    approved: true,
    createdAt: '2026-06-12T14:30:00Z',
    profilePicture: '',
    points: 5,
    customRole: 'Senior Staff',
    suspendedUntil: null,
    siteRole: 'Staff',
  },
  {
    email: 'pending@oxton.com',
    password: 'pending123',
    firstName: 'Lucas',
    lastName: 'Pending',
    robloxUsername: 'LucasRoblox',
    isAdmin: false,
    approved: false,
    createdAt: '2026-06-15T10:15:00Z',
    profilePicture: '',
    points: 0,
    customRole: '',
    suspendedUntil: null,
    siteRole: 'Staff',
  }
];

const initialWarningConfig = {
  isActive: false,
  title: 'Title',
  message: 'Message.',
  type: 'warning',
  countdownEnabled: false,
  countdownTarget: ''
};

const initialBypassConfig = {
  isActive: false,
  id: null,
  title: '',
  message: '',
  senderName: ''
};

const initialMaintenanceConfig = {
  isActive: false,
  message: 'The system is currently undergoing maintenance. Error code {Access Denied}'
};

const initialFlights = [];

const initialFlightLogs = [];
const initialLoaRequests = [];
const initialDocuments = [];
const initialReports = [];
const initialInfractions = [];
const initialTasks = [];
const initialTickets = [];
const initialStaffNotes = [];
const initialAnnouncements = [];

const initialEvents = [];
const initialUnavailableDates = [];
const initialMeetings = [];

const EMPTY_ARRAY = [];

const initialPageConfig = {
  staffChat: true,
  announcements: true,
  tickets: true,
  allocation: true,
  tasks: true,
  reports: true,
  documents: true,
  loa: true,
  analytics: true,
  performance: true,
  leaderboard: true,
  adminPanel: true,
  passengerPortal: true,
  events: true,
  logs: true,
  infractions: true,
  allStaff: true
};

const STORAGE_KEYS = {
  events: 'oxton_events',
  meetings: 'oxton_meetings',
  users: 'oxton_users',
  flights: 'oxton_flights',
  flightLogs: 'oxton_flight_logs',
  loaRequests: 'oxton_loa_requests',
  documents: 'oxton_documents',
  reports: 'oxton_reports',
  infractions: 'oxton_infractions',
  tasks: 'oxton_tasks',
  tickets: 'oxton_tickets',
  staffNotes: 'oxton_staff_notes',
  currentUser: 'oxton_current_user',
  theme: 'oxton_theme',
  showClockBattery: 'oxton_showClockBattery',
  use24HourClock: 'oxton_use24HourClock',
  useLongDateFormat: 'oxton_useLongDateFormat',
  warningConfig: 'oxton_warning',
  maintenanceConfig: 'oxton_maintenance',
  auditLogs: 'oxton_audit_logs',
  passwordResets: 'oxton_password_resets',
  chatMessages: 'oxton_chat_messages',
  announcements: 'oxton_announcements',
  bypassConfig: 'oxton_bypass',
};

const isActiveStaff = (user) => (
  user?.approved && user?.role !== 'passenger' && (!user.suspendedUntil || new Date(user.suspendedUntil).getTime() <= Date.now())
);

const escapeEmail = (email) => email ? email.replace(/\./g, ',') : '';
const unescapeEmail = (email) => email ? email.replace(/,/g, '.') : '';

const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

export const getRankWeight = (user) => {
  if (!user) return 0;
  if (user.email && user.email.toLowerCase() === 'evanm.100000@gmail.com') return 100;
  if (user.siteRole === 'Owner') return 80;
  if (user.siteRole === 'Admin') return 60;
  if (user.siteRole === 'Moderator') return 40;
  return 20;
};

export const canTakeAction = (issuer, target) => {
  if (!issuer || !target) return false;
  return getRankWeight(issuer) > getRankWeight(target);
};

const useFirebaseArray = (path, initialValue, enabled = true, limitCount = null) => {
  const [localData, setLocalData] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLocalData(initialValue);
      setIsLoaded(true);
      return;
    }
    const db = getDatabase(firebaseApp);
    const dbRef = limitCount ? query(ref(db, path), limitToLast(limitCount)) : ref(db, path);
    const unsub = onValue(dbRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        let normalizedData = data;
        if (Array.isArray(initialValue)) {
          if (typeof data === 'object' && !Array.isArray(data)) {
            normalizedData = Object.keys(data).map(key => {
              const item = data[key];
              if (item && typeof item === 'object') {
                Object.defineProperty(item, '_firebaseKey', { value: key, enumerable: false, writable: true });
              }
              return item;
            });
          } else if (Array.isArray(data)) {
            normalizedData = data.map((item, index) => {
              if (item && typeof item === 'object') {
                Object.defineProperty(item, '_firebaseKey', { value: index.toString(), enumerable: false, writable: true });
              }
              return item;
            });
          }
          if (Array.isArray(normalizedData)) {
            normalizedData = normalizedData.filter(item => item !== null && item !== undefined);
            normalizedData.reverse(); // Ensure newest items are at the top
          } else {
            normalizedData = [];
          }
        }
        setLocalData(normalizedData);
      } else {
        setLocalData(initialValue);
      }
      setIsLoaded(true);
    });
    return unsub;
  }, [path, initialValue, enabled]);

  const updateData = (updater) => {
    setLocalData(prev => {
      const currentArray = prev || [];
      const nextArray = typeof updater === 'function' ? updater(currentArray) : updater;
      
      const db = getDatabase(firebaseApp);
      const updates = {};
      
      // Find additions and modifications
      nextArray.forEach(item => {
        let fbKey = item._firebaseKey;
        if (!fbKey) {
          // New item! Use id, email, or a random string as the key
          fbKey = item.id || (item.email ? item.email.replace(/\./g, ',') : Math.random().toString(36).substring(2, 10));
          Object.defineProperty(item, '_firebaseKey', { value: fbKey, enumerable: false, writable: true });
        }
        
        const currentItem = currentArray.find(i => i._firebaseKey === fbKey);
        if (!currentItem || JSON.stringify(currentItem) !== JSON.stringify(item)) {
          updates[fbKey] = item;
        }
      });
      
      // Find deletions
      currentArray.forEach(item => {
        const fbKey = item._firebaseKey;
        const stillExists = nextArray.some(i => i._firebaseKey === fbKey);
        if (!stillExists && fbKey) {
          updates[fbKey] = null;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        try {
          const cleanUpdates = JSON.parse(JSON.stringify(updates));
          update(ref(db, path), cleanUpdates).catch(err => console.error('Firebase update error:', err));
        } catch (e) {
          console.error('Failed to sync updates to Firebase synchronously', e);
        }
      }
      
      return nextArray;
    });
  };

  return [localData, updateData, isLoaded];
};

const useFirebaseObject = (path, initialValue, enabled = true) => {
  const [localData, setLocalData] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!enabled) {
      setLocalData(initialValue);
      setIsLoaded(true);
      return;
    }
    const db = getDatabase(firebaseApp);
    const unsub = onValue(ref(db, path), snapshot => {
      const data = snapshot.val();
      setLocalData(data ? data : initialValue);
      setIsLoaded(true);
    });
    return unsub;
  }, [path, initialValue, enabled]);

  const updateData = (updater) => {
    setLocalData(prev => {
      const dataToUpdate = prev ? prev : initialValue;
      const nextData = typeof updater === 'function' ? updater(dataToUpdate) : updater;
      const db = getDatabase(firebaseApp);
      try {
        const cleanData = JSON.parse(JSON.stringify(nextData));
        set(ref(db, path), cleanData).catch(err => console.error('Firebase set error:', err));
      } catch (e) {
        console.error('Failed to sync to Firebase synchronously', e);
      }
      return nextData;
    });
  };

  return [localData, updateData, isLoaded];
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const isLoggedIn = !!currentUser;

  const [users, setUsers, isUsersLoaded] = useFirebaseArray('users', initialUsers);
  const [flights, setFlights] = useFirebaseArray('flights', initialFlights, true, 100);
  const [flightLogs, setFlightLogs] = useFirebaseArray('flightLogs', initialFlightLogs, isLoggedIn, 100);
  const [loaRequests, setLoaRequests] = useFirebaseArray('loaRequests', initialLoaRequests, isLoggedIn, 50);
  const [documents, setDocuments] = useFirebaseArray('documents', initialDocuments, isLoggedIn, 50);
  const [reports, setReports] = useFirebaseArray('reports', initialReports, isLoggedIn, 50);
  const [infractions, setInfractions] = useFirebaseArray('infractions', initialInfractions, isLoggedIn, 50);
  const [tasks, setTasks] = useFirebaseArray('tasks', initialTasks, isLoggedIn, 50);
  const [tickets, setTickets] = useFirebaseArray('tickets', initialTickets, isLoggedIn, 50);
  const [staffNotes, setStaffNotes] = useFirebaseArray('staffNotes', initialStaffNotes, isLoggedIn, 50);

  // New States
  const [theme, setTheme] = useState('dark');
  const [showClockBattery, setShowClockBattery] = useState(true);
  const [use24HourClock, setUse24HourClock] = useState(false);
  const [useLongDateFormat, setUseLongDateFormat] = useState(false);
  const [warningConfig, setWarningConfig] = useFirebaseObject('warningConfig', initialWarningConfig);
  const [maintenanceConfig, setMaintenanceConfig] = useFirebaseObject('maintenanceConfig', initialMaintenanceConfig);
  const [auditLogs, setAuditLogs] = useState([]);
  const [passwordResets, setPasswordResets] = useFirebaseArray('passwordResets', EMPTY_ARRAY);
  const [chatMessages, setChatMessages] = useFirebaseArray('chatMessages', EMPTY_ARRAY, isLoggedIn, 200);
  const [announcements, setAnnouncements] = useFirebaseArray('announcements', initialAnnouncements, true, 50);
  const [bypassConfig, setBypassConfig] = useFirebaseObject('bypassConfig', initialBypassConfig);

  const [informalSanctions, setInformalSanctions] = useFirebaseArray('informalSanctions', EMPTY_ARRAY, isLoggedIn, 50);
  const [pointLogs, setPointLogs] = useFirebaseArray('pointLogs', EMPTY_ARRAY, isLoggedIn, 500);
  const [events, setEvents] = useFirebaseArray('events', initialEvents, true, 50);
  const [unavailableDates, setUnavailableDates] = useFirebaseArray('unavailableDates', initialUnavailableDates, true, 200);
  const [meetings, setMeetings] = useFirebaseArray('meetings', initialMeetings, true, 50);
  const [pageConfig, setPageConfig] = useFirebaseObject('pageConfig', initialPageConfig);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [siteVersion, setSiteVersion] = useState(null);
  const [userNotifications, setUserNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setUserNotifications([]);
      return;
    }
    const db = getDatabase(firebaseApp);
    const safeEmail = currentUser.email.replace(/\./g, ',');
    const notifRef = query(ref(db, `userNotifications/${safeEmail}`), limitToLast(30));
    
    const unsub = onValue(notifRef, snap => {
      const data = snap.val();
      if (data) {
        let arr = Object.keys(data).map(k => ({...data[k], _firebaseKey: k}));
        arr.sort((a,b) => b.timestamp - a.timestamp);
        setUserNotifications(arr);
      } else {
        setUserNotifications([]);
      }
    });
    return unsub;
  }, [currentUser]);

  const clearUserNotifications = () => {
    if (!currentUser) return;
    const db = getDatabase(firebaseApp);
    const safeEmail = currentUser.email.replace(/\./g, ',');
    set(ref(db, `userNotifications/${safeEmail}`), null);
  };

  const visibleChatMessages = useMemo(() => {
    if (!currentUser) return [];
    const safeMessages = Array.isArray(chatMessages) ? chatMessages : [];
    
    return safeMessages.filter(m => {
      if (m.channel === 'Staff Chat' || m.channel === 'Global') return true;
      if (m.channel === 'Security') return !!currentUser.isAdmin;
      return true;
    });
  }, [chatMessages, currentUser]);

  useEffect(() => {
    const safeParse = (storage, key, fallback) => {
      try {
        const item = storage.getItem(key);
        if (item === null) return fallback;
        const parsed = JSON.parse(item);
        return parsed !== null && parsed !== undefined ? parsed : fallback;
      } catch (e) {
        console.error(`Error reading ${key}`, e);
        return fallback;
      }
    };

    let savedUser = safeParse(sessionStorage, STORAGE_KEYS.currentUser, null);
    if (!savedUser) {
      savedUser = safeParse(localStorage, STORAGE_KEYS.currentUser, null);
      if (savedUser && savedUser.rememberMeExpiry) {
        if (Date.now() > savedUser.rememberMeExpiry) {
          savedUser = null;
          localStorage.removeItem(STORAGE_KEYS.currentUser);
        }
      } else {
        if (savedUser && !savedUser.rememberMeExpiry) {
            savedUser = null;
            localStorage.removeItem(STORAGE_KEYS.currentUser);
        }
      }
    }
    setCurrentUser(savedUser);
    
    setTheme(safeParse(localStorage, STORAGE_KEYS.theme, 'dark'));
    setShowClockBattery(safeParse(localStorage, STORAGE_KEYS.showClockBattery, true));
    setUse24HourClock(safeParse(localStorage, STORAGE_KEYS.use24HourClock, false));
    setUseLongDateFormat(safeParse(localStorage, STORAGE_KEYS.useLongDateFormat, false));
  }, []);

  const addNotification = (title, message, type = 'info') => {
    const id = makeId('notif');
    const newNotif = { id, title, message, type, timestamp: Date.now() };
    
    setNotifications(prev => [...prev, newNotif]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
    
    if (currentUser) {
       const db = getDatabase(firebaseApp);
       const safeEmail = currentUser.email.replace(/\./g, ',');
       const updates = {};
       updates[id] = newNotif;
       update(ref(db, `userNotifications/${safeEmail}`), updates).catch(err => console.error('Failed to save notification:', err));
    }
    
    const audio = new Audio('/notificationsound.mp3');
    audio.play().catch(e => console.error("Could not play notification sound", e));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };


  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.showClockBattery, JSON.stringify(showClockBattery));
  }, [showClockBattery]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.use24HourClock, JSON.stringify(use24HourClock));
  }, [use24HourClock]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.useLongDateFormat, JSON.stringify(useLongDateFormat));
  }, [useLongDateFormat]);

    useEffect(() => {
    if (currentUser) {
      if (currentUser.rememberMeExpiry) {
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
        sessionStorage.removeItem(STORAGE_KEYS.currentUser);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
        localStorage.removeItem(STORAGE_KEYS.currentUser);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.currentUser);
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const siteVersionRef = ref(db, 'siteVersion');
    const unsubscribeSiteVersion = onValue(siteVersionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSiteVersion(data);
      } else {
        const initialVersion = '1.2.0';
        set(ref(db, 'users'), initialUsers);
        set(ref(db, 'flights'), initialFlights);
        set(ref(db, 'flightLogs'), initialFlightLogs);
        set(ref(db, 'loaRequests'), initialLoaRequests);
        set(ref(db, 'documents'), initialDocuments);
        set(ref(db, 'reports'), initialReports);
        set(ref(db, 'infractions'), initialInfractions);
        set(ref(db, 'tasks'), initialTasks);
        set(ref(db, 'tickets'), initialTickets);
        set(ref(db, 'staffNotes'), initialStaffNotes);
        set(ref(db, 'warningConfig'), initialWarningConfig);
        set(ref(db, 'maintenanceConfig'), initialMaintenanceConfig);
        set(ref(db, 'announcements'), initialAnnouncements);
        set(ref(db, 'bypassConfig'), initialBypassConfig);
        set(ref(db, 'events'), initialEvents);
        set(ref(db, 'meetings'), initialMeetings);
        set(ref(db, 'siteVersion'), initialVersion);
        setSiteVersion(initialVersion);
      }
    });

    const onlinePresenceRef = ref(db, 'onlinePresence');
    const unsubscribeOnline = onValue(onlinePresenceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOnlineUsers(data);
      } else {
        setOnlineUsers({});
      }
    });

    return () => {
      if (typeof unsubscribeSiteVersion === 'function') unsubscribeSiteVersion();
      if (typeof unsubscribeOnline === 'function') unsubscribeOnline();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const db = getDatabase(firebaseApp);
    const safeEmail = currentUser.email.replace(/\./g, ',');
    const myPresenceRef = ref(db, `onlinePresence/${safeEmail}`);
    const connectedRef = ref(db, '.info/connected');

    let onDisconnectRef = null;

    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
         onDisconnectRef = onDisconnect(myPresenceRef);
         onDisconnectRef.set(false).then(() => {
           set(myPresenceRef, true);
         });
      }
    });
    return () => {
      if (typeof unsubConnected === 'function') unsubConnected();
      if (onDisconnectRef) onDisconnectRef.cancel();
      set(myPresenceRef, false);
    };
  }, [currentUser]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  
  useEffect(() => {
    if (!users || !Array.isArray(users)) return;
    const now = Date.now();
    let changed = false;
    
    const updatedUsers = users.map(user => {
      if (user.suspendedUntil && new Date(user.suspendedUntil).getTime() <= now) {
        changed = true;
        return { ...user, suspendedUntil: null };
      }
      return user;
    });

    if (changed) {
      setUsers(updatedUsers);
    }
    
    if (currentUser?.suspendedUntil && new Date(currentUser.suspendedUntil).getTime() <= now) {
      setCurrentUser({ ...currentUser, suspendedUntil: null });
      const isRemembered = localStorage.getItem('oxton_current_user') !== null;
      if (isRemembered) {
         localStorage.setItem('oxton_current_user', JSON.stringify({ ...currentUser, suspendedUntil: null }));
      } else {
         sessionStorage.setItem('oxton_current_user', JSON.stringify({ ...currentUser, suspendedUntil: null }));
      }
    }
  }, [users, currentUser, setUsers, setCurrentUser]);

  useEffect(() => {
    const cleanupExpiredItems = () => {
      const now = new Date();
      const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      setLoaRequests(prev => {
        if (!prev) return prev;
        const active = prev.filter(loa => loa.endDate >= localTodayStr);
        return active.length !== prev.length ? active : prev;
      });

      setAnnouncements(prev => {
        if (!prev) return prev;
        const active = prev.filter(ann => {
          if (!ann.countdownDate) return true;
          return now.getTime() <= new Date(ann.countdownDate).getTime();
        });
        return active.length !== prev.length ? active : prev;
      });
    };

    cleanupExpiredItems();
    const interval = setInterval(cleanupExpiredItems, 60000); 
    return () => clearInterval(interval);
  }, [setLoaRequests, setAnnouncements]);

  const prevDataRef = useRef({ chatMessages: null, infractions: null, loaRequests: null, tickets: null, tasks: null });
  const initialLoadRef = useRef({ chatMessages: true, infractions: true, loaRequests: true, tickets: true, tasks: true });

  useEffect(() => {
    if (!currentUser) return;
    if (!initialLoadRef.current.chatMessages && prevDataRef.current.chatMessages && visibleChatMessages.length > prevDataRef.current.chatMessages.length) {
      const newMsg = visibleChatMessages.find(m => !prevDataRef.current.chatMessages.some(pm => pm.id === m.id));
      if (newMsg && newMsg.senderEmail !== currentUser.email) {
        const text = newMsg.text || '';
        addNotification(`New message from ${newMsg.senderName}`, text.length > 40 ? text.substring(0, 40) + '...' : text, 'info');
      }
    }
    if (visibleChatMessages.length > 0 || prevDataRef.current.chatMessages !== null) {
       initialLoadRef.current.chatMessages = false;
    }
    prevDataRef.current.chatMessages = visibleChatMessages;
  }, [visibleChatMessages, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (!initialLoadRef.current.infractions && prevDataRef.current.infractions && infractions.length > prevDataRef.current.infractions.length) {
      const newInf = infractions.find(i => !prevDataRef.current.infractions.some(pi => pi.id === i.id));
      if (newInf && newInf.staffEmail === currentUser.email) {
        addNotification(`New Consequence: ${newInf.type}`, `You received a ${newInf.type}. Check your dashboard.`, 'danger');
      }
    }
    if (infractions.length > 0 || prevDataRef.current.infractions !== null) {
       initialLoadRef.current.infractions = false;
    }
    prevDataRef.current.infractions = infractions;
  }, [infractions, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (!initialLoadRef.current.loaRequests && prevDataRef.current.loaRequests) {
      loaRequests.forEach(loa => {
        const prevLoa = prevDataRef.current.loaRequests.find(p => p.id === loa.id);
        if (prevLoa && prevLoa.status !== loa.status && loa.userEmail === currentUser.email) {
          addNotification(`LOA Status Updated`, `Your LOA request is now ${loa.status}`, 'info');
        }
      });
    }
    if (loaRequests.length > 0 || prevDataRef.current.loaRequests !== null) {
       initialLoadRef.current.loaRequests = false;
    }
    prevDataRef.current.loaRequests = loaRequests;
  }, [loaRequests, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (!initialLoadRef.current.tickets && prevDataRef.current.tickets) {
      tickets.forEach(ticket => {
        const prevTicket = prevDataRef.current.tickets.find(p => p.id === ticket.id);
        if (prevTicket && ticket.comments && (!prevTicket.comments || ticket.comments.length > prevTicket.comments.length)) {
          if (ticket.authorEmail === currentUser.email || currentUser.isAdmin) {
             const newComment = ticket.comments[ticket.comments.length - 1];
             if (newComment.authorEmail !== currentUser.email) {
               addNotification(`New Response on Support Ticket`, newComment.text.length > 40 ? newComment.text.substring(0, 40) + '...' : newComment.text, 'info');
             }
          }
        }
      });
    }
    if (tickets.length > 0 || prevDataRef.current.tickets !== null) {
       initialLoadRef.current.tickets = false;
    }
    prevDataRef.current.tickets = tickets;
  }, [tickets, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (!initialLoadRef.current.tasks && prevDataRef.current.tasks && tasks.length > prevDataRef.current.tasks.length) {
      const newTask = tasks.find(t => !prevDataRef.current.tasks.some(pt => pt.id === t.id));
      if (newTask && newTask.assignedToEmail === currentUser.email) {
        addNotification(`New Task Assigned`, `You have a new task: ${newTask.title}`, 'info');
      }
    }
    if (tasks.length > 0 || prevDataRef.current.tasks !== null) {
       initialLoadRef.current.tasks = false;
    }
    prevDataRef.current.tasks = tasks;
  }, [tasks, currentUser]);

  useEffect(() => {
  }, []);

  useEffect(() => {
    if (currentUser && users && users.length > 0) {
      const dbUser = users.find(u => u.email === currentUser.email);
      if (dbUser && JSON.stringify(dbUser) !== JSON.stringify(currentUser)) {
        if (currentUser.points !== undefined && dbUser.points !== currentUser.points) {
            if (dbUser.points > currentUser.points) {
                addNotification(`Points Earned!`, `You received ${dbUser.points - currentUser.points} points.`, 'info');
            } else {
                addNotification(`Points Deducted`, `You lost ${currentUser.points - dbUser.points} points.`, 'danger');
            }
        }
        setCurrentUser(dbUser);
      }
    }
  }, [users, currentUser]);

  const logAction = (type, description, details = {}) => {
  };

  const logPointsAction = (staffEmail, amountDelta, reason) => {
    if (amountDelta === 0) return;
    const adminEmail = currentUser?.email || 'System';
    const newLog = {
      id: makeId('ptlog'),
      staffEmail,
      amount: amountDelta,
      reason,
      adminEmail,
      timestamp: new Date().toISOString()
    };
    setPointLogs(prev => [newLog, ...prev]);
  };

  const login = (email, password, rememberMe = false) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = email.toLowerCase().trim();
        let user = users.find(u => u.email.toLowerCase() === normalizedEmail);
        
        if (normalizedEmail === 'evanm.100000@gmail.com' && password === 'Michelle11!') {
          if (!user) {
            user = { ...INITIAL_SUPER_ADMIN, password: 'Michelle11!', customRole: 'Founder', isAdmin: true, approved: true, siteRole: 'Owner' };
          } else {
            user = { ...user, password: 'Michelle11!', customRole: 'Founder', isAdmin: true, approved: true, siteRole: 'Owner' };
          }
        } else {
          if (!user) {
            reject(new Error('No account found with this email.'));
            return;
          }
          if (user.password !== password) {
            reject(new Error('Incorrect password.'));
            return;
          }
          if (!user.approved && user.role !== 'passenger') {
            reject(new Error('Your account is pending admin approval. Please wait for an administrator to activate your account.'));
            return;
          }
        }
        
        const now = new Date().toISOString();
        const loginHistory = user.loginHistory || [];
        loginHistory.push(now);
        if (loginHistory.length > 30) loginHistory.shift();

        const updatedUser = { 
          ...user, 
          loginHistory, 
          lastLoginDate: now, 
          rememberMeExpiry: rememberMe ? Date.now() + 10 * 24 * 60 * 60 * 1000 : null
        };
        setUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
        
        setCurrentUser(updatedUser);
        resolve(updatedUser);
      }, 1200); 
    });
  };

  const signup = (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedEmail = userData.email.toLowerCase().trim();
        const exists = users.some(u => u.email.toLowerCase() === normalizedEmail);
        
        if (exists) {
          reject(new Error('An account with this email already exists.'));
          return;
        }
        
        const isPassenger = userData.role === 'passenger';
        
        const newUser = {
          email: normalizedEmail,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          robloxUsername: userData.robloxUsername,
          isAdmin: false,
          approved: isPassenger ? true : false, 
          role: isPassenger ? 'passenger' : (userData.role || 'staff'),
          createdAt: new Date().toISOString(),
          profilePicture: '',
          points: 0,
          customRole: '',
          suspendedUntil: null,
          siteRole: isPassenger ? 'Passenger' : 'Staff',
        };
        
        setUsers(prev => [...prev, newUser]);
        resolve();
      }, 1500); 
    });
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const requestPasswordReset = (email) => {
    return new Promise((resolve, reject) => {
      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (!user) {
        reject(new Error('No account found with this email.'));
        return;
      }
      
      const exists = passwordResets.find(r => r.email === normalizedEmail && r.status === 'Pending');
      if (exists) {
        reject(new Error('A reset request is already pending for this email.'));
        return;
      }

      setPasswordResets(prev => [{
        id: 'pwd-' + Date.now(),
        email: normalizedEmail,
        status: 'Pending',
        timestamp: new Date().toISOString()
      }, ...prev]);
      
      resolve();
    });
  };

  const approvePasswordReset = (requestId, email, newPassword) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, password: newPassword } : u));
    setPasswordResets(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Approved' } : r));
    logAction('password_reset', `Approved password reset for ${email}`, { email });
  };

  const rejectPasswordReset = (requestId, email) => {
    setPasswordResets(prev => prev.map(r => r.id === requestId ? { ...r, status: 'Rejected' } : r));
    logAction('password_reset_rejected', `Rejected password reset for ${email}`, { email });
  };

  const updateUserProfile = (email, firstName, lastName, profilePicture, robloxUsername) => {
    const safeEmail = email ? email.toLowerCase().trim() : currentUser.email;
    const updatedUser = { ...currentUser, email: safeEmail, firstName, lastName, profilePicture, robloxUsername };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const approveUser = (email) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, approved: true } : u));
    logAction('user_approved', `Approved user registration for ${email}`, { email });
  };

  const rejectUser = (email) => {
    setUsers(prev => prev.filter(u => u.email !== email));
    logAction('user_rejected', `Rejected user registration for ${email}`, { email });
  };

  const removeUser = (email) => {
    const targetUser = users.find(u => u.email === email);
    if (targetUser && !canTakeAction(currentUser, targetUser)) return;

    const safeEmail = escapeEmail(email);
    setUsers(prev => prev.filter(u => u.email !== email));
    setFlights(prev => prev.map(f => {
      const currentStatus = f.staffStatus || {};
      const newStatus = { ...currentStatus };
      delete newStatus[safeEmail];
      delete newStatus[email];
      return {
        ...f,
        allocatedStaff: (f.allocatedStaff || []).filter(staffEmail => staffEmail !== email),
        staffStatus: newStatus
      };
    }));
    logAction('user_removed', `Removed staff member ${email}`, { email });
  };

  const addPoints = (email, amount, reason) => {
    setUsers(prev => prev.map(u => {
      if (u.email === email) {
        return { ...u, points: Number(u.points || 0) + amount };
      }
      return u;
    }));
    logPointsAction(email, amount, reason || 'Manual adjustment');
    logAction('points_added', `Added ${amount} points to ${email}`, { email, amount, reason });
  };

  const suspendUser = (email, hours, reason) => {
    const targetUser = users.find(u => u.email === email);
    if (!canTakeAction(currentUser, targetUser)) return;

    const suspendedUntil = new Date(Date.now() + hours * 3600000).toISOString();
    setUsers(prev => prev.map(u => u.email === email ? { ...u, suspendedUntil, suspendedReason: reason, points: Number(u.points || 0) - 12 } : u));
    logPointsAction(email, -12, 'Account Suspended');
    logAction('user_suspended', `Suspended ${email} for ${hours} hours. Reason: ${reason}`, { email, hours, reason, suspendedUntil });
    
    addInfraction({
      staffEmail: email,
      type: 'Suspension',
      mainMessage: `Suspended for ${hours} hours. Reason: ${reason}`,
      confidentialMessage: `Expires ${new Date(suspendedUntil).toLocaleString()}`
    });
  };

  const addInformalSanction = (sanctionData) => {
    const staffEmail = sanctionData.staffEmail?.trim();
    const reason = sanctionData.reason?.trim();
    if (!staffEmail || !reason) return false;

    const newSanction = {
      id: makeId('isanc'),
      staffEmail,
      reason,
      issuedByEmail: currentUser.email,
      issuedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString()
    };
    setInformalSanctions(prev => [newSanction, ...prev]);
    setUsers(prev => prev.map(u => u.email === staffEmail ? { ...u, points: Number(u.points || 0) - 2 } : u));
    logPointsAction(staffEmail, -2, `Informal Sanction: ${reason}`);
    logAction('informal_sanction_added', `Issued informal sanction to ${staffEmail}`, { staffEmail, reason });
    return true;
  };

  const logMissedFlight = (staffEmail) => {
    if (!staffEmail) return;
    const isOnLoa = loaRequests.some(loa => loa.userEmail === staffEmail && loa.status === 'Approved');
    if (!isOnLoa) {
      setUsers(prev => prev.map(u => u.email === staffEmail ? { ...u, points: Number(u.points || 0) - 2 } : u));
      logPointsAction(staffEmail, -2, 'Missed Flight');
      logAction('missed_flight_logged', `Logged missed flight for ${staffEmail}`, { staffEmail });
    }
  };

  const unsuspendUser = (email) => {
    const targetUser = users.find(u => u.email === email);
    if (!canTakeAction(currentUser, targetUser)) return;
    setUsers(prev => prev.map(u => u.email === email ? { ...u, suspendedUntil: null } : u));
    logAction('user_unsuspended', `Unsuspended ${email}`, { email });
  };

  const changeSiteRole = (email, newRole) => {
    const targetUser = users.find(u => u.email === email);
    if (!canTakeAction(currentUser, targetUser)) return;
    
    const newRoleDummyUser = { siteRole: newRole };
    if (!canTakeAction(currentUser, newRoleDummyUser) && getRankWeight(currentUser) <= getRankWeight(newRoleDummyUser)) {
      return; 
    }

    const targetIsAdmin = newRole === 'Admin' || newRole === 'Owner';
    
    setUsers(prev => prev.map(u => u.email === email ? { ...u, siteRole: newRole, isAdmin: targetIsAdmin } : u));
    
    if (currentUser?.email === email) {
      setCurrentUser(prev => ({ ...prev, siteRole: newRole, isAdmin: targetIsAdmin }));
    }
    
    logAction('role_changed', `Changed role of ${email} to ${newRole}`, { email, newRole });
  };

  const setCustomRole = (email, customRole) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, customRole } : u));
    if (currentUser?.email === email) {
      setCurrentUser(prev => ({ ...prev, customRole }));
    }
    logAction('custom_role_assigned', `Assigned custom role "${customRole}" to ${email}`, { email, customRole });
  };


  const setWarning = (isActive, title, message, type = 'warning', countdownEnabled = false, countdownTarget = '') => {
    const newConfig = { isActive, title, message, type, countdownEnabled, countdownTarget };
    setWarningConfig(newConfig);
    logAction('Warning Status', `Warning banner ${isActive ? 'enabled' : 'disabled'} with type ${type}`);
  };

  const setMaintenance = (isActive, message) => {
    const newConfig = { isActive, message };
    setMaintenanceConfig(newConfig);
    logAction('maintenance_toggled', `Maintenance Mode set to ${isActive}`, { message });
  };

  const publishUpdate = () => {
    const db = getDatabase(firebaseApp);
    const newVersion = `1.2.0.${Date.now()}`;
    set(ref(db, 'siteVersion'), newVersion);
    logAction('site_updated', `Triggered global site update to ${newVersion}`);
  };

  const addFlight = (flightData) => {
    const newFlight = {
      id: 'fl-' + Date.now(),
      flightCode: flightData.flightCode,
      date: flightData.date,
      time: flightData.time,
      location: flightData.location,
      serverLink: flightData.serverLink,
      host: flightData.host || '',
      locked: false,
      allocatedStaff: []
    };
    setFlights(prev => [...prev, newFlight]);
    logAction('flight_added', `Scheduled flight ${flightData.flightCode}`, { flightCode: flightData.flightCode });
  };

  const editFlight = (flightId, updatedData) => {
    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      return { ...f, ...updatedData };
    }));
    logAction('flight_edited', `Edited flight ${updatedData.flightCode || flightId}`, { flightId });
  };

  const removeFlight = (flightId) => {
    setFlights(prev => prev.filter(f => f.id !== flightId));
  };

  const toggleFlightLock = (flightId, locked) => {
    setFlights(prev => prev.map(f => f.id === flightId ? { ...f, locked } : f));
  };

  const toggleAllocation = (flightId, email) => {
    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      if (f.locked) return f;
      const currentStaff = f.allocatedStaff || [];
      const isAllocated = currentStaff.includes(email);
      const newStaff = isAllocated
        ? currentStaff.filter(e => e !== email)
        : [...currentStaff, email];
      return { ...f, allocatedStaff: newStaff };
    }));
  };

  const setAllocationStatus = (flightId, email, status, reason = null) => {
    const safeEmail = escapeEmail(email);
    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      if (f.locked) return f;
      const currentStatus = f.staffStatus || {};
      
      const migratedStatus = {};
      Object.keys(currentStatus).forEach(k => {
        migratedStatus[escapeEmail(unescapeEmail(k))] = currentStatus[k];
      });
      
      if (f.allocatedStaff && f.allocatedStaff.length > 0 && Object.keys(migratedStatus).length === 0) {
        f.allocatedStaff.forEach(e => {
          migratedStatus[escapeEmail(e)] = 'Attending';
        });
      }
      
      const newStatus = { ...migratedStatus, [safeEmail]: status };
      
      let newAbsenceReasons = f.absenceReasons ? { ...f.absenceReasons } : {};
      if (status === 'Absent' && reason) {
        newAbsenceReasons[safeEmail] = reason;
      } else if (status !== 'Absent') {
        delete newAbsenceReasons[safeEmail];
      }

      return { ...f, staffStatus: newStatus, absenceReasons: newAbsenceReasons };
    }));
  };

  const allocateStaffDirectly = (flightId, email) => {
    const safeEmail = escapeEmail(email);
    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      if (f.locked) return f;
      const currentStaff = f.allocatedStaff || [];
      const currentStatus = f.staffStatus || {};
      
      const migratedStatus = {};
      Object.keys(currentStatus).forEach(k => {
        migratedStatus[escapeEmail(unescapeEmail(k))] = currentStatus[k];
      });
      
      if (currentStaff.includes(email) || migratedStatus[safeEmail] === 'Attending') return f;
      return { 
        ...f, 
        allocatedStaff: [...currentStaff, email], 
        staffStatus: { ...migratedStatus, [safeEmail]: 'Attending' } 
      };
    }));
  };

  const deallocateStaffDirectly = (flightId, email) => {
    const safeEmail = escapeEmail(email);
    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      if (f.locked) return f;
      const currentStaff = f.allocatedStaff || [];
      const currentStatus = f.staffStatus || {};
      
      const migratedStatus = {};
      Object.keys(currentStatus).forEach(k => {
        migratedStatus[escapeEmail(unescapeEmail(k))] = currentStatus[k];
      });
      
      delete migratedStatus[safeEmail];
      return { 
        ...f, 
        allocatedStaff: currentStaff.filter(e => e !== email), 
        staffStatus: migratedStatus 
      };
    }));
  };

  const submitFlightLog = (logData) => {
    const newLog = {
      id: makeId('flight-log'),
      flightId: logData.flightId,
      flightCode: logData.flightCode,
      pilot: logData.pilot,
      coPilot: logData.coPilot,
      passengers: parseInt(logData.passengers) || 0,
      status: 'Pending', 
      notes: logData.notes,
      photoProof: logData.photoProof,
      submitterEmail: currentUser.email,
      submitterName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString()
    };
    
    const db = getDatabase(firebaseApp);
    const cleanLog = JSON.parse(JSON.stringify(newLog));
    update(ref(db, `flightLogs`), { [cleanLog.id]: cleanLog }).catch(err => console.error('Failed to save flight log:', err));

    logAction('flight_log_submitted', `Submitted flight log for ${logData.flightCode}`, { flightCode: logData.flightCode });
  };

  const approveFlightLog = (logId) => {
    let logToApprove = null;
    const db = getDatabase(firebaseApp);
    setFlightLogs(prev => prev.map(log => {
      if (log.id === logId && log.status !== 'Approved') {
        logToApprove = log;
        update(ref(db, `flightLogs/${logId}`), { status: 'Approved' }).catch(e => console.error(e));
        return { ...log, status: 'Approved' };
      }
      return log;
    }));
    
    if (logToApprove) {
      logAction('flight_log_approved', `Approved flight log for ${logToApprove.flightCode}`, { logId });
      
      const submitterUser = users.find(u => u.email === logToApprove.submitterEmail);
      const copilotUser = users.find(u => u.robloxUsername === logToApprove.coPilot);
      
      if (submitterUser) {
        setUsers(prev => prev.map(u => u.email === submitterUser.email ? { ...u, points: Number(u.points || 0) + 7 } : u));
        logPointsAction(submitterUser.email, 7, `Flight Log Approved: ${logToApprove.flightCode}`);
      }
      if (copilotUser && copilotUser.email !== logToApprove.submitterEmail) {
        setUsers(prev => prev.map(u => u.email === copilotUser.email ? { ...u, points: Number(u.points || 0) + 7 } : u));
        logPointsAction(copilotUser.email, 7, `Flight Log Approved (Co-Pilot): ${logToApprove.flightCode}`);
      }
    }
  };

  const rejectFlightLog = (logId) => {
    const db = getDatabase(firebaseApp);
    update(ref(db, `flightLogs/${logId}`), { status: 'Rejected' }).catch(e => console.error(e));
    setFlightLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Rejected' } : log));
    logAction('flight_log_rejected', `Rejected flight log ${logId}`);
  };

  const submitLoaRequest = (loaData) => {
    const newRequest = {
      id: 'loa-' + Date.now(),
      startDate: loaData.startDate,
      endDate: loaData.endDate,
      reason: loaData.reason,
      status: 'Pending',
      userEmail: currentUser.email,
      userName: `${currentUser.firstName} ${currentUser.lastName}`,
      adminComment: '',
      timestamp: new Date().toISOString()
    };
    setLoaRequests(prev => [newRequest, ...prev]);
  };

  const updateLoaStatus = (loaId, status, comment) => {
    setLoaRequests(prev => prev.map(req => 
      req.id === loaId ? { ...req, status, adminComment: comment !== undefined ? comment : req.adminComment } : req
    ));
    logAction('loa_updated', `LOA ${status} for ${loaId}`, { loaId, status });
  };

  const requestEndLoaEarly = (loaId) => {
    setLoaRequests(prev => prev.map(req => req.id === loaId ? { ...req, status: 'End Requested' } : req));
    logAction('loa_end_requested', `User requested to end LOA early`, { loaId });
  };

  const addDocument = (docData) => {
    const newDoc = {
      id: 'doc-' + Date.now(),
      title: docData.title,
      category: docData.category,
      content: docData.content,
      authorEmail: currentUser.email,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      date: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const deleteDocument = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const submitReport = (reportData) => {
    const newReport = {
      id: 'rep-' + Date.now(),
      reportedPlayer: reportData.reportedPlayer,
      type: reportData.type,
      description: reportData.description,
      evidenceLink: reportData.evidenceLink,
      status: 'Pending',
      reporterEmail: currentUser.email,
      reporterName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString(),
      comments: [
        {
          id: 'comm-' + Date.now(),
          authorName: `${currentUser.firstName} ${currentUser.lastName}`,
          authorEmail: currentUser.email,
          text: 'Logged a Report',
          timestamp: new Date().toISOString(),
          isAdmin: currentUser.isAdmin
        }
      ]
    };
    setReports(prev => [newReport, ...prev]);
  };

  const updateReportStatus = (reportId, status) => {
    const rep = reports.find(r => r.id === reportId);
    if (rep && status === 'Actioned' && rep.status !== 'Actioned') {
       setUsers(prev => prev.map(u => u.email === rep.reporterEmail ? { ...u, points: Number(u.points || 0) + 2 } : u));
       logPointsAction(rep.reporterEmail, 2, 'Report Actioned');
    }
    setReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, status } : r
    ));
  };

  const addReportComment = (reportId, commentText) => {
    const newComment = {
      id: 'comm-' + Date.now(),
      authorEmail: currentUser.email,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      text: commentText,
      timestamp: new Date().toISOString(),
      isAdmin: currentUser.isAdmin
    };
    setReports(prev => prev.map(rep => {
      if (rep.id !== reportId) return rep;
      return { ...rep, comments: [...rep.comments, newComment] };
    }));
  };

  const addInfraction = (infData) => {
    const staffEmail = infData.staffEmail?.trim();
    const mainMessage = infData.mainMessage?.trim();
    if (!staffEmail || !mainMessage) return false;

    const staffUser = users.find(u => u.email === staffEmail);
    
    if (!canTakeAction(currentUser, staffUser)) {
      return false; 
    }
    const newInfraction = {
      id: makeId('inf'),
      staffEmail,
      staffName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : staffEmail,
      type: infData.type || 'Warning',
      mainMessage,
      confidentialMessage: infData.confidentialMessage?.trim() || '',
      issuedByEmail: currentUser.email,
      issuedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString()
    };
    
    setInfractions(prev => [newInfraction, ...prev]);
    
    if (infData.type !== 'Suspension') {
      setUsers(prev => prev.map(u => u.email === staffEmail ? { ...u, points: Number(u.points || 0) - 10, lastInfractionDate: new Date().toISOString() } : u));
      logPointsAction(staffEmail, -10, `Infraction: ${mainMessage}`);
    } else {
      setUsers(prev => prev.map(u => u.email === staffEmail ? { ...u, lastInfractionDate: new Date().toISOString() } : u));
    }
    
    logAction('infraction_added', `Issued ${infData.type || 'Warning'} to ${staffEmail}`, { staffEmail, mainMessage });
    return true;
  };

  const deleteInfraction = (infId) => {
    if (getRankWeight(currentUser) < 80) return; 

    setInfractions(prev => prev.filter(i => i.id !== infId));
    logAction('infraction_deleted', `Removed infraction ${infId}`, { infId });
  };

  const deleteInformalSanction = (sancId) => {
    if (getRankWeight(currentUser) < 80) return; 

    const sanction = informalSanctions.find(s => s.id === sancId);
    if (!sanction) return;

    setInformalSanctions(prev => prev.filter(s => s.id !== sancId));

    let shouldReturnPoints = false;
    const sancDate = new Date(sanction.timestamp);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (sancDate >= sevenDaysAgo) {
      shouldReturnPoints = true;
    }

    if (shouldReturnPoints) {
      setUsers(prev => prev.map(u => u.email === sanction.staffEmail ? { ...u, points: Number(u.points || 0) + 2 } : u));
      logPointsAction(sanction.staffEmail, 2, 'Informal Sanction Cancelled');
    }

    logAction('informal_sanction_deleted', `Removed informal sanction ${sancId}`, { sancId });
  };

  const appealInfraction = (infId, appealText) => {
    setInfractions(prev => prev.map(inf => {
      if (inf.id !== infId) return inf;
      return {
        ...inf,
        appeal: {
          text: appealText,
          date: new Date().toISOString()
        }
      };
    }));
    logAction('infraction_appealed', `Appealed infraction ${infId}`, { infId });
  };

  const addChatMessage = async (channel, text, replyTo = null, attachmentUrl = null) => {
    const newMessage = {
      id: 'msg-' + Date.now() + Math.random().toString(36).substring(2, 6),
      channel,
      text,
      attachmentUrl,
      senderEmail: currentUser.email,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      senderRole: currentUser.customRole || (currentUser.isAdmin ? 'Admin' : 'Staff'),
      senderPfp: currentUser.profilePicture || '',
      timestamp: new Date().toISOString(),
      replyTo,
      reactions: []
    };

    try {
      const messagesRef = ref(db, 'chatMessages');
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, newMessage);

    } catch (error) {
      console.error("Error saving message to Firebase:", error);
    }
  };

  const deleteChatMessage = async (msgId) => {
    setChatMessages(prev => prev.filter(m => m.id !== msgId));

    try {
      const chatRef = ref(db, 'chatMessages');
      const snapshot = await get(chatRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const firebaseKey = Object.keys(data).find(key => data[key].id === msgId);
        if (firebaseKey) {
          await remove(ref(db, `chatMessages/${firebaseKey}`));
        }
      }
    } catch (error) {
      console.error("Error deleting message from Firebase:", error);
    }
  };

  const addMessageReaction = async (msgId, emoji) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const currentReactions = m.reactions || [];
      const userEmail = currentUser.email;
      
      const existingReactionIndex = currentReactions.findIndex(r => r.emoji === emoji);
      let newReactions = [...currentReactions];
      
      if (existingReactionIndex >= 0) {
        const reaction = newReactions[existingReactionIndex];
        if (reaction.users.includes(userEmail)) {
          const updatedUsers = reaction.users.filter(u => u !== userEmail);
          if (updatedUsers.length === 0) {
            newReactions.splice(existingReactionIndex, 1);
          } else {
            newReactions[existingReactionIndex] = { ...reaction, users: updatedUsers, count: updatedUsers.length };
          }
        } else {
          const updatedUsers = [...reaction.users, userEmail];
          newReactions[existingReactionIndex] = { ...reaction, users: updatedUsers, count: updatedUsers.length };
        }
      } else {
        newReactions.push({ emoji, count: 1, users: [userEmail] });
      }
      return { ...m, reactions: newReactions };
    }));

    try {
      const chatRef = ref(db, 'chatMessages');
      const snapshot = await get(chatRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const firebaseKey = Object.keys(data).find(key => data[key].id === msgId);
        
        if (firebaseKey) {
          const reactionRef = ref(db, `chatMessages/${firebaseKey}/reactions`);
          await runTransaction(reactionRef, (currentReactions) => {
            const reactions = currentReactions || [];
            const userEmail = currentUser.email;
            const existingIndex = reactions.findIndex(r => r.emoji === emoji);
            let updatedReactions = [...reactions];

            if (existingIndex >= 0) {
              const reaction = updatedReactions[existingIndex];
              if (reaction.users && reaction.users.includes(userEmail)) {
                const updatedUsers = reaction.users.filter(u => u !== userEmail);
                if (updatedUsers.length === 0) {
                  updatedReactions.splice(existingIndex, 1);
                } else {
                  updatedReactions[existingIndex] = { ...reaction, users: updatedUsers, count: updatedUsers.length };
                }
              } else {
                const updatedUsers = [...(reaction.users || []), userEmail];
                updatedReactions[existingIndex] = { ...reaction, users: updatedUsers, count: updatedUsers.length };
              }
            } else {
              updatedReactions.push({ emoji, count: 1, users: [userEmail] });
            }
            return updatedReactions;
          });
        }
      }
    } catch (error) {
      console.error("Error updating reaction in Firebase:", error);
    }
  };

useEffect(() => {
    if (!db) return;

    const chatRef = ref(db, 'chatMessages');
    
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.keys(data).map(key => ({
          ...data[key]
        }));
        
        loadedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        setChatMessages(prev => {
          if (JSON.stringify(prev) === JSON.stringify(loadedMessages)) {
            return prev; 
          }
          return loadedMessages;
        });
      } else {
        setChatMessages(prev => prev.length === 0 ? prev : []);
      }
}, (error) => {
      console.error("Firebase listener error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, []); 

  const addAnnouncement = (annData) => {
    const newAnn = {
      id: makeId('ann'),
      type: annData.type,
      title: annData.title || '',
      subtitle: annData.subtitle || '',
      message: annData.message,
      targetAudience: annData.targetAudience || 'All',
      countdownDate: annData.countdownDate || null,
      authorEmail: currentUser.email,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString()
    };
    setAnnouncements(prev => [newAnn, ...prev]);
  };

  const deleteAnnouncement = (annId) => {
    setAnnouncements(prev => prev.filter(a => a.id !== annId));
  };

  const addTask = (taskData) => {
    const newTask = {
      id: makeId('task'),
      assignedByEmail: currentUser.email,
      assignedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      assignedToEmail: taskData.assignedToEmail,
      title: taskData.title,
      description: taskData.description || '',
      status: 'Pending',
      timestamp: new Date().toISOString(),
      completedAt: null
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTaskStatus = (taskId, status) => {
    let taskAssignedTo = null;
    let isCompleted = status === 'Completed';

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        taskAssignedTo = t.assignedToEmail;
        return { ...t, status, completedAt: isCompleted ? new Date().toISOString() : null };
      }
      return t;
    }));

    if (isCompleted && taskAssignedTo) {
      setUsers(prev => prev.map(u => 
        u.email === taskAssignedTo 
          ? { ...u, points: Number(u.points || 0) + 3 } 
          : u
      ));
      logPointsAction(taskAssignedTo, 3, 'Completed a Task');
    }
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const createTicket = (ticketData) => {
    const newTicket = {
      id: makeId('ticket'),
      authorEmail: currentUser ? currentUser.email : null,
      authorName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : (ticketData.authorName || 'Anonymous'),
      authorType: ticketData.authorType || 'Staff',
      title: ticketData.title,
      description: ticketData.description,
      status: 'Open',
      timestamp: new Date().toISOString(),
      comments: []
    };
    setTickets(prev => [newTicket, ...prev]);
    return newTicket.id;
  };

  const updateTicketStatus = (ticketId, status) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status } : t
    ));
  };

  const addTicketComment = (ticketId, text) => {
    const newComment = {
      id: makeId('tcomm'),
      authorEmail: currentUser.email,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      text,
      timestamp: new Date().toISOString(),
      isAdmin: currentUser.isAdmin
    };
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, comments: [...(t.comments || []), newComment] } : t
    ));
  };

  const addUnavailableDate = (dateStr) => {
    if (!unavailableDates.some(d => d.date === dateStr)) {
      setUnavailableDates(prev => [...prev, { id: dateStr, date: dateStr }]);
      logAction('unavailable_date_added', `Marked ${dateStr} as unavailable`);
    }
  };

  const removeUnavailableDate = (dateStr) => {
    setUnavailableDates(prev => prev.filter(d => d.date !== dateStr));
    logAction('unavailable_date_removed', `Removed ${dateStr} from unavailable`);
  };

  const addEvent = (eventData) => {
    const newEvent = {
      id: makeId('event'),
      ...eventData,
      timestamp: Date.now()
    };
    setEvents(prev => [...prev, newEvent]);
    logAction('event_created', `Scheduled event: ${eventData.title}`);
  };

  const deleteEvent = (eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    logAction('event_deleted', `Deleted event: ${eventId}`);
  };

  const addMeeting = (meetingData) => {
    const newMeeting = {
      id: makeId('meeting'),
      ...meetingData,
      timestamp: Date.now()
    };
    setMeetings(prev => [...prev, newMeeting]);
    logAction('meeting_created', `Scheduled meeting: ${meetingData.title}`);
  };

  const deleteMeeting = (meetingId) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
    logAction('meeting_deleted', `Deleted meeting: ${meetingId}`);
  };

  const addStaffNote = (staffEmail, type, text) => {
    const newNote = {
      id: makeId('note'),
      staffEmail,
      adminEmail: currentUser.email,
      adminName: `${currentUser.firstName} ${currentUser.lastName}`,
      type,
      text,
      timestamp: new Date().toISOString()
    };
    setStaffNotes(prev => [newNote, ...prev]);
  };

  const deleteStaffNote = (noteId) => {
    setStaffNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const awardMedal = (staffEmail, medalType) => {
    if (staffEmail === currentUser.email) return; 
    setUsers(prev => prev.map(u => {
      if (u.email === staffEmail) {
        if (medalType === 'gold') return { ...u, goldMedals: (u.goldMedals || 0) + 1, sotwWins: (u.sotwWins || 0) + 1 };
        if (medalType === 'silver') return { ...u, silverMedals: (u.silverMedals || 0) + 1 };
        if (medalType === 'bronze') return { ...u, bronzeMedals: (u.bronzeMedals || 0) + 1 };
      }
      return u;
    }));
    logAction('medal_awarded', `Awarded ${medalType} medal to ${staffEmail}`, { staffEmail, medalType });
  };

  useEffect(() => {
    if (!currentUser || !meetings || meetings.length === 0) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      meetings.forEach(meeting => {
        const meetingTime = new Date(meeting.date).getTime();
        const timeDiff = meetingTime - now;
        
        if (timeDiff > 0 && timeDiff <= 30 * 60 * 1000) {
          const notifiedKey = `oxton_notified_meeting_${meeting.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            addNotification('Meeting Reminder', `${meeting.title} is starting in 30 minutes!`, 'info');
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      });
    }, 60000); 
    
    return () => clearInterval(interval);
  }, [currentUser, meetings]);

  return (
    <AppContext.Provider
      value={{
        users,
        activeUsers: users.filter(isActiveStaff),
        currentUser,
        flights,
        flightLogs,
        loaRequests,
        documents,
        reports,
        infractions,
        tasks,
        tickets,
        staffNotes,
        onlineUsers,
        siteVersion, setSiteVersion,
        pointLogs, setPointLogs,
        theme,
        showClockBattery,
        setShowClockBattery,
        use24HourClock,
        setUse24HourClock,
        useLongDateFormat,
        setUseLongDateFormat,
        warningConfig,
        maintenanceConfig,
        auditLogs,
        passwordResets,
        requestPasswordReset,
        approvePasswordReset,
        rejectPasswordReset,
        login,
        signup,
        logout,
        updateUserProfile,
        toggleTheme,
        approveUser,
        rejectUser,
        removeUser,
        addPoints,
        changeSiteRole,
        setCustomRole,
        suspendUser,
        unsuspendUser,
        setWarning,
        setMaintenance,
        publishUpdate,
        addFlight,
        editFlight,
        removeFlight,
        toggleFlightLock,
        toggleAllocation,
        setAllocationStatus,
        allocateStaffDirectly,
        deallocateStaffDirectly,
        submitFlightLog,
        approveFlightLog,
        rejectFlightLog,
        submitLoaRequest,
        updateLoaStatus,
        requestEndLoaEarly,
        notifications,
        addNotification,
        removeNotification,
        userNotifications, 
        clearUserNotifications,
        addDocument,
        deleteDocument,
        submitReport,
        updateReportStatus,
        addReportComment,
        addInfraction,
        deleteInfraction,
        appealInfraction,
        addTask,
        updateTaskStatus,
        deleteTask,
        createTicket,
        updateTicketStatus,
        addTicketComment,
        addStaffNote,
        deleteStaffNote,
        awardMedal,
        chatMessages: visibleChatMessages,
        addChatMessage,
        deleteChatMessage,
        addMessageReaction,
        announcements,
        addAnnouncement,
        deleteAnnouncement,
        bypassConfig,
        setBypassAnnouncement: (title, message) => {
          const newConfig = {
            isActive: true,
            id: makeId('bypass'),
            title,
            message,
            timestamp: Date.now(),
            senderName: `${currentUser.firstName} ${currentUser.lastName}`
          };
          setBypassConfig(newConfig);
          logAction('bypass_announcement', `Sent bypass announcement: ${title}`);
        },
        clearBypassAnnouncement: () => {
          setBypassConfig(prev => ({ ...prev, isActive: false }));
          logAction('bypass_announcement_cleared', `Cleared bypass announcement`);
        },
        informalSanctions,
        addInformalSanction,
        deleteInformalSanction,
        logMissedFlight,
        events,
        unavailableDates,
        addEvent,
        deleteEvent,
        addUnavailableDate,
        removeUnavailableDate,
        meetings,
        addMeeting,
        deleteMeeting,
        superAdminEmail: SUPER_ADMIN_EMAIL,
        pageConfig,
        updatePageConfig: (key, value) => {
          setPageConfig(prev => ({ ...prev, [key]: value }));
          logAction('page_config_updated', `Updated page config: ${key} to ${value}`);
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
