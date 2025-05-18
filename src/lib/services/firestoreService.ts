
import { db } from '@/lib/firebase';
import type { Activity, SnippetDocument } from '@/types/firestore';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, where, Timestamp } from 'firebase/firestore';

const ACTIVITIES_COLLECTION = 'activities';
const SNIPPETS_COLLECTION = 'snippets';

// Activity Log Functions
export async function addActivity(
  type: Activity['type'],
  description: string,
  details?: { fileName?: string; snippetName?: string; userId?: string }
): Promise<string | null> {
  try {
    const activityData: Omit<Activity, 'id' | 'timestamp'> = {
      type,
      description,
      ...(details?.fileName && { fileName: details.fileName }),
      ...(details?.snippetName && { snippetName: details.snippetName }),
      ...(details?.userId && { userId: details.userId }),
    };
    
    const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), {
      ...activityData,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding activity to Firestore: ", error);
    return null;
  }
}

export async function getRecentActivities(count?: number): Promise<Activity[]> {
  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    let q;
    // If count is provided and greater than 0, limit the results.
    // Otherwise, fetch all activities.
    if (count && count > 0) {
      q = query(activitiesRef, orderBy("timestamp", "desc"), limit(count));
    } else {
      q = query(activitiesRef, orderBy("timestamp", "desc"));
    }
    const querySnapshot = await getDocs(q);
    
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() } as Activity);
    });
    return activities;
  } catch (error) {
    console.error("Error fetching activities: ", error);
    return [];
  }
}

// Snippet Functions
export async function addSnippetToFirestore(snippetData: Omit<SnippetDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, SNIPPETS_COLLECTION), {
      ...snippetData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding snippet to Firestore: ", error);
    return null;
  }
}

export async function getSnippetsFromFirestore(): Promise<SnippetDocument[]> {
  try {
    const snippetsRef = collection(db, SNIPPETS_COLLECTION);
    const q = query(snippetsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const snippets: SnippetDocument[] = [];
    querySnapshot.forEach((doc) => {
      snippets.push({ id: doc.id, ...doc.data() } as SnippetDocument);
    });
    return snippets;
  } catch (error) {
    console.error("Error fetching snippets: ", error);
    return [];
  }
}

export async function getSnippetFromFirestore(snippetId: string): Promise<SnippetDocument | null> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    const docSnap = await getDoc(snippetRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as SnippetDocument;
    }
    return null;
  } catch (error) {
    console.error("Error fetching snippet by ID: ", error);
    return null;
  }
}


export async function updateSnippetInFirestore(snippetId: string, updates: Partial<Omit<SnippetDocument, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    await updateDoc(snippetRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating snippet in Firestore: ", error);
    throw error; // Re-throw to handle in the component
  }
}

export async function deleteSnippetFromFirestore(snippetId: string): Promise<void> {
  try {
    const snippetRef = doc(db, SNIPPETS_COLLECTION, snippetId);
    await deleteDoc(snippetRef);
  } catch (error) {
    console.error("Error deleting snippet from Firestore: ", error);
    throw error; // Re-throw to handle in the component
  }
}
