
import admin from 'firebase-admin';
import type { Activity } from '@/types/firestore';
import { FieldValue } from 'firebase-admin/firestore';

let adminDbInstance: admin.firestore.Firestore | null = null;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Attempt to initialize Firebase Admin SDK only if no apps are already initialized.
if (!admin.apps.length) {
  console.log("Firebase Admin SDK: No apps initialized. Attempting initialization...");
  try {
    let serviceAccount;
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

      if (!admin.credential || typeof admin.credential.cert !== 'function') {
        console.error("Firebase Admin SDK Error: `admin.credential.cert` is not available or not a function. The firebase-admin SDK might be corrupted or improperly installed.");
        throw new Error("Firebase Admin SDK `admin.credential.cert` is missing.");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK: Initialized successfully using FIREBASE_SERVICE_ACCOUNT_JSON.");

    } else if (googleAppCreds) {
      console.log("Firebase Admin SDK: Found GOOGLE_APPLICATION_CREDENTIALS. Attempting to initialize with Application Default Credentials...");
      
      if (!admin.credential || typeof admin.credential.applicationDefault !== 'function') {
        console.error("Firebase Admin SDK Error: `admin.credential.applicationDefault` is not available or not a function. The firebase-admin SDK might be corrupted or improperly installed.");
        throw new Error("Firebase Admin SDK `admin.credential.applicationDefault` is missing.");
      }
      
      admin.initializeApp({
        credential: admin.credential.applicationDefault(), // This uses GOOGLE_APPLICATION_CREDENTIALS
      });
      console.log("Firebase Admin SDK: Initialized successfully using GOOGLE_APPLICATION_CREDENTIALS.");
    } else {
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


const ACTIVITIES_COLLECTION = 'activities';

export async function logActivityWithAdmin(
  type: Activity['type'],
  description: string,
  details: { userId: string; fileName?: string; snippetName?: string }
): Promise<string | null> {
  if (!adminDbInstance) {
    console.warn("logActivityWithAdmin: Firebase Admin Firestore instance not available. Skipping activity log. Ensure Firebase Admin SDK is initialized correctly with service account credentials.");
    return null;
  }

  if (!details.userId) {
    console.warn("logActivityWithAdmin: userId is required to log activity. Skipping.");
    return null;
  }

  const activityData: Omit<Activity, 'id' | 'timestamp'> & { timestamp: FieldValue } = {
    type,
    description,
    userId: details.userId,
    timestamp: FieldValue.serverTimestamp(),
  };

  if (details.fileName) activityData.fileName = details.fileName;
  if (details.snippetName) activityData.snippetName = details.snippetName;
  
  try {
    console.log(`logActivityWithAdmin: Preparing to add activity for userId: ${details.userId}. Data:`, JSON.stringify(activityData));
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
