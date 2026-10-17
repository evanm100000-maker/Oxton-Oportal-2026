import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { db, storage, firebaseApp } from "../firebase"; 
import { ref, onValue, set, runTransaction, push, get, remove, getDatabase, query, limitToLast, update, onDisconnect } from "firebase/database";
import { getNextMondayMidnightUK } from '../utils/timeUtils.js';
import { playNotificationSound, isDndActive, setDndActive } from '../utils/notificationSound';
const AppContext = createContext();

const SUPER_ADMIN_EMAIL = 'evanm.100000@gmail.com';
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

const initialEmergencyAlertConfig = {
  isActive: false,
  id: null,
  header: 'Emergency Alert',
  message: '',
  soundType: 'standard', // 'standard' (less severe) | 'severe' (loud emergency siren)
  timestamp: null,
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

const initialHomeworkConfig = {
  classroomUrl: 'https://classroom.google.com/',
  classCode: '',
  title: 'Oxton Staff Training & Homework',
  description: 'Access Google Classroom to view assigned training coursework, revision materials, and staff homework tasks.'
};

const initialPageConfig = {
  allocation: true,
  calendar: true,
  events: true,
  meetings: true,
  flightRegister: true,
  flightLogs: true,
  flightQuotas: true,
  announcements: true,
  staffChat: true,
  allStaff: true,
  leaderboard: true,
  performance: true,
  tasks: true,
  homework: true,
  homwork: true,
  loa: true,
  tickets: true,
  infractions: true,
  documents: true,
  reports: true,
  adminPanel: true,
  analytics: true,
  passengerPortal: true,
  emergencyAlerts: true,
  bypassAnnouncement: true,
  // Aliases
  logs: true,
  register: true,
  admin: true,
  flight_quotas: true
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

const escapeEmail = (email) => email ? email.toLowerCase().trim().replace(/\./g, ',') : '';
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
                item._firebaseKey = key;
              }
              return item;
            });
          } else if (Array.isArray(data)) {
            normalizedData = data.map((item, index) => {
              if (item && typeof item === 'object') {
                const key = item.id ? String(item.id) : (item.email ? item.email.toLowerCase().trim().replace(/\./g, ',') : index.toString());
                item._firebaseKey = key;
              }
              return item;
            });
          }
          if (Array.isArray(normalizedData)) {
            normalizedData = normalizedData.filter(item => item !== null && item !== undefined);
            
            // Deduplicate items by email (case-insensitive) or by id
            const seenKeys = new Set();
            normalizedData = normalizedData.filter(item => {
              const uniqueKey = item.email 
                ? item.email.toLowerCase().trim() 
                : (item.id || item._firebaseKey || null);
              if (uniqueKey) {
                if (seenKeys.has(uniqueKey)) return false;
                seenKeys.add(uniqueKey);
              }
              return true;
            });

            // Only reverse timestamped feeds; keep directories like users stable
            if (path !== 'users') {
              normalizedData.reverse();
            }
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
      let nextArray = typeof updater === 'function' ? updater(currentArray) : updater;
      
      if (Array.isArray(nextArray)) {
        const seenKeys = new Set();
        nextArray = nextArray.filter(item => {
          if (!item) return false;
          const uniqueKey = item.email ? item.email.toLowerCase().trim() : (item.id || null);
          if (uniqueKey) {
            if (seenKeys.has(uniqueKey)) return false;
            seenKeys.add(uniqueKey);
          }
          return true;
        });
      }

      const db = getDatabase(firebaseApp);
      const updates = {};
      
      // Find additions and modifications
      nextArray.forEach(item => {
        let fbKey = item._firebaseKey;
        if (!fbKey) {
          fbKey = item.id ? String(item.id) : (item.email ? item.email.toLowerCase().trim().replace(/\./g, ',') : Math.random().toString(36).substring(2, 10));
          item._firebaseKey = fbKey;
        }
        
        const currentItem = currentArray.find(i => 
          (i._firebaseKey && i._firebaseKey === fbKey) ||
          (i.email && item.email && i.email.toLowerCase().trim() === item.email.toLowerCase().trim()) ||
          (i.id && item.id && String(i.id) === String(item.id))
        );
        if (!currentItem || JSON.stringify(currentItem) !== JSON.stringify(item)) {
          updates[fbKey] = item;
        }
      });
      
      // Find deletions safely checking email, id and _firebaseKey
      currentArray.forEach(item => {
        const fbKey = item._firebaseKey;
        const stillExists = nextArray.some(i => 
          (i._firebaseKey && i._firebaseKey === fbKey) ||
          (i.email && item.email && i.email.toLowerCase().trim() === item.email.toLowerCase().trim()) ||
          (i.id && item.id && String(i.id) === String(item.id))
        );
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
      setLocalData(data ? (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue) ? { ...initialValue, ...data } : data) : initialValue);
      setIsLoaded(true);
    });
    return unsub;
  }, [path, initialValue, enabled]);

  const updateData = (updater) => {
    setLocalData(prev => {
      const dataToUpdate = prev ? (typeof initialValue === 'object' && initialValue !== null && !Array.isArray(initialValue) ? { ...initialValue, ...prev } : prev) : initialValue;
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
  const [emergencyAlertConfig, setEmergencyAlertConfig] = useFirebaseObject('emergencyAlert', initialEmergencyAlertConfig);
  const [quotaConfig, setQuotaConfig] = useFirebaseObject('quotaConfig', { lastResetDate: null, resetBy: null, resetByName: null });
  const [homeworkConfig, setHomeworkConfig] = useFirebaseObject('homeworkConfig', initialHomeworkConfig);

  const [informalSanctions, setInformalSanctions] = useFirebaseArray('informalSanctions', EMPTY_ARRAY, isLoggedIn, 50);
  const [pointLogs, setPointLogs] = useFirebaseArray('pointLogs', EMPTY_ARRAY, isLoggedIn, 500);
  const [events, setEvents] = useFirebaseArray('events', initialEvents, true, 50);
  const [unavailableDates, setUnavailableDates] = useFirebaseArray('unavailableDates', initialUnavailableDates, true, 200);
  const [meetings, setMeetings] = useFirebaseArray('meetings', initialMeetings, true, 50);
  const [pageConfig, setPageConfig] = useFirebaseObject('pageConfig', initialPageConfig);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [busyUsers, setBusyUsers] = useState({});
  const [groupChats, setGroupChats] = useState([]);
  const [siteVersion, setSiteVersion] = useState(null);
  const POPPED_NOTIFS_KEY = 'oxton_popped_notifs_v1';
  const DELETED_NOTIFS_KEY = 'oxton_deleted_notifs_v1';

  const getPoppedNotificationKeys = () => {
    try {
      const raw = localStorage.getItem(POPPED_NOTIFS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const markNotificationAsPopped = (key) => {
    if (!key) return;
    try {
      const set = getPoppedNotificationKeys();
      set.add(key);
      const arr = Array.from(set).slice(-300);
      localStorage.setItem(POPPED_NOTIFS_KEY, JSON.stringify(arr));
    } catch {}
  };

  const isNotificationPopped = (key) => {
    if (!key) return false;
    try {
      const set = getPoppedNotificationKeys();
      return set.has(key);
    } catch {
      return false;
    }
  };

  const getDeletedNotificationIds = () => {
    try {
      const raw = localStorage.getItem(DELETED_NOTIFS_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const addDeletedNotificationId = (id) => {
    if (!id) return;
    try {
      const set = getDeletedNotificationIds();
      set.add(String(id));
      const arr = Array.from(set).slice(-400);
      localStorage.setItem(DELETED_NOTIFS_KEY, JSON.stringify(arr));
    } catch {}
  };

  const [userNotifications, setUserNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      setUserNotifications([]);
      return;
    }
    const db = getDatabase(firebaseApp);
    const rawEmail = currentUser.email || '';
    const safeEmail = rawEmail.toLowerCase().trim().replace(/\./g, ',');
    const notifRef = query(ref(db, `userNotifications/${safeEmail}`), limitToLast(40));
    
    const unsub = onValue(notifRef, snap => {
      const data = snap.val();
      const clearedAtStr = localStorage.getItem(`oxton_cleared_notifs_${safeEmail}`);
      const clearedAt = clearedAtStr ? parseInt(clearedAtStr, 10) : 0;
      const deletedIds = getDeletedNotificationIds();

      if (data) {
        let arr = Object.keys(data).map(k => ({...data[k], _firebaseKey: k}));
        const staleKeys = [];
        // Filter out notifications that were cleared or deleted
        arr = arr.filter(n => {
          if (!n) return false;
          const notifId = n.id || n._firebaseKey;
          if (notifId && deletedIds.has(String(notifId))) {
            staleKeys.push(n._firebaseKey || notifId);
            return false;
          }
          const time = n.timestamp ? (typeof n.timestamp === 'number' ? n.timestamp : new Date(n.timestamp).getTime()) : 0;
          if (clearedAt > 0 && time > 0 && time <= clearedAt) {
            staleKeys.push(n._firebaseKey || notifId);
            return false;
          }
          return true;
        });
        arr.sort((a,b) => b.timestamp - a.timestamp);
        setUserNotifications(arr);

        // Delete stale/cleared notifications from Firebase RTDB so they are gone for good
        if (staleKeys.length > 0) {
          const cleanup = {};
          staleKeys.forEach(k => {
            if (k) cleanup[k] = null;
          });
          update(ref(db, `userNotifications/${safeEmail}`), cleanup).catch(() => {});
        }
      } else {
        setUserNotifications([]);
      }
    });
    return unsub;
  }, [currentUser]);

  const clearUserNotifications = () => {
    if (!currentUser) return;
    const rawEmail = currentUser.email || '';
    const safeEmail = rawEmail.toLowerCase().trim().replace(/\./g, ',');
    const legacySafeEmail = rawEmail.replace(/\./g, ',');
    const now = Date.now();

    try {
      localStorage.setItem(`oxton_cleared_notifs_${safeEmail}`, now.toString());
      if (legacySafeEmail !== safeEmail) {
        localStorage.setItem(`oxton_cleared_notifs_${legacySafeEmail}`, now.toString());
      }
      (userNotifications || []).forEach(n => {
        if (n.id) addDeletedNotificationId(n.id);
        if (n._firebaseKey) addDeletedNotificationId(n._firebaseKey);
      });
    } catch {}

    setLastSeenNotificationTime(now);
    setUserNotifications([]);
    setNotifications([]);

    const db = getDatabase(firebaseApp);
    set(ref(db, `userNotifications/${safeEmail}`), null).catch(() => {});
    if (legacySafeEmail !== safeEmail) {
      set(ref(db, `userNotifications/${legacySafeEmail}`), null).catch(() => {});
    }
  };

  const removeUserNotification = (notifId) => {
    if (!currentUser || !notifId) return;
    const rawEmail = currentUser.email || '';
    const safeEmail = rawEmail.toLowerCase().trim().replace(/\./g, ',');
    const legacySafeEmail = rawEmail.replace(/\./g, ',');

    addDeletedNotificationId(notifId);

    setUserNotifications(prev => (prev || []).filter(n => n.id !== notifId && n._firebaseKey !== notifId));
    setNotifications(prev => (prev || []).filter(n => n.id !== notifId));

    const db = getDatabase(firebaseApp);
    set(ref(db, `userNotifications/${safeEmail}/${notifId}`), null).catch(() => {});
    if (legacySafeEmail !== safeEmail) {
      set(ref(db, `userNotifications/${legacySafeEmail}/${notifId}`), null).catch(() => {});
    }
  };

  const [lastSeenNotificationTime, setLastSeenNotificationTime] = useState(() => {
    try {
      const rawUser = sessionStorage.getItem(STORAGE_KEYS.currentUser) || localStorage.getItem(STORAGE_KEYS.currentUser);
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u?.email) {
          const safe = u.email.toLowerCase().trim().replace(/\./g, ',');
          const saved = localStorage.getItem(`oxton_last_seen_notif_${safe}`);
          return saved ? parseInt(saved, 10) : 0;
        }
      }
    } catch {}
    return 0;
  });

  useEffect(() => {
    if (!currentUser?.email) {
      setLastSeenNotificationTime(0);
      return;
    }
    const safeEmail = escapeEmail(currentUser.email);
    try {
      const saved = localStorage.getItem(`oxton_last_seen_notif_${safeEmail}`);
      setLastSeenNotificationTime(saved ? parseInt(saved, 10) : 0);
    } catch {}
  }, [currentUser]);

  const markNotificationsAsSeen = () => {
    const now = Date.now();
    setLastSeenNotificationTime(now);
    if (currentUser?.email) {
      const safeEmail = escapeEmail(currentUser.email);
      try {
        localStorage.setItem(`oxton_last_seen_notif_${safeEmail}`, now.toString());
      } catch {}
    }
  };

  const unseenNotificationsCount = useMemo(() => {
    if (!userNotifications || userNotifications.length === 0) return 0;
    if (!lastSeenNotificationTime || lastSeenNotificationTime === 0) {
      return userNotifications.length;
    }
    return userNotifications.filter(n => {
      const t = n.timestamp ? (typeof n.timestamp === 'number' ? n.timestamp : new Date(n.timestamp).getTime()) : 0;
      return t > lastSeenNotificationTime;
    }).length;
  }, [userNotifications, lastSeenNotificationTime]);

  // Dynamic Browser Tab Title: Switch between "X New Notification(s)" and "Oxton Oportal | Staff Portal" when unseen notifications exist
  useEffect(() => {
    const defaultTitle = 'Oxton Oportal | Staff Portal';
    if (unseenNotificationsCount <= 0) {
      document.title = defaultTitle;
      return;
    }

    const notifTitle = `${unseenNotificationsCount} New Notification${unseenNotificationsCount > 1 ? 's' : ''}`;
    let showNotif = true;
    document.title = notifTitle;

    const interval = setInterval(() => {
      showNotif = !showNotif;
      document.title = showNotif ? notifTitle : defaultTitle;
    }, 2000);

    return () => {
      clearInterval(interval);
      document.title = defaultTitle;
    };
  }, [unseenNotificationsCount]);

  const visibleChatMessages = useMemo(() => {
    if (!currentUser) return [];
    const safeMessages = Array.isArray(chatMessages) ? chatMessages : [];
    const myEmail = (currentUser.email || '').toLowerCase().trim();
    
    return safeMessages.filter(m => {
      if (!m || !m.channel) return false;
      if (m.channel === 'Staff Chat' || m.channel === 'Global') return true;
      if (m.channel === 'Security') return !!currentUser.isAdmin;
      if (m.channel.startsWith('group_')) {
        const groupId = m.channel.replace('group_', '');
        const targetGroup = (groupChats || []).find(g => g.id === groupId);
        if (!targetGroup) return false;
        const members = (targetGroup.members || []).map(e => (e || '').toLowerCase().trim());
        return members.includes(myEmail) || !!currentUser.isAdmin;
      }
      return true;
    });
  }, [chatMessages, currentUser, groupChats]);

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

  // Do Not Disturb (DND) state
  const [isDnd, setIsDnd] = useState(() => {
    try {
      return localStorage.getItem('oxton_dnd_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDnd = () => {
    setIsDnd(prev => {
      const next = !prev;
      setDndActive(next);
      return next;
    });
  };

  const addNotification = (title, message, type = 'info', soundType = null, customId = null) => {
    if (!title && !message) return;
    const id = customId || makeId('notif');
    const contentKey = `${title || ''}__${message || ''}`.trim();

    // Prevent duplicate toast popups or audio for notifications that have already popped or been deleted
    if (isNotificationPopped(id) || isNotificationPopped(contentKey) || getDeletedNotificationIds().has(id)) {
      return;
    }
    markNotificationAsPopped(id);
    markNotificationAsPopped(contentKey);

    const isPoints = type === 'points' || 
                     soundType === 'points' || 
                     (title && title.toLowerCase().includes('point')) || 
                     (message && message.toLowerCase().includes('point'));
    const effectiveSoundType = isPoints ? 'points' : (soundType || 'general');

    const newNotif = { 
      id, 
      title, 
      message, 
      type, 
      soundType: effectiveSoundType, 
      timestamp: Date.now() 
    };
    
    setNotifications(prev => [...prev, newNotif]);
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
    
    if (currentUser && currentUser.email) {
       const db = getDatabase(firebaseApp);
       const safeEmail = escapeEmail(currentUser.email);
       const updates = {};
       updates[id] = newNotif;
       update(ref(db, `userNotifications/${safeEmail}`), updates).catch(err => console.error('Failed to save notification:', err));
    }
    
    // Play custom sound (points vs general) respecting Do Not Disturb
    if (!isDnd) {
      playNotificationSound(effectiveSoundType);
    }
  };

  const broadcastNotification = (title, message, type = 'info', soundType = 'general') => {
    const id = makeId('notif');
    const isPoints = type === 'points' || soundType === 'points';
    const effectiveSoundType = isPoints ? 'points' : 'general';
    const newNotif = { 
      id, 
      title, 
      message, 
      type, 
      soundType: effectiveSoundType, 
      timestamp: Date.now() 
    };

    const db = getDatabase(firebaseApp);
    (users || []).forEach(u => {
      if (u.email && u.approved && u.role !== 'passenger') {
        const safeEmail = escapeEmail(u.email);
        update(ref(db, `userNotifications/${safeEmail}`), { [id]: newNotif }).catch(e => console.error(e));
      }
    });

    addNotification(title, message, type, effectiveSoundType, id);
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

    const isPresenceOnline = (val) => {
      if (!val) return false;
      if (val === true) return true;
      if (typeof val === 'object') {
        return Object.values(val).some(v => v === true);
      }
      return false;
    };

    const onlinePresenceRef = ref(db, 'onlinePresence');
    const offlineDebounceTimers = {};

    const unsubscribeOnline = onValue(onlinePresenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      setOnlineUsers(prevOnline => {
        const nextState = { ...prevOnline };

        // Process incoming entries
        Object.keys(data).forEach(userKey => {
          const isOnline = isPresenceOnline(data[userKey]);
          if (isOnline) {
            // Cancel any pending removal timer
            if (offlineDebounceTimers[userKey]) {
              clearTimeout(offlineDebounceTimers[userKey]);
              delete offlineDebounceTimers[userKey];
            }
            nextState[userKey] = true;
          } else {
            // If currently online, delay switching to offline by 5 seconds (grace period for page refresh)
            if (nextState[userKey] && !offlineDebounceTimers[userKey]) {
              offlineDebounceTimers[userKey] = setTimeout(() => {
                setOnlineUsers(current => {
                  const updated = { ...current };
                  delete updated[userKey];
                  return updated;
                });
                delete offlineDebounceTimers[userKey];
              }, 5000);
            } else if (!nextState[userKey]) {
              delete nextState[userKey];
            }
          }
        });

        // Any keys in prevOnline that are completely missing in data
        Object.keys(nextState).forEach(userKey => {
          if (data[userKey] === undefined) {
            if (!offlineDebounceTimers[userKey]) {
              offlineDebounceTimers[userKey] = setTimeout(() => {
                setOnlineUsers(current => {
                  const updated = { ...current };
                  delete updated[userKey];
                  return updated;
                });
                delete offlineDebounceTimers[userKey];
              }, 5000);
            }
          }
        });

        return nextState;
      });
    });

    const busyUsersRef = ref(db, 'busyUsers');
    const unsubscribeBusy = onValue(busyUsersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setBusyUsers(data);
    });

    const groupChatsRef = ref(db, 'groupChats');
    const unsubscribeGroupChats = onValue(groupChatsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const groupsArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      setGroupChats(groupsArray);
    });

    return () => {
      if (typeof unsubscribeSiteVersion === 'function') unsubscribeSiteVersion();
      if (typeof unsubscribeOnline === 'function') unsubscribeOnline();
      if (typeof unsubscribeBusy === 'function') unsubscribeBusy();
      if (typeof unsubscribeGroupChats === 'function') unsubscribeGroupChats();
      Object.keys(offlineDebounceTimers).forEach(k => clearTimeout(offlineDebounceTimers[k]));
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;
    const db = getDatabase(firebaseApp);
    const safeEmail = currentUser.email.replace(/\./g, ',');
    
    // Stable tab session id across page reloads
    let tabId = '';
    try {
      tabId = sessionStorage.getItem('oxton_presence_tab_id');
      if (!tabId) {
        tabId = 'tab_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        sessionStorage.setItem('oxton_presence_tab_id', tabId);
      }
    } catch {
      tabId = 'tab_' + Math.random().toString(36).substring(2, 7);
    }

    const myTabRef = ref(db, `onlinePresence/${safeEmail}/${tabId}`);
    const connectedRef = ref(db, '.info/connected');

    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        // When connection is severed (browser shutdown, tab closed, network loss),
        // Firebase server will execute this remove instruction on the server side!
        onDisconnect(myTabRef).remove().then(() => {
          set(myTabRef, true).catch(() => {});
        }).catch(() => {
          set(myTabRef, true).catch(() => {});
        });
      }
    });

    return () => {
      if (typeof unsubConnected === 'function') unsubConnected();
    };
  }, [currentUser?.email]);

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

  const mountTimeRef = useRef(Date.now() + 5000);
  const prevDataRef = useRef({ chatMessages: null, infractions: null, loaRequests: null, tickets: null, tasks: null });

  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.chatMessages === null) {
      prevDataRef.current.chatMessages = visibleChatMessages;
      return;
    }
    if (visibleChatMessages.length > prevDataRef.current.chatMessages.length) {
      const newMsg = visibleChatMessages.find(m => !prevDataRef.current.chatMessages.some(pm => pm.id === m.id));
      if (newMsg && newMsg.senderEmail !== currentUser.email) {
        const msgTime = new Date(newMsg.timestamp || 0).getTime();
        if (msgTime > mountTimeRef.current) {
          const text = newMsg.text || '';
          addNotification(`New message from ${newMsg.senderName}`, text.length > 40 ? text.substring(0, 40) + '...' : text, 'info');
        }
      }
    }
    prevDataRef.current.chatMessages = visibleChatMessages;
  }, [visibleChatMessages, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.infractions === null) {
      prevDataRef.current.infractions = infractions;
      return;
    }
    if (infractions.length > prevDataRef.current.infractions.length) {
      const newInf = infractions.find(i => !prevDataRef.current.infractions.some(pi => pi.id === i.id));
      if (newInf && newInf.staffEmail === currentUser.email) {
        const infTime = new Date(newInf.timestamp || newInf.createdAt || 0).getTime();
        if (infTime > mountTimeRef.current) {
          addNotification(`New Consequence: ${newInf.type}`, `You received a ${newInf.type}. Check your dashboard.`, 'danger');
        }
      }
    }
    prevDataRef.current.infractions = infractions;
  }, [infractions, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.loaRequests === null) {
      prevDataRef.current.loaRequests = loaRequests;
      return;
    }
    loaRequests.forEach(loa => {
      const prevLoa = prevDataRef.current.loaRequests.find(p => p.id === loa.id);
      if (prevLoa && prevLoa.status !== loa.status && loa.userEmail === currentUser.email) {
        const updateTime = new Date(loa.reviewedAt || loa.updatedAt || Date.now()).getTime();
        if (updateTime > mountTimeRef.current) {
          addNotification(`LOA Status Updated`, `Your LOA request is now ${loa.status}`, 'info');
        }
      }
    });
    prevDataRef.current.loaRequests = loaRequests;
  }, [loaRequests, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.tickets === null) {
      prevDataRef.current.tickets = tickets;
      return;
    }
    tickets.forEach(ticket => {
      const prevTicket = prevDataRef.current.tickets.find(p => p.id === ticket.id);
      if (prevTicket && ticket.comments && (!prevTicket.comments || ticket.comments.length > prevTicket.comments.length)) {
        if (ticket.authorEmail === currentUser.email || currentUser.isAdmin) {
           const newComment = ticket.comments[ticket.comments.length - 1];
           if (newComment && newComment.authorEmail !== currentUser.email) {
             const commTime = new Date(newComment.timestamp || 0).getTime();
             if (commTime > mountTimeRef.current) {
               addNotification(`New Response on Support Ticket`, newComment.text.length > 40 ? newComment.text.substring(0, 40) + '...' : newComment.text, 'info');
             }
           }
        }
      }
    });
    prevDataRef.current.tickets = tickets;
  }, [tickets, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.tasks === null) {
      prevDataRef.current.tasks = tasks;
      return;
    }
    if (tasks.length > prevDataRef.current.tasks.length) {
      const newTask = tasks.find(t => !prevDataRef.current.tasks.some(pt => pt.id === t.id));
      if (newTask && newTask.assignedToEmail === currentUser.email) {
        const taskTime = new Date(newTask.timestamp || 0).getTime();
        if (taskTime > mountTimeRef.current) {
          addNotification(`New Task Assigned`, `You have a new task: ${newTask.title}`, 'info');
        }
      }
    }
    prevDataRef.current.tasks = tasks;
  }, [tasks, currentUser]);

  useEffect(() => {
    if (currentUser && users && users.length > 0) {
      const dbUser = users.find(u => u.email?.toLowerCase().trim() === currentUser.email?.toLowerCase().trim());
      if (dbUser && JSON.stringify(dbUser) !== JSON.stringify(currentUser)) {
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
    if (currentUser?.email) {
      const safeEmail = currentUser.email.replace(/\./g, ',');
      const db = getDatabase(firebaseApp);
      try {
        onDisconnect(ref(db, `onlinePresence/${safeEmail}`)).cancel();
      } catch {}
      remove(ref(db, `onlinePresence/${safeEmail}`)).catch(() => {});
      set(ref(db, `onlinePresence/${safeEmail}`), false).catch(() => {});
      setOnlineUsers(prev => {
        const next = { ...prev };
        delete next[safeEmail];
        return next;
      });
    }
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
    if (amount > 0) {
      sendNotificationToUser(email, 'Points Rewarded!', `You were awarded ${amount} points. Reason: ${reason || 'Staff reward'}`, 'points', 'points');
    }
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
    broadcastNotification(
      `New Flight to Allocate: ${newFlight.flightCode}`,
      `Flight to ${newFlight.location} on ${newFlight.date} ${newFlight.time || ''} is now open for crew allocation!`,
      'flight',
      'general'
    );
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

      let newAllocatedStaff = Array.isArray(f.allocatedStaff) ? [...f.allocatedStaff] : [];
      if (status === 'Attending') {
        if (!newAllocatedStaff.includes(email)) {
          newAllocatedStaff.push(email);
        }
      } else {
        newAllocatedStaff = newAllocatedStaff.filter(e => e !== email);
      }

      return { ...f, allocatedStaff: newAllocatedStaff, staffStatus: newStatus, absenceReasons: newAbsenceReasons };
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

  const sendNotificationToUser = (targetEmail, title, message, type = 'info', soundType = null) => {
    if (!targetEmail) return;
    const id = makeId('notif');
    const isPoints = type === 'points' || 
                     soundType === 'points' || 
                     (title && title.toLowerCase().includes('point')) || 
                     (message && message.toLowerCase().includes('point'));
    const effectiveSoundType = isPoints ? 'points' : (soundType || 'general');

    const newNotif = { 
      id, 
      title, 
      message, 
      type, 
      soundType: effectiveSoundType, 
      timestamp: Date.now() 
    };
    const db = getDatabase(firebaseApp);
    const safeEmail = escapeEmail(targetEmail);
    update(ref(db, `userNotifications/${safeEmail}`), { [id]: newNotif }).catch(err => console.error(err));
    const isTargetCurrentUser = currentUser?.email && currentUser.email.toLowerCase().trim() === targetEmail.toLowerCase().trim();
    if (isTargetCurrentUser) {
      const contentKey = `${title || ''}__${message || ''}`.trim();
      if (!isNotificationPopped(id) && !isNotificationPopped(contentKey) && !getDeletedNotificationIds().has(id)) {
        markNotificationAsPopped(id);
        markNotificationAsPopped(contentKey);
        setNotifications(prev => [...prev, newNotif]);
        setTimeout(() => removeNotification(id), 5000);
        if (!isDnd) {
          playNotificationSound(effectiveSoundType);
        }
      }
    }
  };

  const markFlightAttendance = (flightId, email, status) => {
    const safeEmail = escapeEmail(email);
    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      const currentRecord = f.attendanceRecord || {};
      const newRecord = { ...currentRecord, [safeEmail]: status };
      return { ...f, attendanceRecord: newRecord };
    }));
    logAction('flight_attendance_marked', `Marked ${email} as ${status} on flight ${flightId}`, { flightId, email, status });
  };

  const submitFlightRegister = (flightId, customAttendanceRecord = null) => {
    const nowIso = new Date().toISOString();
    let targetFlight = null;

    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      const currentRecord = customAttendanceRecord || f.attendanceRecord || {};
      targetFlight = {
        ...f,
        attendanceRecord: currentRecord,
        registerSubmitted: true,
        registerSubmittedAt: nowIso,
        registerSubmittedBy: currentUser?.email || 'Admin'
      };
      return targetFlight;
    }));

    if (!targetFlight) {
      targetFlight = flights.find(f => f.id === flightId);
      if (targetFlight) {
        targetFlight = {
          ...targetFlight,
          attendanceRecord: customAttendanceRecord || targetFlight.attendanceRecord || {},
          registerSubmitted: true,
          registerSubmittedAt: nowIso,
          registerSubmittedBy: currentUser?.email || 'Admin'
        };
      }
    }

    if (!targetFlight) return false;

    const record = customAttendanceRecord || targetFlight.attendanceRecord || {};

    setUsers(prev => prev.map(u => {
      const safeEmail = escapeEmail(u.email);
      const mark = record[safeEmail];
      if (!mark || mark === 'Pending') return u;

      const attendedFlights = Array.isArray(u.attendedFlights) ? [...u.attendedFlights] : [];
      const existingEntryIndex = attendedFlights.findIndex(a => a.flightId === targetFlight.id);
      const wasAlreadyCredited = existingEntryIndex >= 0 && (attendedFlights[existingEntryIndex].status === 'Present' || attendedFlights[existingEntryIndex].status === 'Late');

      const entry = {
        flightId: targetFlight.id,
        flightCode: targetFlight.flightCode,
        date: targetFlight.date,
        time: targetFlight.time || '',
        location: targetFlight.location,
        status: mark,
        submittedAt: nowIso
      };

      if (existingEntryIndex >= 0) {
        attendedFlights[existingEntryIndex] = entry;
      } else {
        attendedFlights.unshift(entry);
      }

      let updatedPoints = Number(u.points || 0);
      let updatedQuota = Number(u.quotaFlights || 0);
      let updatedCompleted = Number(u.completedFlightsCount || 0);

      if (mark === 'Present' || mark === 'Late') {
        if (!wasAlreadyCredited) {
          updatedPoints += 7;
          updatedQuota += 1;
          updatedCompleted += 1;
          logPointsAction(u.email, 7, `Flight Attendance Verified (${mark}): ${targetFlight.flightCode}`);
          sendNotificationToUser(
            u.email, 
            `Flight Verified: ${mark}`, 
            `You were marked ${mark} on flight ${targetFlight.flightCode}. 7 points & flight log credited!`, 
            mark === 'Present' ? 'success' : 'warning'
          );
        }
      } else if (mark === 'Absent') {
        sendNotificationToUser(u.email, 'Flight Attendance: Absent', `You were marked Absent on flight ${targetFlight.flightCode}.`, 'danger');
      }

      return {
        ...u,
        points: updatedPoints,
        quotaFlights: updatedQuota,
        completedFlightsCount: updatedCompleted,
        attendedFlights
      };
    }));

    logAction('flight_register_submitted', `Submitted attendance register for flight ${targetFlight.flightCode}`, { flightId });
    return true;
  };

  const reopenFlightRegister = (flightId) => {
    setFlights(prev => prev.map(f => {
      if (f.id !== flightId) return f;
      return { ...f, registerSubmitted: false };
    }));
    logAction('flight_register_reopened', `Reopened attendance register for flight ${flightId}`);
  };

  const resetAllFlightQuotas = () => {
    const nowIso = new Date().toISOString();
    const newConfig = {
      lastResetDate: nowIso,
      resetBy: currentUser?.email || 'admin',
      resetByName: currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Admin'
    };
    setQuotaConfig(newConfig);

    setUsers(prev => prev.map(u => ({
      ...u,
      quotaFlights: 0,
      lastQuotaReset: nowIso
    })));

    const db = getDatabase(firebaseApp);
    update(ref(db, 'quotaConfig'), newConfig).catch(err => console.error('Failed to sync quotaConfig to Firebase:', err));

    logAction('flight_quotas_reset', `Reset all staff flight quota progress to 0`, { resetBy: currentUser?.email });
    return true;
  };

  const resetStaffQuota = (email) => {
    const normalizedTarget = email?.toLowerCase().trim();
    const nowIso = new Date().toISOString();
    const resetDate = quotaConfig?.lastResetDate || nowIso;

    setUsers(prev => (prev || []).map(u => {
      if (u.email?.toLowerCase().trim() !== normalizedTarget) return u;
      return {
        ...u,
        quotaFlights: 0,
        lastQuotaReset: resetDate
      };
    }));

    const db = getDatabase(firebaseApp);
    const safeEmail = normalizedTarget.replace(/\./g, ',');
    update(ref(db, `userQuotas/${safeEmail}`), {
      quotaFlights: 0,
      lastQuotaReset: resetDate,
      updatedAt: nowIso
    }).catch(() => {});

    logAction('staff_quota_reset', `Reset flight quota for ${email} to 0`, { email });
  };

  const adjustStaffQuota = (email, delta, currentCount) => {
    const normalizedTarget = email?.toLowerCase().trim();
    const nowIso = new Date().toISOString();
    const resetDate = quotaConfig?.lastResetDate || nowIso;

    let computedNewQuota = 0;
    setUsers(prev => (prev || []).map(u => {
      if (u.email?.toLowerCase().trim() !== normalizedTarget) return u;
      const base = currentCount !== undefined ? Number(currentCount) : Number(u.quotaFlights !== undefined ? u.quotaFlights : 0);
      computedNewQuota = Math.max(0, base + delta);
      return {
        ...u,
        quotaFlights: computedNewQuota,
        lastQuotaReset: resetDate
      };
    }));

    const db = getDatabase(firebaseApp);
    const safeEmail = normalizedTarget.replace(/\./g, ',');
    update(ref(db, `userQuotas/${safeEmail}`), {
      quotaFlights: computedNewQuota,
      lastQuotaReset: resetDate,
      updatedAt: nowIso
    }).catch(() => {});

    logAction('staff_quota_adjusted', `Adjusted flight quota for ${email} by ${delta > 0 ? `+${delta}` : delta} (New: ${computedNewQuota})`, { email, delta, computedNewQuota });
  };

  const addInfraction = (infData) => {
    const staffEmail = infData.staffEmail?.trim();
    const mainMessage = infData.mainMessage?.trim();
    if (!staffEmail || !mainMessage) return false;

    const staffUser = users.find(u => u.email === staffEmail);
    
    if (!canTakeAction(currentUser, staffUser)) {
      return false; 
    }

    const type = infData.type || 'C1 Warning';
    const isDetention = type.startsWith('C4');
    const detentionDate = infData.detentionDate || (isDetention ? new Date(Date.now() + 86400000).toISOString().split('T')[0] : null);

    // Prevent duplicate C4 for the same user on the same date
    if (isDetention && detentionDate) {
      const duplicateC4 = (infractions || []).find(inf => 
        inf &&
        inf.staffEmail?.toLowerCase() === staffEmail.toLowerCase() &&
        (inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')) &&
        (inf.detentionDate || '').trim() === detentionDate.trim()
      );
      if (duplicateC4) {
        alert('Unable to log (C4 Already Scheduled for this date for this user.)');
        return false;
      }
    }

    const newInfraction = {
      id: makeId('inf'),
      staffEmail,
      staffName: staffUser ? `${staffUser.firstName} ${staffUser.lastName}` : staffEmail,
      type,
      mainMessage,
      confidentialMessage: infData.confidentialMessage?.trim() || '',
      detentionDate: detentionDate,
      detentionTime: infData.detentionTime || (isDetention ? (type.includes('C4B') ? '14:55 - 15:35' : '14:55 - 15:15') : null),
      detentionLocation: infData.detentionLocation || (isDetention ? 'Hall' : null),
      detentionStatus: isDetention ? 'Scheduled' : null, // 'Scheduled' | 'Passed' | 'Failed'
      isEscalation: !!infData.isEscalation,
      issuedByEmail: currentUser.email,
      issuedByName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString()
    };
    
    setInfractions(prev => [newInfraction, ...prev]);
    
    if (type === 'C5 Suspension') {
      // 2 days suspension = 48 hours
      const suspendedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      setUsers(prev => prev.map(u => u.email === staffEmail ? { ...u, suspendedUntil, lastInfractionDate: new Date().toISOString() } : u));
    } else {
      const deduction = type.startsWith('C4') ? 10 : (type.startsWith('C3') ? 5 : 2);
      setUsers(prev => prev.map(u => u.email === staffEmail ? { ...u, points: Number(u.points || 0) - deduction, lastInfractionDate: new Date().toISOString() } : u));
      logPointsAction(staffEmail, -deduction, `Sanction ${type}: ${mainMessage}`);
    }
    
    logAction('infraction_added', `Issued ${type} to ${staffEmail}`, { staffEmail, mainMessage, type });
    return true;
  };

  const passDetention = (infractionId) => {
    setInfractions(prev => prev.map(inf => {
      if (inf.id !== infractionId) return inf;
      return { ...inf, detentionStatus: 'Passed', completedAt: new Date().toISOString() };
    }));
    logAction('detention_passed', `Detention marked passed for ${infractionId}`, { infractionId });
  };

  const failDetention = (infractionId) => {
    const target = infractions.find(i => i.id === infractionId);
    if (!target) return null;

    const isTargetC4A = target.type.includes('C4A') || target.type === 'C4A - Infraction + 20m Detention';
    let escalatedInfraction = null;

    if (isTargetC4A) {
      // Escalate from C4A (+4 pts) to C4B (+4 pts) => total 8 points
      const nextDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      escalatedInfraction = {
        id: makeId('inf'),
        staffEmail: target.staffEmail,
        staffName: target.staffName,
        type: 'C4B - 40m Detention',
        mainMessage: `Escalated from failed C4A detention. Original reason: ${target.mainMessage}`,
        confidentialMessage: `Escalated from detention #${target.id}`,
        detentionDate: nextDate,
        detentionTime: '14:55 - 15:35',
        detentionLocation: target.detentionLocation || 'Hall',
        detentionStatus: 'Scheduled',
        isEscalation: true,
        issuedByEmail: currentUser.email,
        issuedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: new Date().toISOString()
      };

      // Atomically update target as Failed and prepend escalated infraction
      setInfractions(prev => {
        const updated = (prev || []).map(inf => {
          if (inf.id !== infractionId) return inf;
          return { ...inf, detentionStatus: 'Failed', failedAt: new Date().toISOString() };
        });
        return [escalatedInfraction, ...updated];
      });

      // Deduct staff points for C4 escalation
      setUsers(prev => (prev || []).map(u => 
        u.email === target.staffEmail 
          ? { ...u, points: Number(u.points || 0) - 10, lastInfractionDate: new Date().toISOString() } 
          : u
      ));
      logPointsAction(target.staffEmail, -10, `Escalation to C4B - 40m Detention (Failed C4A)`);
      logAction('detention_escalated', `Detention escalated to C4B for ${target.staffEmail}`, { targetId: infractionId });

      return {
        escalatedType: 'C4B - 40m Detention',
        staffEmail: target.staffEmail,
        staffName: target.staffName,
        pointsAdded: 4
      };
    } else {
      // Escalate from C4B (+4 pts) to C5 Suspension (+5 pts) => total 13 points
      const suspendedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      escalatedInfraction = {
        id: makeId('inf'),
        staffEmail: target.staffEmail,
        staffName: target.staffName,
        type: 'C5 Suspension',
        mainMessage: `2-Day Suspension: Escalated from failed C4B detention. Original reason: ${target.mainMessage}`,
        confidentialMessage: `Expires ${new Date(suspendedUntil).toLocaleString()}`,
        detentionStatus: null,
        isEscalation: true,
        issuedByEmail: currentUser.email,
        issuedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: new Date().toISOString()
      };

      // Atomically update target as Failed and prepend escalated suspension
      setInfractions(prev => {
        const updated = (prev || []).map(inf => {
          if (inf.id !== infractionId) return inf;
          return { ...inf, detentionStatus: 'Failed', failedAt: new Date().toISOString() };
        });
        return [escalatedInfraction, ...updated];
      });

      // Apply 48-hour suspension to user
      setUsers(prev => (prev || []).map(u => 
        u.email === target.staffEmail 
          ? { ...u, suspendedUntil, lastInfractionDate: new Date().toISOString() } 
          : u
      ));
      logAction('detention_escalated', `Detention escalated to 2-day C5 Suspension for ${target.staffEmail}`, { targetId: infractionId });

      return {
        escalatedType: 'C5 Suspension',
        staffEmail: target.staffEmail,
        staffName: target.staffName,
        pointsAdded: 5
      };
    }
  };

  const rescheduleDetention = (infractionId, newDate, newTime, newLocation) => {
    setInfractions(prev => prev.map(inf => {
      if (inf.id !== infractionId) return inf;
      return {
        ...inf,
        detentionDate: newDate || inf.detentionDate,
        detentionTime: newTime || inf.detentionTime,
        detentionLocation: newLocation || inf.detentionLocation,
        rescheduledAt: new Date().toISOString()
      };
    }));
    logAction('detention_rescheduled', `Rescheduled detention for ${infractionId}`, { infractionId, newDate, newTime, newLocation });
  };

  const updateInfraction = (infId, updates) => {
    setInfractions(prev => prev.map(inf => {
      if (inf.id !== infId) return inf;
      return {
        ...inf,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }));
    logAction('infraction_updated', `Updated consequence ${infId}`, { infId, updates });
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
      linkUrl: annData.linkUrl || '',
      authorEmail: currentUser.email,
      authorName: `${currentUser.firstName} ${currentUser.lastName}`,
      timestamp: new Date().toISOString()
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    broadcastNotification(
      `New Announcement: ${newAnn.title || newAnn.type}`,
      newAnn.message.length > 60 ? newAnn.message.substring(0, 60) + '...' : newAnn.message,
      'announcement',
      'general'
    );
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
    if (newTask.assignedToEmail) {
      sendNotificationToUser(
        newTask.assignedToEmail,
        `New Task Assigned: ${newTask.title}`,
        newTask.description ? (newTask.description.length > 60 ? newTask.description.substring(0, 60) + '...' : newTask.description) : 'You have a new task waiting on your dashboard.',
        'task',
        'general'
      );
    }
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
    const authorName = currentUser 
      ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
      : (ticketData.authorName || 'Guest');
    const authorRole = currentUser?.role === 'passenger' ? 'Passenger' : (currentUser?.isAdmin ? 'Admin' : 'Staff');
    const newTicket = {
      id: makeId('ticket'),
      authorEmail: currentUser ? currentUser.email : null,
      authorName: authorName,
      authorType: ticketData.authorType || authorRole,
      title: ticketData.title,
      description: ticketData.description,
      status: 'Open',
      timestamp: new Date().toISOString(),
      claimedByEmail: null,
      claimedByName: null,
      claimedAt: null,
      comments: []
    };
    setTickets(prev => [newTicket, ...prev]);
    // Notify admins of new support ticket
    (users || []).filter(u => u.isAdmin || u.siteRole === 'Admin' || u.siteRole === 'Owner').forEach(admin => {
      if (admin.email && admin.email !== currentUser?.email) {
        sendNotificationToUser(
          admin.email,
          `New Support Ticket: ${newTicket.title}`,
          `Opened by ${authorName}. Check Support Tickets.`,
          'ticket',
          'general'
        );
      }
    });
    return newTicket.id;
  };

  const updateTicketStatus = (ticketId, status) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status } : t
    ));
    logAction('ticket_status_updated', `Ticket ${ticketId} status changed to ${status}`, { ticketId, status });
  };

  const claimTicket = (ticketId) => {
    if (!currentUser) return;
    const adminName = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || currentUser.firstName;
    const systemComment = {
      id: makeId('tcomm'),
      authorEmail: 'system',
      authorName: 'System',
      text: `${currentUser.firstName} will be assisting you today.`,
      timestamp: new Date().toISOString(),
      isAdmin: true,
      isSystem: true
    };

    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      return {
        ...t,
        status: t.status === 'Closed' ? 'Open' : (t.status || 'Open'),
        claimedByEmail: currentUser.email,
        claimedByName: adminName,
        claimedAt: new Date().toISOString(),
        comments: [...(t.comments || []), systemComment]
      };
    }));

    logAction('ticket_claimed', `Admin ${adminName} claimed ticket ${ticketId}`, { ticketId, adminEmail: currentUser.email });
  };

  const escalateTicket = (ticketId) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: 'Escalated' } : t
    ));
    logAction('ticket_escalated', `Ticket ${ticketId} was escalated`, { ticketId });
  };

  const closeTicket = (ticketId) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: 'Closed' } : t
    ));
    logAction('ticket_closed', `Ticket ${ticketId} was closed`, { ticketId });
  };

  const addTicketComment = (ticketId, text) => {
    if (!currentUser || !text?.trim()) return;
    const authorName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.robloxUsername || currentUser.email || 'Admin';
    const newComment = {
      id: makeId('tcomm'),
      authorEmail: currentUser.email,
      authorName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      isAdmin: Boolean(currentUser.isAdmin || currentUser.siteRole === 'Admin' || currentUser.siteRole === 'Owner' || currentUser.siteRole === 'Moderator')
    };

    setTickets(prev => (prev || []).map(t => {
      if (t.id !== ticketId) return t;
      const currentComments = Array.isArray(t.comments) 
        ? t.comments 
        : (t.comments && typeof t.comments === 'object' ? Object.values(t.comments) : []);

      const isStaffOrAdmin = Boolean(currentUser.isAdmin || currentUser.siteRole === 'Admin' || currentUser.siteRole === 'Owner' || currentUser.siteRole === 'Moderator');

      return {
        ...t,
        status: t.status === 'Closed' ? 'Open' : (t.status || 'Open'),
        claimedByEmail: t.claimedByEmail || (isStaffOrAdmin ? currentUser.email : null),
        claimedByName: t.claimedByName || (isStaffOrAdmin ? authorName : null),
        comments: [...currentComments, newComment],
        updatedAt: new Date().toISOString()
      };
    }));

    logAction('ticket_comment_added', `Added comment to ticket ${ticketId}`, { ticketId, text: text.trim() });

    const targetTicket = (tickets || []).find(t => t.id === ticketId);
    if (targetTicket) {
      const recipientEmail = currentUser.email === targetTicket.authorEmail 
        ? targetTicket.claimedByEmail 
        : targetTicket.authorEmail;
      if (recipientEmail && recipientEmail !== currentUser.email) {
        sendNotificationToUser(
          recipientEmail,
          `New Support Ticket Message: ${targetTicket.title}`,
          `${authorName}: ${text.trim().substring(0, 50)}${text.trim().length > 50 ? '...' : ''}`,
          'ticket',
          'general'
        );
      }
    }
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
      authorEmail: currentUser?.email || 'admin',
      timestamp: Date.now()
    };
    setEvents(prev => [...prev, newEvent]);
    logAction('event_created', `Scheduled event: ${eventData.title}`);
    broadcastNotification(
      `New Upcoming Event: ${newEvent.title}`,
      `Scheduled for ${newEvent.date || 'upcoming date'}. Check the Events calendar!`,
      'info',
      'general'
    );
  };

  const deleteEvent = (eventId) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    logAction('event_deleted', `Deleted event: ${eventId}`);
  };

  const addMeeting = (meetingData) => {
    const newMeeting = {
      id: makeId('meeting'),
      ...meetingData,
      authorEmail: currentUser?.email || 'admin',
      timestamp: Date.now()
    };
    setMeetings(prev => [...prev, newMeeting]);
    logAction('meeting_created', `Scheduled meeting: ${meetingData.title}`);
    broadcastNotification(
      `Upcoming Meeting Scheduled: ${newMeeting.title}`,
      `Date: ${newMeeting.date || 'TBD'} ${newMeeting.time || ''}. Check Meetings tab!`,
      'info',
      'general'
    );
  };

  const deleteMeeting = (meetingId) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
    logAction('meeting_deleted', `Deleted meeting: ${meetingId}`);
  };

  const createGroupChat = async (name, memberEmails = []) => {
    if (!currentUser) return null;
    const db = getDatabase(firebaseApp);
    const groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const membersSet = new Set([currentUser.email, ...memberEmails]);
    const members = Array.from(membersSet).filter(Boolean);

    const newGroup = {
      id: groupId,
      name: name.trim() || 'New Group',
      createdBy: currentUser.email,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.robloxUsername,
      createdAt: Date.now(),
      members
    };

    try {
      await set(ref(db, `groupChats/${groupId}`), newGroup);
      logAction('group_chat_created', `Created group chat: ${newGroup.name}`, { groupId, members });
      return newGroup;
    } catch (e) {
      console.error('Failed to create group chat:', e);
      return null;
    }
  };

  const addGroupMember = async (groupId, email) => {
    if (!groupId || !email) return;
    const db = getDatabase(firebaseApp);
    const group = (groupChats || []).find(g => g.id === groupId);
    if (!group) return;
    const members = Array.from(new Set([...(group.members || []), email]));
    try {
      await update(ref(db, `groupChats/${groupId}`), { members });
      logAction('group_member_added', `Added ${email} to group ${group.name}`, { groupId, email });
    } catch (e) {
      console.error('Failed to add group member:', e);
    }
  };

  const leaveGroupChat = async (groupId) => {
    if (!currentUser || !groupId) return;
    const db = getDatabase(firebaseApp);
    const group = (groupChats || []).find(g => g.id === groupId);
    if (!group) return;
    const remaining = (group.members || []).filter(e => e.toLowerCase() !== currentUser.email.toLowerCase());
    try {
      if (remaining.length === 0) {
        await remove(ref(db, `groupChats/${groupId}`));
      } else {
        await update(ref(db, `groupChats/${groupId}`), { members: remaining });
      }
      logAction('group_chat_left', `Left group chat ${group.name}`, { groupId });
    } catch (e) {
      console.error('Failed to leave group chat:', e);
    }
  };

  const deleteGroupChat = async (groupId) => {
    if (!groupId) return;
    const db = getDatabase(firebaseApp);
    try {
      await remove(ref(db, `groupChats/${groupId}`));
      logAction('group_chat_deleted', `Deleted group chat ${groupId}`);
    } catch (e) {
      console.error('Failed to delete group chat:', e);
    }
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

  const deduplicatedUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) return [];
    const seen = new Set();
    return users.filter(u => {
      if (!u || !u.email) return false;
      const lower = u.email.toLowerCase().trim();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [users]);

  return (
    <AppContext.Provider
      value={{
        users: deduplicatedUsers,
        activeUsers: deduplicatedUsers.filter(isActiveStaff),
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
        busyUsers,
        groupChats,
        createGroupChat,
        addGroupMember,
        leaveGroupChat,
        deleteGroupChat,
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
        removeUserNotification,
        unseenNotificationsCount,
        markNotificationsAsSeen,
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
        claimTicket,
        escalateTicket,
        closeTicket,
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
        emergencyAlertConfig,
        dispatchEmergencyAlert: (header, message, soundType = 'standard') => {
          const newAlert = {
            isActive: true,
            id: makeId('ealert'),
            header: header || 'Emergency Alert',
            message: message || '',
            soundType: soundType || (header?.toLowerCase().includes('severe') ? 'severe' : 'standard'),
            timestamp: Date.now(),
            senderName: currentUser ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Admin'
          };
          setEmergencyAlertConfig(newAlert);
          logAction('emergency_alert_dispatched', `Dispatched ${header} with ${soundType} sound: ${message}`, { header, message, soundType });
          broadcastNotification(
            `Emergency Alert: ${header || 'Priority Alert'}`,
            message || 'A priority alert has been issued for all personnel.',
            'danger',
            'general'
          );
        },
        clearEmergencyAlert: () => {
          setEmergencyAlertConfig(prev => ({ ...prev, isActive: false }));
          logAction('emergency_alert_cleared', 'Cleared emergency alert');
        },
        markFlightAttendance,
        submitFlightRegister,
        reopenFlightRegister,
        resetAllFlightQuotas,
        resetStaffQuota,
        adjustStaffQuota,
        sendNotificationToUser,
        quotaConfig,
        passDetention,
        failDetention,
        rescheduleDetention,
        updateInfraction,
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
        isDnd,
        setIsDnd,
        toggleDnd,
        broadcastNotification,
        homeworkConfig,
        setHomeworkConfig,
        updateHomeworkConfig: (newConfig) => {
          setHomeworkConfig(prev => ({ ...(prev || {}), ...newConfig }));
          const db = getDatabase(firebaseApp);
          update(ref(db, 'homeworkConfig'), newConfig).catch(err => console.error('Failed to sync homeworkConfig to Firebase:', err));
          logAction('homework_config_updated', 'Updated Google Classroom homework configuration', newConfig);
        },
        pageConfig,
        updatePageConfig: (key, value) => {
          setPageConfig(prev => {
            const updated = { ...prev, [key]: value };
            if (key === 'flightRegister') { updated.logs = value; updated.register = value; }
            if (key === 'logs') { updated.flightRegister = value; updated.register = value; }
            if (key === 'register') { updated.flightRegister = value; updated.logs = value; }
            if (key === 'adminPanel') updated.admin = value;
            if (key === 'admin') updated.adminPanel = value;
            if (key === 'flightQuotas') updated.flight_quotas = value;
            if (key === 'flight_quotas') updated.flightQuotas = value;
            if (key === 'homework') updated.homwork = value;
            if (key === 'homwork') updated.homework = value;
            return updated;
          });
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
