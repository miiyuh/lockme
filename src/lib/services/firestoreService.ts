
import { db, auth } from '@/lib/firebase'; // Ensure auth is imported if needed, though not directly used here
import type { Activity, SnippetDocument } from '@/types/firestore';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, where, Timestamp, FieldValue, getDocsFromServer, deleteField } from 'firebase/firestore';

const ACTIVITIES_COLLECTION = 'activities';
const SNIPPETS_COLLECTION = 'snippets';

// Activity Log Functions
export async function addActivity(
  type: Activity['type'],
  description: string,
  details?: { fileName?: string; snippetName?: string; userId?: string }
): Promise<string | null> {
  try {
    const activityData: Omit<Activity, 'id' | 'timestamp'> & { timestamp: FieldValue; userId?: string; fileName?: string; snippetName?: string; } = {
      type,
      description,
      timestamp: serverTimestamp(),
    };
    
    if (details?.fileName) activityData.fileName = details.fileName;
    if (details?.snippetName) activityData.snippetName = details.snippetName;
    
    if (details?.userId) {
      activityData.userId = details.userId;
      console.log(`FirestoreService: Preparing to add activity for userId: ${details.userId}. Data:`, JSON.stringify(activityData));
    } else {
      // If this app strictly requires userId for activities as per rules, this path should ideally not be taken.
      // However, if global activities were ever intended, this log helps.
      // Given current rules, an activity without userId will fail 'create' if rules enforce userId presence.
      console.warn("FirestoreService: Attempting to add activity WITHOUT a userId. This might fail if rules require userId. Data:", JSON.stringify(activityData));
    }
    
    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
    console.log(`FirestoreService: Activity logged successfully with ID: ${docRef.id} for userId: ${details?.userId || 'N/A'}`);
    return docRef.id;
  } catch (error) {
    console.error(`FirestoreService: Error adding activity for userId: ${details?.userId || 'N/A'}. Error:`, error);
    throw error; // Re-throw the error to be caught by the caller
  }
}


export async function getRecentActivities(userId?: string | null, count?: number, fromServer: boolean = false): Promise<Activity[]> {
  const fetchFn = fromServer ? getDocsFromServer : getDocs;
  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    let q;

    if (userId) {
      if (count && count > 0) {
        q = query(activitiesRef, where("userId", "==", userId), orderBy("timestamp", "desc"), limit(count));
      } else { // Fetch all for this user if count is not specified or 0/undefined
        q = query(activitiesRef, where("userId", "==", userId), orderBy("timestamp", "desc"));
      }
      console.log(`FirestoreService: getRecentActivities called for userId: ${userId}, count: ${count}, fromServer: ${fromServer}.`);
    } else {
      // If no userId is provided, for user-specific views, we should return an empty array.
      // Avoid fetching global activities unless explicitly intended (e.g., an admin panel).
      console.log(`FirestoreService: getRecentActivities called without userId. Returning empty array for user-specific view.`);
      return [];
    }
    
    const querySnapshot = await fetchFn(q);
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() } as Activity);
    });
    console.log(`FirestoreService: getRecentActivities returning ${activities.length} activities for userId: ${userId}`);
    return activities;
  } catch (error) {
    console.error(`FirestoreService: Error fetching activities for userId ${userId}: `, error);
    return []; // Return empty array on error
  }
}

// Snippet Functions
export async function addSnippetToFirestore(snippetData: Omit<SnippetDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, userId: string): Promise<string | null> {
  if (!userId) {
    console.error("FirestoreService: User ID is required to add a snippet.");
    throw new Error("User ID is required to add a snippet."); // Throw error
  }
  try {
    console.log(`FirestoreService: Adding snippet for userId: ${userId}. Data:`, snippetData);
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
    throw error; // Re-throw
  }
}

export async function getSnippetsFromFirestore(userId: string, fromServer: boolean = false): Promise<SnippetDocument[]> {
   if (!userId) {
    console.warn("FirestoreService: Attempted to fetch snippets without a user ID. Returning empty array.");
    return [];
  }
  const fetchFn = fromServer ? getDocsFromServer : getDocs;
  try {
    const snippetsRef = collection(db, SNIPPETS_COLLECTION);
    const q = query(snippetsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    console.log(`FirestoreService: Fetching snippets for userId: ${userId}, fromServer: ${fromServer}.`);
    const querySnapshot = await fetchFn(q);
    
    const snippets: SnippetDocument[] = [];
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
    return []; // Return empty on error
  }
}

export async function getSnippetFromFirestore(snippetId: string): Promise<SnippetDocument | null> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    const docSnap = await getDoc(snippetRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // TODO: Add ownership check if a userId is available from context
      // This function is not currently used by components that have user context directly.
      // If used where user context is available, an ownership check (doc.data().userId === currentUser.uid) should be added.
      return { 
        id: docSnap.id, 
        ...data,
        tags: data.tags || [] 
      } as SnippetDocument;
    }
    return null;
  } catch (error) {
    console.error("FirestoreService: Error fetching snippet by ID: ", error);
    return null;
  }
}


export async function updateSnippetInFirestore(snippetId: string, updates: Partial<Omit<SnippetDocument, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    // Firestore security rules should handle ownership check based on the authenticated user trying to update.
    // The component calling this should only allow updates if the snippet belongs to the current user.
    console.log(`FirestoreService: Updating snippet ID: ${snippetId}. Updates:`, updates);
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

export async function deleteSnippetFromFirestore(snippetId: string): Promise<void> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    // Firestore security rules should handle ownership.
    console.log(`FirestoreService: Deleting snippet ID: ${snippetId}.`);
    await deleteDoc(snippetRef);
    console.log(`FirestoreService: Snippet ID: ${snippetId} deleted successfully.`);
  } catch (error) {
    console.error(`FirestoreService: Error deleting snippet ID ${snippetId}: `, error);
    throw error; 
  }
}

