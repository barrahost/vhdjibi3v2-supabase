import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Increments the play count for an audio teaching
 * @param teachingId - The ID of the teaching to update
 * @returns Promise that resolves when the update is complete
 */
export async function incrementPlayCount(teachingId: string): Promise<void> {
  try {
    const teachingRef = doc(db, 'teachings', teachingId);
    console.log(`Incrementing play count for audio ${teachingId}`);
    
    // First check if the teaching exists and has a plays field
    const teachingDoc = await getDoc(teachingRef);
    
    if (teachingDoc.exists()) {
      const currentCount = teachingDoc.data().plays || 0;
      
      // If plays field doesn't exist, initialize it to 1, otherwise increment it
      if (currentCount === undefined) {
        console.log(`Initializing play count to 1`);
        await updateDoc(teachingRef, { plays: 1 });
      } else {
        console.log(`Incrementing play count from ${currentCount}`);
        await updateDoc(teachingRef, { plays: increment(1) });
      }
    }
  } catch (error) {
    console.error('Error incrementing play count:', error);
  }
}