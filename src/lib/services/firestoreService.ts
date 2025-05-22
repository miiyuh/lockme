
import { db, auth } from '@/lib/firebase'; 
import type { Activity, SnippetDocument } from '@/types/firestore';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, where, Timestamp, FieldValue, getDocsFromServer, deleteField } from 'firebase/firestore';

const ACTIVITIES_COLLECTION = 'activities';
const SNIPPETS_COLLECTION = 'snippets';

// Activity Log Functions
export async function addActivity(
  type: Activity['type'],
  description: string,
  details?: { userId?: string } // Removed fileName and snippetName from direct params
): Promise<string | null> {
  try {
    const activityData: Omit<Activity, 'id' | 'timestamp'> & { timestamp: FieldValue; userId?: string; } = { 
      type,
      description, // Description should contain filename/snippet name if relevant
      timestamp: serverTimestamp(),
    };
    
    if (details?.userId) {
      activityData.userId = details.userId;
      console.log(`FirestoreService: Preparing to add activity for userId: ${details.userId}. Data (fileName/snippetName fields excluded, should be in description):`, JSON.stringify(activityData));
    } else {
      console.warn("FirestoreService: Attempting to add activity WITHOUT a userId. Data (fileName/snippetName fields excluded, should be in description):", JSON.stringify(activityData));
    }
    
    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), activityData);
    console.log(`FirestoreService: Activity logged successfully with ID: ${docRef.id} for userId: ${details?.userId || 'N/A'}`);
    return docRef.id;
  } catch (error) {
    console.error(`FirestoreService: Error adding activity for userId: ${details?.userId || 'N/A'}. Error:`, error);
    throw error; 
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
      } else { 
        q = query(activitiesRef, where("userId", "==", userId), orderBy("timestamp", "desc"));
      }
      console.log(`FirestoreService: getRecentActivities called for userId: ${userId}, count: ${count === undefined ? 'ALL' : count}, fromServer: ${fromServer}.`);
    } else {
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
    return []; 
  }
}

// Snippet Functions
export async function addSnippetToFirestore(snippetData: Omit<SnippetDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, userId: string): Promise<string | null> {
  if (!userId) {
    const errorMsg = "FirestoreService: User ID is required to add a snippet.";
    console.error(errorMsg);
    throw new Error(errorMsg); 
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
    throw error; 
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
    return []; 
  }
}

export async function getSnippetFromFirestore(snippetId: string): Promise<SnippetDocument | null> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    console.log(`FirestoreService: Fetching snippet by ID: ${snippetId}.`);
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


export async function updateSnippetInFirestore(snippetId: string, updates: Partial<Omit<SnippetDocument, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
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
    console.log(`FirestoreService: Deleting snippet ID: ${snippetId}.`);
    await deleteDoc(snippetRef);
    console.log(`FirestoreService: Snippet ID: ${snippetId} deleted successfully.`);
  } catch (error) {
    console.error(`FirestoreService: Error deleting snippet ID ${snippetId}: `, error);
    throw error; 
  }
}
