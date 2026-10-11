const fs = require('fs');

const path = 'c:/Users/evanm/Downloads/Staff App/src/context/AppContext.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add runTransaction to imports
content = content.replace(
  "import { firebaseApp, getDatabase, ref, onValue, set } from '../firebase';",
  "import { firebaseApp, getDatabase, ref, onValue, set, runTransaction } from '../firebase';"
);

// 2. Add custom hooks before AppProvider
const customHooks = `const useFirebaseArray = (path, initialValue) => {
  const [localData, setLocalData] = useState(initialValue);

  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const unsub = onValue(ref(db, path), snapshot => {
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
  }, [path, initialValue]);

  const updateData = (updater) => {
    setLocalData(updater);
    const db = getDatabase(firebaseApp);
    runTransaction(ref(db, path), (currentData) => {
      let currentArray = [];
      if (currentData) {
        currentArray = Array.isArray(currentData) ? currentData : Object.values(currentData);
        currentArray = currentArray.filter(item => item !== null && item !== undefined);
      } else {
        currentArray = initialValue;
      }
      return typeof updater === 'function' ? updater(currentArray) : updater;
    });
  };

  return [localData, updateData];
};

const useFirebaseObject = (path, initialValue) => {
  const [localData, setLocalData] = useState(initialValue);
  
  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const unsub = onValue(ref(db, path), snapshot => {
      const data = snapshot.val();
      setLocalData(data ? data : initialValue);
    });
    return unsub;
  }, [path, initialValue]);

  const updateData = (updater) => {
    setLocalData(updater);
    const db = getDatabase(firebaseApp);
    runTransaction(ref(db, path), (currentData) => {
      const dataToUpdate = currentData ? currentData : initialValue;
      return typeof updater === 'function' ? updater(dataToUpdate) : updater;
    });
  };

  return [localData, updateData];
};
`;

content = content.replace('export const AppProvider = ({ children }) => {', customHooks + '\nexport const AppProvider = ({ children }) => {');

// 3. Replace useState with custom hooks
const stateReplacements = {
  '  const [users, setUsers] = useState(initialUsers);': "  const [users, setUsers] = useFirebaseArray('users', initialUsers);",
  '  const [flights, setFlights] = useState(initialFlights);': "  const [flights, setFlights] = useFirebaseArray('flights', initialFlights);",
  '  const [flightLogs, setFlightLogs] = useState(initialFlightLogs);': "  const [flightLogs, setFlightLogs] = useFirebaseArray('flightLogs', initialFlightLogs);",
  '  const [loaRequests, setLoaRequests] = useState(initialLoaRequests);': "  const [loaRequests, setLoaRequests] = useFirebaseArray('loaRequests', initialLoaRequests);",
  '  const [documents, setDocuments] = useState(initialDocuments);': "  const [documents, setDocuments] = useFirebaseArray('documents', initialDocuments);",
  '  const [reports, setReports] = useState(initialReports);': "  const [reports, setReports] = useFirebaseArray('reports', initialReports);",
  '  const [infractions, setInfractions] = useState(initialInfractions);': "  const [infractions, setInfractions] = useFirebaseArray('infractions', initialInfractions);",
  '  const [tasks, setTasks] = useState(initialTasks);': "  const [tasks, setTasks] = useFirebaseArray('tasks', initialTasks);",
  '  const [tickets, setTickets] = useState(initialTickets);': "  const [tickets, setTickets] = useFirebaseArray('tickets', initialTickets);",
  '  const [staffNotes, setStaffNotes] = useState(initialStaffNotes);': "  const [staffNotes, setStaffNotes] = useFirebaseArray('staffNotes', initialStaffNotes);",
  "  const [warningConfig, setWarningConfig] = useState(initialWarningConfig);": "  const [warningConfig, setWarningConfig] = useFirebaseObject('warningConfig', initialWarningConfig);",
  "  const [maintenanceConfig, setMaintenanceConfig] = useState(initialMaintenanceConfig);": "  const [maintenanceConfig, setMaintenanceConfig] = useFirebaseObject('maintenanceConfig', initialMaintenanceConfig);",
  "  const [auditLogs, setAuditLogs] = useState([]);": "  const [auditLogs, setAuditLogs] = useFirebaseArray('auditLogs', []);",
  "  const [passwordResets, setPasswordResets] = useState([]);": "  const [passwordResets, setPasswordResets] = useFirebaseArray('passwordResets', []);",
  "  const [chatMessages, setChatMessages] = useState([]);": "  const [chatMessages, setChatMessages] = useFirebaseArray('chatMessages', []);",
  "  const [announcements, setAnnouncements] = useState(initialAnnouncements);": "  const [announcements, setAnnouncements] = useFirebaseArray('announcements', initialAnnouncements);"
};

