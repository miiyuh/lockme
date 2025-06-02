/**
 * Firestore Service Module
 * 
 * A collection of utility functions for interacting with Firebase Firestore database.
 * Handles activities logging and snippet management for the LockMe application.
 * 
 * Features:
 * - Activity logging with user attribution
 * - Secure snippet storage and retrieval
 * - Document creation, reading, updating, and deletion
 * - Server-side or client-side data fetching options
 */

// Firebase imports
import { db, auth } from '@/lib/firebase'; 
import { 
  collection, addDoc, query, orderBy, limit, getDocs, 
  serverTimestamp, doc, updateDoc, deleteDoc, getDoc, 
  where, Timestamp, FieldValue, getDocsFromServer, deleteField 
} from 'firebase/firestore';

// Type imports
import type { Activity, SnippetDocument } from '@/types/firestore';

/**
 * Collection constants
 */
const ACTIVITIES_COLLECTION = 'activities';
const SNIPPETS_COLLECTION = 'snippets';

/**
 * Activity Log Functions
 */

/**
 * Adds a new activity record to Firestore
 * 
 * @param {Activity['type']} type - Type of activity being logged
 * @param {string} description - Description of the activity
 * @param {Object} details - Optional details about the activity
 * @param {string} [details.userId] - User ID who performed the activity
 * @returns {Promise<string|null>} ID of the created activity document or null on error
 */
export async function addActivity(
  type: Activity['type'],
  description: string,
  details?: { userId?: string }
): Promise<string | null> {
  try {
    // Prepare activity data with server timestamp
    const activityData: Omit<Activity, 'id' | 'timestamp'> & { timestamp: FieldValue; userId?: string; } = { 
      type,
      description,
      timestamp: serverTimestamp(),
    };
    
    // Add user ID if available
    if (details?.userId) {
      activityData.userId = details.userId;
      console.log(`FirestoreService: Preparing to add activity for userId: ${details.userId}. Data (fileName/snippetName fields excluded, should be in description):`, JSON.stringify(activityData));
    } else {
      console.warn("FirestoreService: Attempting to add activity WITHOUT a userId. Data (fileName/snippetName fields excluded, should be in description):", JSON.stringify(activityData));
    }
    
    // Add document to Firestore
    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
    console.log(`FirestoreService: Activity logged successfully with ID: ${docRef.id} for userId: ${details?.userId || 'N/A'}`);
    return docRef.id;
  } catch (error) {
    console.error(`FirestoreService: Error adding activity for userId: ${details?.userId || 'N/A'}. Error:`, error);
    throw error; 
  }
}

/**
 * Retrieves recent activities for a specific user
 * 
 * @param {string|null} [userId] - User ID to filter activities
 * @param {number} [count] - Maximum number of activities to retrieve
 * @param {boolean} [fromServer=false] - Whether to fetch from server or cache
 * @returns {Promise<Activity[]>} Array of activities
 */
export async function getRecentActivities(userId?: string | null, count?: number, fromServer: boolean = false): Promise<Activity[]> {
  // Determine fetch function based on fromServer flag
  const fetchFn = fromServer ? getDocsFromServer : getDocs;
  
  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    let q;

    // Build query based on parameters
    if (userId) {
      if (count && count > 0) {
        q = query(activitiesRef, where("userId", "==", userId), orderBy("timestamp", "desc"), limit(count));
      } else { 
        q = query(activitiesRef, where("userId", "==", userId), orderBy("timestamp", "desc"));
      }
      console.log(`FirestoreService: getRecentActivities called for userId: ${userId}, count: ${count === undefined ? 'ALL' : count}, fromServer: ${fromServer}.`);
    } else {
      console.log(`FirestoreService: getRecentActivities called without userId. Returning empty array for user-specific view.`);
      return [];
    }
    
    // Execute query
    const querySnapshot = await fetchFn(q);
    const activities: Activity[] = [];
    
    // Convert documents to Activity objects
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() } as Activity);
    });
    
    console.log(`FirestoreService: getRecentActivities returning ${activities.length} activities for userId: ${userId}`);
    return activities;
  } catch (error) {
    console.error(`FirestoreService: Error fetching activities for userId ${userId}: `, error);
    return []; 
  }
}

/**
 * Snippet Functions
 */

/**
 * Adds a new snippet to Firestore
 * 
 * @param {Omit<SnippetDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'>} snippetData - Snippet data to store
 * @param {string} userId - User ID who owns the snippet
 * @returns {Promise<string|null>} ID of the created snippet or null on error
 */
