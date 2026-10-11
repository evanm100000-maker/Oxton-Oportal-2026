const fs = require('fs');

const path = 'c:/Users/evanm/Downloads/Staff App/src/context/AppContext.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix useFirebaseArray to not use runTransaction
const newUseFirebaseArray = `const useFirebaseArray = (path, initialValue, enabled = true, limitCount = null) => {
  const [localData, setLocalData] = useState(initialValue);

  useEffect(() => {
    if (!enabled) {
      setLocalData(initialValue);
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
            normalizedData = Object.values(data);
          }
          if (Array.isArray(normalizedData)) {
            normalizedData = normalizedData.filter(item => item !== null && item !== undefined);
          }
        }
        setLocalData(normalizedData);
      } else {
        setLocalData(initialValue);
      }
    });
    return unsub;
  }, [path, initialValue, enabled]);

  // Just optimistic update, the actual Firebase writes are done in the helper functions
  const updateData = (updater) => {
    setLocalData(updater);
  };

  return [localData, updateData];
};`;

content = content.replace(/const useFirebaseArray = \([\s\S]*?return \[localData, updateData\];\n\};/m, newUseFirebaseArray);

// 2. Fix useFirebaseObject
const newUseFirebaseObject = `const useFirebaseObject = (path, initialValue, enabled = true) => {
  const [localData, setLocalData] = useState(initialValue);
  
  useEffect(() => {
    if (!enabled) {
      setLocalData(initialValue);
      return;
    }
    const db = getDatabase(firebaseApp);
    const unsub = onValue(ref(db, path), snapshot => {
      const data = snapshot.val();
      setLocalData(data ? data : initialValue);
    });
    return unsub;
  }, [path, initialValue, enabled]);

  const updateData = (updater) => {
    setLocalData(updater);
  };

  return [localData, updateData];
};`;

content = content.replace(/const useFirebaseObject = \([\s\S]*?return \[localData, updateData\];\n\};/m, newUseFirebaseObject);

const replacements = [
  // submitFlightLog
  [
    `setFlightLogs(prev => [newLog, ...prev]);`,
    `setFlightLogs(prev => [newLog, ...prev]);\n    import('firebase/database').then(({ set, ref, getDatabase }) => set(ref(getDatabase(), \`flightLogs/\${newLog.id}\`), newLog));`
  ],
  // approveFlightLog
  [
    `setFlightLogs(prev => prev.map(log => {\n      if (log.id === logId) {\n        logToApprove = log;\n        return { ...log, status: 'Approved' };\n      }\n      return log;\n    }));`,
    `setFlightLogs(prev => prev.map(log => {\n      if (log.id === logId) {\n        logToApprove = log;\n        const updated = { ...log, status: 'Approved' };\n        import('firebase/database').then(({ update, ref, getDatabase }) => update(ref(getDatabase(), \`flightLogs/\${log.id}\`), { status: 'Approved' }));\n        return updated;\n      }\n      return log;\n    }));`
  ],
  // rejectFlightLog
  [
    `setFlightLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Rejected' } : log));`,
    `setFlightLogs(prev => prev.map(log => log.id === logId ? { ...log, status: 'Rejected' } : log));\n    import('firebase/database').then(({ update, ref, getDatabase }) => update(ref(getDatabase(), \`flightLogs/\${logId}\`), { status: 'Rejected' }));`
  ]
];

replacements.forEach(([search, replace]) => {
  content = content.replace(search, replace);
});

const settersToPaths = {
  setUsers: 'users',
  setFlights: 'flights',
  setFlightLogs: 'flightLogs',
  setLoaRequests: 'loaRequests',
  setDocuments: 'documents',
  setReports: 'reports',
  setInfractions: 'infractions',
  setTasks: 'tasks',
  setTickets: 'tickets',
  setStaffNotes: 'staffNotes',
  setAuditLogs: 'auditLogs',
  setPasswordResets: 'passwordResets',
  setChatMessages: 'chatMessages',
  setAnnouncements: 'announcements',
  setPrivateChats: 'privateChats',
  setEvents: 'events',
  setApplications: 'applications'
};

for (const [setter, dbPath] of Object.entries(settersToPaths)) {
  // Add: setXXX(prev => [newObj, ...prev])
  const addRegex = new RegExp(`${setter}\\(prev => \\[\([a-zA-Z0-9_]+\), \\.\\.\\.prev\\]\\);`, 'g');
  content = content.replace(addRegex, `${setter}(prev => [$1, ...prev]);\n    import('firebase/database').then(({ set, ref, getDatabase }) => set(ref(getDatabase(), \`${dbPath}/\${$1.id || $1.email.replace(/\\./g, ',')}\`), $1));`);
  
  // Add (end): setXXX(prev => [...prev, newObj])
  const addRegex2 = new RegExp(`${setter}\\(prev => \\[\\.\\.\\.prev, \([a-zA-Z0-9_]+\)\\]\\);`, 'g');
  content = content.replace(addRegex2, `${setter}(prev => [...prev, $1]);\n    import('firebase/database').then(({ set, ref, getDatabase }) => set(ref(getDatabase(), \`${dbPath}/\${$1.id || $1.email.replace(/\\./g, ',')}\`), $1));`);

  // Delete: setXXX(prev => prev.filter(x => x.id !== id))
  const delRegex = new RegExp(`${setter}\\(prev => prev\\.filter\\(\([a-zA-Z0-9_]+\) => \\1\\.id !== \([a-zA-Z0-9_]+\)\\)\\);`, 'g');
  content = content.replace(delRegex, `${setter}(prev => prev.filter($1 => $1.id !== $2));\n    import('firebase/database').then(({ remove, ref, getDatabase }) => remove(ref(getDatabase(), \`${dbPath}/\${$2}\`)));`);

  // Delete by email: setXXX(prev => prev.filter(x => x.email !== email))
  const delRegexEmail = new RegExp(`${setter}\\(prev => prev\\.filter\\(\([a-zA-Z0-9_]+\) => \\1\\.email !== \([a-zA-Z0-9_]+\)\\)\\);`, 'g');
  content = content.replace(delRegexEmail, `${setter}(prev => prev.filter($1 => $1.email !== $2));\n    import('firebase/database').then(({ remove, ref, getDatabase }) => remove(ref(getDatabase(), \`${dbPath}/\${$2.replace(/\\./g, ',')}\`)));`);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully applied direct writes to AppContext.jsx');
