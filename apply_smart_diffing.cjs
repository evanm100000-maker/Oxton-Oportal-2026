const fs = require('fs');

const path = 'c:/Users/evanm/Downloads/Staff App/src/context/AppContext.jsx';
// Revert AppContext.jsx to its original state using git checkout
require('child_process').execSync('git checkout -- "src/context/AppContext.jsx"', { cwd: 'c:/Users/evanm/Downloads/Staff App' });

let content = fs.readFileSync(path, 'utf8');

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
          }
        }
        setLocalData(normalizedData);
      } else {
        setLocalData(initialValue);
      }
    });
    return unsub;
  }, [path, initialValue, enabled]);

  const updateData = (updater) => {
    setLocalData(prev => {
      const currentArray = prev || [];
      const nextArray = typeof updater === 'function' ? updater(currentArray) : updater;
      
      const db = getDatabase(firebaseApp);
      import('firebase/database').then(({ update, ref }) => {
        const updates = {};
        
        // Find additions and modifications
        nextArray.forEach(item => {
          let fbKey = item._firebaseKey;
          if (!fbKey) {
            // New item! Use id, email, or a random string as the key
            fbKey = item.id || (item.email ? item.email.replace(/\\./g, ',') : Math.random().toString(36).substring(2, 10));
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
          update(ref(db, path), updates).catch(err => console.error('Firebase update error:', err));
        }
      });
      
      return nextArray;
    });
  };

  return [localData, updateData];
};`;

content = content.replace(/const useFirebaseArray = \([\s\S]*?return \[localData, updateData\];\n\};/m, newUseFirebaseArray);

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
    setLocalData(prev => {
      const dataToUpdate = prev ? prev : initialValue;
      const nextData = typeof updater === 'function' ? updater(dataToUpdate) : updater;
      const db = getDatabase(firebaseApp);
      import('firebase/database').then(({ set, ref }) => {
        set(ref(db, path), nextData).catch(err => console.error('Firebase set error:', err));
      });
      return nextData;
    });
  };

  return [localData, updateData];
};`;

content = content.replace(/const useFirebaseObject = \([\s\S]*?return \[localData, updateData\];\n\};/m, newUseFirebaseObject);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully applied smart diffing to AppContext.jsx');