for (const [find, replace] of Object.entries(stateReplacements)) {
  content = content.replace(find, replace);
}

// 4. Remove localStorage safeParse init for these (they are handled by hooks now)
const lsReplacements = [
  "setUsers(safeParse(localStorage, STORAGE_KEYS.users, initialUsers));",
  "setFlights(safeParse(localStorage, STORAGE_KEYS.flights, initialFlights));",
  "setFlightLogs(safeParse(localStorage, STORAGE_KEYS.flightLogs, initialFlightLogs));",
  "setLoaRequests(safeParse(localStorage, STORAGE_KEYS.loaRequests, initialLoaRequests));",
  "setDocuments(safeParse(localStorage, STORAGE_KEYS.documents, initialDocuments));",
  "setReports(safeParse(localStorage, STORAGE_KEYS.reports, initialReports));",
  "setInfractions(safeParse(localStorage, STORAGE_KEYS.infractions, initialInfractions));",
  "setTasks(safeParse(localStorage, STORAGE_KEYS.tasks, initialTasks));",
  "setTickets(safeParse(localStorage, STORAGE_KEYS.tickets, initialTickets));",
  "setStaffNotes(safeParse(localStorage, STORAGE_KEYS.staffNotes, initialStaffNotes));",
  "setWarningConfig(safeParse(localStorage, STORAGE_KEYS.warningConfig, initialWarningConfig));",
  "setMaintenanceConfig(safeParse(localStorage, STORAGE_KEYS.maintenanceConfig, initialMaintenanceConfig));",
  "setAuditLogs(safeParse(localStorage, STORAGE_KEYS.auditLogs, []));",
  "setPasswordResets(safeParse(localStorage, STORAGE_KEYS.passwordResets, []));",
  "setChatMessages(safeParse(localStorage, STORAGE_KEYS.chatMessages, []));",
  "setAnnouncements(safeParse(localStorage, STORAGE_KEYS.announcements, initialAnnouncements));"
];

for (const repl of lsReplacements) {
  content = content.replace(repl, "// " + repl);
}

// 5. Delete warningConfig and maintenanceConfig listeners
// Just match string bounds
const startIdx1 = content.indexOf('const unsubscribeWarning = onValue(warningRef');
const endIdx1 = content.indexOf('hasLoadedRef.current[\'maintenanceConfig\'] = true;') + 'hasLoadedRef.current[\'maintenanceConfig\'] = true;\n      });'.length;
if (startIdx1 !== -1 && endIdx1 > startIdx1) {
  content = content.substring(0, startIdx1) + '// Removed warning/maintenance manual listeners\n' + content.substring(endIdx1);
}

content = content.replace("if (typeof unsubscribeWarning === 'function') unsubscribeWarning();", "// ");
content = content.replace("if (typeof unsubscribeMaintenance === 'function') unsubscribeMaintenance();", "// ");

// 6. Delete massive sync blocks
const startIdx2 = content.indexOf('const skipSyncRef = useRef({');
const endIdx2 = content.indexOf("useEffect(() => { syncToFirebase('theme', theme); }, [theme]);") + "useEffect(() => { syncToFirebase('theme', theme); }, [theme]);".length;
if (startIdx2 !== -1 && endIdx2 > startIdx2) {
  content = content.substring(0, startIdx2) + '// Removed manual Firebase sync logic in favor of useFirebaseArray\n' + content.substring(endIdx2);
}

// 7. Fix any manual set() inside setWarning and setMaintenance
content = content.replaceAll("set(ref(db, 'warningConfig'), newConfig);", "// Firebase sync handled by hook");
content = content.replaceAll("set(ref(db, 'maintenanceConfig'), newConfig);", "// Firebase sync handled by hook");

// 8. Delete setupListener
const startIdx3 = content.indexOf('// Add Firebase listeners for other data collections');
const endIdx3 = content.indexOf("if (typeof unsubTheme === 'function') unsubTheme();\n      };\n    }, []);") + "if (typeof unsubTheme === 'function') unsubTheme();\n      };\n    }, []);".length;
if (startIdx3 !== -1 && endIdx3 > startIdx3) {
  content = content.substring(0, startIdx3) + '// listeners handled by useFirebaseArray\n' + content.substring(endIdx3);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refactored AppContext.jsx');
