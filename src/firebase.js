import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpcr8iy2bNrtMmvYUNEhyq-r4VYnJFK5E",
  authDomain: "church-scheduler-94627.firebaseapp.com",
  projectId: "church-scheduler-94627",
  storageBucket: "church-scheduler-94627.firebasestorage.app",
  messagingSenderId: "646082133170",
  appId: "1:646082133170:web:8da0d344ed79b8ffd81dab",
  measurementId: "G-TFLMFSW2ZF"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent cache for faster loading
// and offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({ forceOwnership: true })
  })
});
