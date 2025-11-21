import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration from the prompt
const firebaseConfig = {
  apiKey: "AIzaSyBQek3Z7X5G-fK6DcW-jpONjC_hCECnopo",
  authDomain: "hin-languagecenter.firebaseapp.com",
  projectId: "hin-languagecenter",
  storageBucket: "hin-languagecenter.firebasestorage.app",
  messagingSenderId: "807476826021",
  appId: "1:807476826021:web:84092792ac930f6d9d224c",
  measurementId: "G-Y6WG8KCV4F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
