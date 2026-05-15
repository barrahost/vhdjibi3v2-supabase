import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BusinessProfile } from '../../types/businessProfile.types';
import toast from 'react-hot-toast';

/**
 * Synchronizes business profiles for servants who are department heads
 * Ensures they have both 'department_leader' and 'shepherd' profiles
 */
export class ServantLeaderSync {
  /**
   * Syncs all servants with isHead=true to have proper business profiles
   */
  static async syncAllDepartmentHeads(): Promise<{ 
    synced: number; 
    errors: string[]; 
  }> {
    const results = { synced: 0, errors: [] as string[] };
    
    try {
      // Find all servants with isHead = true
      const servantsQuery = query(
        collection(db, 'servants'),
        where('isHead', '==', true),
        where('status', '==', 'active')
      );
      
      const servantsSnapshot = await getDocs(servantsQuery);
      console.log(`Found ${servantsSnapshot.size} department heads to sync`);
      
      for (const servantDoc of servantsSnapshot.docs) {
        try {
          const servantData = servantDoc.data();
          
          // Find the corresponding user by email
          if (!servantData.email) {
            console.warn(`Servant ${servantData.fullName} has no email, skipping`);
            continue;
          }
          
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', servantData.email)
          );
          
          const userSnapshot = await getDocs(usersQuery);
          
          if (userSnapshot.empty) {
            console.warn(`No user found for servant ${servantData.fullName} (${servantData.email})`);
            continue;
          }
          
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          
          // Check if user already has proper business profiles
          const hasProperProfiles = userData.businessProfiles && 
            userData.businessProfiles.some((p: any) => p.type === 'department_leader') &&
            userData.businessProfiles.some((p: any) => p.type === 'shepherd');
          
          if (hasProperProfiles) {
            console.log(`User ${userData.fullName} already has proper profiles, skipping`);
            continue;
          }
          
          // Create or update business profiles
          const businessProfiles: BusinessProfile[] = [
            {
              type: 'department_leader',
              departmentId: servantData.departmentId,
              isActive: false // Not active by default, user can switch
            },
            {
              type: 'shepherd',
              isActive: true // Shepherd profile active by default
            }
          ];
          
          await updateDoc(doc(db, 'users', userDoc.id), {
            businessProfiles,
            role: 'department_leader' // Keep for backward compatibility
          });
          
          results.synced++;
          console.log(`Synced user: ${userData.fullName} with department ${servantData.departmentId}`);
          
        } catch (error) {
          const errorMsg = `Failed to sync servant ${servantDoc.id}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
      
    } catch (error) {
      const errorMsg = `Sync failed: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }
    
    return results;
  }
  
  /**
   * Syncs a specific servant/user
   */
  static async syncSingleServant(servantEmail: string): Promise<void> {
    try {
      // Find servant
      const servantQuery = query(
        collection(db, 'servants'),
        where('email', '==', servantEmail),
        where('isHead', '==', true)
      );
      
      const servantSnapshot = await getDocs(servantQuery);
      
      if (servantSnapshot.empty) {
        throw new Error('Servant not found or not a department head');
      }
      
      const servantData = servantSnapshot.docs[0].data();
      
      // Find user
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', servantEmail)
      );
      
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        throw new Error('User not found');
      }
      
      const userDoc = userSnapshot.docs[0];
      
      // Update profiles
      const businessProfiles: BusinessProfile[] = [
        {
          type: 'department_leader',
          departmentId: servantData.departmentId,
          isActive: false
        },
        {
          type: 'shepherd',
          isActive: true
        }
      ];
      
      await updateDoc(doc(db, 'users', userDoc.id), {
        businessProfiles,
        role: 'department_leader'
      });
      
      console.log(`Successfully synced servant: ${servantEmail}`);
      
    } catch (error) {
      throw new Error(`Failed to sync servant: ${error}`);
    }
  }
  
  /**
   * Run sync with user feedback
   */
  static async runSync(): Promise<void> {
    const loadingToast = toast.loading('Synchronisation des responsables de département...');
    
    try {
      const results = await this.syncAllDepartmentHeads();
      
      toast.dismiss(loadingToast);
      
      if (results.errors.length === 0) {
        toast.success(
          `Synchronisation réussie ! ${results.synced} responsables synchronisés.`
        );
      } else {
        toast.error(
          `Synchronisation partielle. ${results.synced} synchronisés, ${results.errors.length} erreurs.`
        );
        console.error('Sync errors:', results.errors);
      }
      
      console.log('Sync results:', results);
      
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Erreur lors de la synchronisation: ${error}`);
      console.error('Sync failed:', error);
    }
  }
}
