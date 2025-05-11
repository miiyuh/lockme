import { db } from '@/lib/firebase';
import type { Activity } from '@/types/firestore';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

const ACTIVITIES_COLLECTION = 'activities';

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

export async function getRecentActivities(count: number = 10): Promise<Activity[]> {
  try {
    const activitiesRef = collection(db, ACTIVITIES_COLLECTION);
    const q = query(activitiesRef, orderBy("timestamp", "desc"), limit(count));
    const querySnapshot = await getDocs(q);
    
    const activities: Activity[] = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() } as Activity);
    });
    return activities;
  } catch (error) {
    console.error("Error fetching recent activities: ", error);
    return [];
  }
}
