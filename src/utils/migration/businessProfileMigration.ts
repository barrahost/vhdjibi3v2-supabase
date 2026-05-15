import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BusinessProfile } from '../../types/businessProfile.types';
import toast from 'react-hot-toast';

export class BusinessProfileMigration {
  /**
   * Migrates users with department_leader role to use the new business profile system
   * Offers choice between department_leader only or department_leader + shepherd
   */
  static async migrateDepartmentLeaders(): Promise<{ 
    migrated: number; 
    errors: string[]; 
  }> {
    const results = { migrated: 0, errors: [] as string[] };
    
    try {
      // Find all users with department_leader role
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'department_leader')
      );
      
      const snapshot = await getDocs(usersQuery);
      console.log(`Found ${snapshot.size} department leaders to migrate`);
      
      for (const userDoc of snapshot.docs) {
        try {
          const userData = userDoc.data();
          
          // Skip if already has business profiles
          if (userData.businessProfiles && userData.businessProfiles.length > 0) {
            console.log(`User ${userData.fullName} already has business profiles, skipping`);
            continue;
          }
          
          // Default migration: department_leader + shepherd profiles
          const businessProfiles: BusinessProfile[] = [
            {
              type: 'department_leader',
              isActive: true
            },
            {
              type: 'shepherd',
              isActive: true
            }
          ];
          
          await updateDoc(doc(db, 'users', userDoc.id), {
            businessProfiles,
            // Keep the old role for backward compatibility
            role: 'department_leader'
          });
          
          results.migrated++;
          console.log(`Migrated user: ${userData.fullName}`);
          
        } catch (error) {
          const errorMsg = `Failed to migrate user ${userDoc.id}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }
      
    } catch (error) {
      const errorMsg = `Migration failed: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }
    
    return results;
  }
  
  /**
   * Allows individual profile customization for specific users
   */
  static async updateUserProfiles(
    userId: string, 
    profiles: BusinessProfile[]
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        businessProfiles: profiles
      });
      
      console.log(`Updated business profiles for user ${userId}`);
    } catch (error) {
      throw new Error(`Failed to update user profiles: ${error}`);
    }
  }
  
  /**
   * Runs the full migration with user feedback
   */
  static async runMigration(): Promise<void> {
    const loadingToast = toast.loading('Migration des profils métier en cours...');
    
    try {
      const results = await this.migrateDepartmentLeaders();
      
      toast.dismiss(loadingToast);
      
      if (results.errors.length === 0) {
        toast.success(
          `Migration réussie ! ${results.migrated} responsables de département migrés vers le nouveau système.`
        );
      } else {
        toast.error(
          `Migration partiellement réussie. ${results.migrated} migrés, ${results.errors.length} erreurs.`
        );
        console.error('Migration errors:', results.errors);
      }
      
      console.log('Migration results:', results);
      
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Erreur lors de la migration: ${error}`);
      console.error('Migration failed:', error);
    }
  }
}
