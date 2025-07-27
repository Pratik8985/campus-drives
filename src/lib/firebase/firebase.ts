// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBVFhAAengO0u9WweDXZUfSGThIX-rEjlw",
  authDomain: "campus-drives-66027.firebaseapp.com",
  projectId: "campus-drives-66027",
  storageBucket: "campus-drives-66027.firebasestorage.app",
  messagingSenderId: "645899245771",
  appId: "1:645899245771:web:3e9037aa8b49b4a115234e",
  measurementId: "G-YPD306WDVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app);
// export { auth, db };
export { app as firebaseApp, auth, db }; 