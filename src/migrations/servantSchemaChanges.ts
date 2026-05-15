import { collection, query, where, getDocs, doc, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

/**
 * Migration script to implement the servant management schema changes
 * This script will:
 * 1. Create a 'servants' collection for all servants (including shepherds who are servants)
 * 2. Add necessary fields to track department assignments and leadership roles
 */
/**
 * Migration script to implement the servant management schema changes
 * This script will:
 * 1. Create a 'servants' collection for all servants (including shepherds who are servants)
 * 2. Add necessary fields to track department assignments and leadership roles
 */
export async function migrateToServantSchema() {
  try {
    let batch = writeBatch(db);
    let operationsCount = 0;
    const BATCH_LIMIT = 500;
    
    // Step 1: Create the 'servants' collection if it doesn't exist
    // Note: In Firestore, collections are created implicitly when documents are added
    
    // Step 2: Migrate existing shepherds who should also be servants
    const shepherdsQuery = query(
      collection(db, 'users'),
      where('role', 'in', ['shepherd', 'intern']),
      where('status', '==', 'active')
    );
    
    const shepherdsSnapshot = await getDocs(shepherdsQuery);
    
    // Track migration statistics
    let shepherdsMigrated = 0;
    let shepherdsSkipped = 0;
    
    // For each shepherd, check if they already exist in the servants collection
    for (const shepherdDoc of shepherdsSnapshot.docs) {
      const shepherdData = shepherdDoc.data();
      
      // Check if this shepherd already exists in the servants collection
      const existingServantQuery = query(
        collection(db, 'servants'),
        where('phone', '==', shepherdData.phone)
      );
      
      const existingServantSnapshot = await getDocs(existingServantQuery);
      
      if (!existingServantSnapshot.empty) {
        // Shepherd already exists as a servant, update their record
        const servantDoc = existingServantSnapshot.docs[0];
        const servantData = servantDoc.data();
        
        // Update the servant record to link it to the shepherd
        batch.update(doc(db, 'servants', servantDoc.id), {
          isShepherd: true,
          shepherdId: shepherdDoc.id,
          updatedAt: new Date()
        });
        
        operationsCount++;
        shepherdsSkipped++;
      } else {
        // Create a new servant record for this shepherd
        const servantData = {
          fullName: shepherdData.fullName,
          nickname: shepherdData.nickname || null,
          gender: shepherdData.gender || 'male', // Default to male if not specified
          phone: shepherdData.phone,
          email: shepherdData.email,
          isShepherd: true,
          shepherdId: shepherdDoc.id,
          departmentId: null, // Will be assigned later
          isHead: false, // Will be updated later if they are a department head
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Add the new servant document
        const servantRef = doc(collection(db, 'servants'));
        batch.set(servantRef, servantData);
        
        operationsCount++;
        shepherdsMigrated++;
      }
      
      // Commit the batch if we've reached the limit
      if (operationsCount >= BATCH_LIMIT) {
        await batch.commit();
        operationsCount = 0;
        // Create a new batch
        batch = writeBatch(db);
      }
    }
    
    // Commit any remaining operations
    if (operationsCount > 0) {
      await batch.commit();
    }
    
    return {
      success: true,
      stats: {
        shepherdsMigrated,
        shepherdsSkipped
      }
    };
  } catch (error) {
    console.error('Error migrating to servant schema:', error);
    toast.error('Erreur lors de la migration du schéma des serviteurs');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Function to run the migration and display results
 */
export async function runServantSchemaMigration() {
  toast.loading('Migration en cours...');
  
  try {
    const result = await migrateToServantSchema();
    
    if (result.success) {
      toast.success(`Migration réussie: ${result.stats?.shepherdsMigrated || 0} berger(s) migré(s), ${result.stats?.shepherdsSkipped || 0} déjà existant(s)`);
    } else {
      toast.error(`Échec de la migration: ${result.error}`);
    }
  } catch (error) {
    console.error('Error running migration:', error);
    toast.error('Erreur lors de l\'exécution de la migration');
  }
}