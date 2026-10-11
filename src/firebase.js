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
  apiKey: "AIzaSyBNjs7UL_7O7k8UwSHizZwQpn6Kuj7Qqs4",
  authDomain: "oxton-new-main-database.firebaseapp.com",
  databaseURL: "https://oxton-new-main-database-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "oxton-new-main-database",
  storageBucket: "oxton-new-main-database.firebasestorage.app",
  messagingSenderId: "967307028847",
  appId: "1:967307028847:web:753964ca99379a4116609a",
  measurementId: "G-SK10CQ096L"
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