export async function addSnippetToFirestore(
  snippetData: Omit<SnippetDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, 
  userId: string
): Promise<string | null> {
  // Validate user ID
  if (!userId) {
    const errorMsg = "FirestoreService: User ID is required to add a snippet.";
    console.error(errorMsg);
    throw new Error(errorMsg); 
  }
  
  try {
    console.log(`FirestoreService: Adding snippet for userId: ${userId}. Data:`, snippetData);
    
    // Add document with timestamps
    const docRef = await addDoc(collection(db, SNIPPETS_COLLECTION), {
      ...snippetData,
      userId, 
      tags: snippetData.tags || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`FirestoreService: Snippet added successfully with ID: ${docRef.id} for userId: ${userId}`);
    return docRef.id;
  } catch (error) {
    console.error(`FirestoreService: Error adding snippet for userId ${userId}: `, error);
    throw error; 
  }
}

/**
 * Retrieves all snippets for a specific user
 * 
 * @param {string} userId - User ID to filter snippets
 * @param {boolean} [fromServer=false] - Whether to fetch from server or cache
 * @returns {Promise<SnippetDocument[]>} Array of snippet documents
 */
export async function getSnippetsFromFirestore(userId: string, fromServer: boolean = false): Promise<SnippetDocument[]> {
  // Validate user ID
  if (!userId) {
    console.warn("FirestoreService: Attempted to fetch snippets without a user ID. Returning empty array.");
    return [];
  }
  
  // Determine fetch function based on fromServer flag
  const fetchFn = fromServer ? getDocsFromServer : getDocs;
  
  try {
    const snippetsRef = collection(db, SNIPPETS_COLLECTION);
    const q = query(snippetsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    console.log(`FirestoreService: Fetching snippets for userId: ${userId}, fromServer: ${fromServer}.`);
    
    // Execute query
    const querySnapshot = await fetchFn(q);
    
    const snippets: SnippetDocument[] = [];
    
    // Convert documents to SnippetDocument objects
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      snippets.push({ 
        id: doc.id, 
        ...data,
        tags: data.tags || [] 
      } as SnippetDocument);
    });
    
    console.log(`FirestoreService: Fetched ${snippets.length} snippets for userId: ${userId}`);
    return snippets;
  } catch (error) {
    console.error(`FirestoreService: Error fetching snippets for userId ${userId}: `, error);
    return []; 
  }
}

/**
 * Retrieves a specific snippet by ID
 * 
 * @param {string} snippetId - ID of the snippet to retrieve
 * @returns {Promise<SnippetDocument|null>} Snippet document or null if not found
 */
export async function getSnippetFromFirestore(snippetId: string): Promise<SnippetDocument | null> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    console.log(`FirestoreService: Fetching snippet by ID: ${snippetId}.`);
    
    // Get document
    const docSnap = await getDoc(snippetRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log(`FirestoreService: Snippet ID: ${snippetId} fetched successfully.`);
      
      return { 
        id: docSnap.id, 
        ...data,
        tags: data.tags || [] 
      } as SnippetDocument;
    }
    
    console.log(`FirestoreService: Snippet ID: ${snippetId} does not exist.`);
    return null;
  } catch (error) {
    console.error(`FirestoreService: Error fetching snippet by ID ${snippetId}: `, error);
    return null;
  }
}

/**
 * Updates an existing snippet in Firestore
 * 
 * @param {string} snippetId - ID of the snippet to update
 * @param {Partial<Omit<SnippetDocument, 'id' | 'createdAt' | 'userId'>>} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateSnippetInFirestore(
  snippetId: string, 
  updates: Partial<Omit<SnippetDocument, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    console.log(`FirestoreService: Updating snippet ID: ${snippetId}. Updates:`, updates);
    
    // Update document with new timestamp
    await updateDoc(snippetRef, {
      ...updates,
      ...(updates.tags && { tags: Array.isArray(updates.tags) ? updates.tags : [] }),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`FirestoreService: Snippet ID: ${snippetId} updated successfully.`);
  } catch (error) {
    console.error(`FirestoreService: Error updating snippet ID ${snippetId}: `, error);
    throw error; 
  }
}

/**
 * Deletes a snippet from Firestore
 * 
 * @param {string} snippetId - ID of the snippet to delete
 * @returns {Promise<void>}
 */
export async function deleteSnippetFromFirestore(snippetId: string): Promise<void> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    console.log(`FirestoreService: Deleting snippet ID: ${snippetId}.`);
    
    // Delete document
    await deleteDoc(snippetRef);
    
    console.log(`FirestoreService: Snippet ID: ${snippetId} deleted successfully.`);
  } catch (error) {
    console.error(`FirestoreService: Error deleting snippet ID ${snippetId}: `, error);
    throw error; 
  }
}
