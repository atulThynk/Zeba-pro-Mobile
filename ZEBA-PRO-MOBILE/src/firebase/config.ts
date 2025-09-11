import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD2VhSzwSirooc2xJC0zuI64sNy1pHA5WQ",
  authDomain: "zeba-pro.firebaseapp.com",
  projectId: "zeba-pro",
  storageBucket: "zeba-pro.firebasestorage.app",
  messagingSenderId: "285769473969",
  appId: "1:285769473969:android:e1e24038b3f0e52bff2790"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };