/**
 * Firebase Admin Service Module
 * 
 * Initializes and manages the Firebase Admin SDK for secure server-side operations
 * in the LockMe application. Handles service account authentication and provides
 * activity logging capabilities for the server.
 * 
 * Features:
 * - Multiple initialization methods (service account JSON or application default credentials)
 * - Robust error handling for initialization failures
 * - Server-side activity logging for user actions
 * - Singleton Firestore admin instance
 */

import admin from 'firebase-admin';
import type { Activity } from '@/types/firestore';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Global Firestore admin instance
 * Initialized only once and reused across the application
 */
let adminDbInstance: admin.firestore.Firestore | null = null;

/**
 * Service account configuration sources
 */
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

/**
 * Collection constants
 */
const ACTIVITIES_COLLECTION = 'activities';

// Attempt to initialize Firebase Admin SDK only if no apps are already initialized.
if (!admin.apps.length) {
  console.log("Firebase Admin SDK: No apps initialized. Attempting initialization...");
  try {
    let serviceAccount;
    
    // Try initialization with service account JSON from environment variable
    if (serviceAccountJson) {
      console.log("Firebase Admin SDK: Found FIREBASE_SERVICE_ACCOUNT_JSON. Attempting to parse and initialize...");
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
      } catch (e: any) {
        if (e instanceof SyntaxError) {
          console.warn("Firebase Admin SDK: Initial JSON.parse failed. Attempting to fix newlines in private_key and re-parse...");
          try {
            // Attempt to fix common issue with newlines in private_key from .env
            const keyFixedJson = serviceAccountJson.replace(/\\n/g, '\\\\n');
            serviceAccount = JSON.parse(keyFixedJson);
            console.log("Firebase Admin SDK: Successfully parsed after attempting to fix newlines.");
          } catch (e2: any) {
            console.error('Firebase Admin SDK: Re-parsing after fixing newlines also failed:', e2);
            throw e2; // Re-throw the second error if still failing
          }
        } else {
          throw e; // Re-throw original error if not SyntaxError
        }
      }

      // Verify admin credential is available
      if (!admin.credential || typeof admin.credential.cert !== 'function') {
        console.error("Firebase Admin SDK Error: `admin.credential.cert` is not available or not a function. The firebase-admin SDK might be corrupted or improperly installed.");
        throw new Error("Firebase Admin SDK `admin.credential.cert` is missing.");
      }

      // Initialize with service account credentials
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK: Initialized successfully using FIREBASE_SERVICE_ACCOUNT_JSON.");

    } 
    // Try initialization with Google Application Default Credentials
    else if (googleAppCreds) {
      console.log("Firebase Admin SDK: Found GOOGLE_APPLICATION_CREDENTIALS. Attempting to initialize with Application Default Credentials...");
      
      // Verify application default credential is available
      if (!admin.credential || typeof admin.credential.applicationDefault !== 'function') {
        console.error("Firebase Admin SDK Error: `admin.credential.applicationDefault` is not available or not a function. The firebase-admin SDK might be corrupted or improperly installed.");
        throw new Error("Firebase Admin SDK `admin.credential.applicationDefault` is missing.");
      }
      
      // Initialize with application default credentials
      admin.initializeApp({
        credential: admin.credential.applicationDefault(), // This uses GOOGLE_APPLICATION_CREDENTIALS
      });
      console.log("Firebase Admin SDK: Initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.");
    } 
    // No credentials available
    else {
      console.warn("Firebase Admin SDK: Initialization skipped. Neither FIREBASE_SERVICE_ACCOUNT_JSON nor GOOGLE_APPLICATION_CREDENTIALS environment variables are set.");
    }
  } catch (error) {
    console.error('Firebase Admin SDK: Initialization error:', error);
    // If initialization fails, admin.apps.length will likely still be 0.
  }
} else {
  console.log("Firebase Admin SDK: An app is already initialized.");
}

// After attempting initialization (or if an app already existed),
// check if any app is available before getting the Firestore instance.
if (admin.apps.length > 0 && !adminDbInstance) { // Ensure we only try to get instance if not already set
  // Get the Firestore instance from the default initialized app.
  try {
    adminDbInstance = admin.firestore();
    console.log("Firebase Admin SDK: Firestore instance obtained successfully.");
  } catch (error) {
    console.error("Firebase Admin SDK: Error obtaining Firestore instance after app initialization:", error);
    adminDbInstance = null; // Ensure it's null if obtaining fails
  }
} else if (admin.apps.length === 0) {
  console.warn("Firebase Admin SDK: Firestore instance could not be obtained because no Firebase Admin app was successfully initialized or found.");
}

/**
 * Logs an activity using Admin SDK
 * 
 * Creates an activity record in Firestore using the admin credentials,
 * allowing server-side activity tracking without client authentication.
 * 
 * @param {Activity['type']} type - Type of activity being logged
 * @param {string} description - Description of the activity
 * @param {Object} details - Details about the activity and user
 * @param {string} details.userId - ID of the user who performed the activity
 * @param {string} [details.fileName] - Optional filename related to the activity
 * @param {string} [details.snippetName] - Optional snippet name related to the activity
 * @returns {Promise<string|null>} ID of the created activity document or null on error
 */
export async function logActivityWithAdmin(
  type: Activity['type'],
  description: string,
  details: { userId: string; fileName?: string; snippetName?: string }
): Promise<string | null> {
  // Verify admin Firestore instance is available
  if (!adminDbInstance) {
    console.warn("logActivityWithAdmin: Firebase Admin Firestore instance not available. Skipping activity log. Ensure Firebase Admin SDK is initialized correctly with service account credentials.");
    return null;
  }

  // Validate required userId
  if (!details.userId) {
    console.warn("logActivityWithAdmin: userId is required to log activity. Skipping.");
    return null;
  }

  // Prepare activity data with server timestamp
  const activityData: Omit<Activity, 'id' | 'timestamp'> & { timestamp: FieldValue } = {
    type,
    description,
    userId: details.userId,
    timestamp: FieldValue.serverTimestamp(),
  };

  // Add optional fields if provided
  if (details.fileName) activityData.fileName = details.fileName;
  if (details.snippetName) activityData.snippetName = details.snippetName;
  
  try {
    console.log(`logActivityWithAdmin: Preparing to add activity for userId: ${details.userId}. Data:`, JSON.stringify(activityData));
    
    // Add document to Firestore using admin credentials
    const docRef = await adminDbInstance.collection(ACTIVITIES_COLLECTION).add(activityData);
    console.log(`logActivityWithAdmin: Activity logged successfully with ID: ${docRef.id} for userId: ${details.userId}`);
    return docRef.id;
  } catch (error) {
    console.error(`logActivityWithAdmin: Error adding activity for userId: ${details.userId}. Error:`, (error as Error).message, error);
    // Do not re-throw here to prevent breaking the main AI flow if only logging fails.
    // The calling function in actions.ts already has a try-catch for this.
    return null; 
  }
}

export { adminDbInstance };
