// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_5aJLUEBbfinqNno9NiBcDfxn9KPMnmg",
  authDomain: "miles-messaging.firebaseapp.com",
  databaseURL: "https://miles-messaging-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "miles-messaging",
  storageBucket: "miles-messaging.firebasestorage.app",
  messagingSenderId: "49212184740",
  appId: "1:49212184740:web:6de5cdde177af587d1ae31",
  measurementId: "G-GCWW77QVVQ"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const storage = getStorage(firebaseApp);
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(firebaseApp);
}

export { firebaseApp, db, storage, analytics };