/**
 * Firebase Configuration Module
 * 
 * Initializes and exports Firebase services for use throughout the LockMe application.
 * Provides centralized access to Firestore, Authentication, and Storage services.
 * 
 * Features:
 * - Singleton Firebase app instance management
 * - Environment-based configuration via Next.js environment variables
 * - Lazy initialization of Firebase services
 * - Exports configured service instances ready for use
 */

// Firebase App Initialization
import { initializeApp, getApps, getApp } from "firebase/app";

// Firebase Services
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

/**
 * Firebase configuration object
 * Uses environment variables from Next.js for secure configuration management
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

/**
 * Initialize Firebase app instance
 * Creates a new instance or returns existing one to prevent duplicate initializations
 */
let app;
if (!getApps().length) {
  // No existing Firebase app instance, create a new one
  app = initializeApp(firebaseConfig);
} else {
  // Use existing Firebase app instance
  app = getApp();
}

/**
 * Initialize and export Firebase services
 */
// Firestore database service for data storage
const db = getFirestore(app);

// Authentication service for user management
const auth = getAuth(app);

// Storage service for file uploads and downloads
const storage = getStorage(app);

export { app, db, auth, storage };
