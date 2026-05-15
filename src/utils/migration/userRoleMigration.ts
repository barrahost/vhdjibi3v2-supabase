import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BusinessProfile } from '../../types/businessProfile.types';
import { UserRoles } from '../../types/user.types';

export class UserRoleMigration {
  /**
   * Converts legacy role system to new businessProfiles system
   */
  static convertRoleToBusinessProfiles(role: string): BusinessProfile[] {
    const roleMap: Record<string, BusinessProfile['type']> = {
      'shepherd': 'shepherd',
      'intern': 'shepherd', // interns are also shepherds
      'adn': 'adn',
      'admin': 'admin',
      'pasteur': 'admin',
      'super_admin': 'admin',
      'department_leader': 'department_leader'
    };

    const profileType = roleMap[role];
    if (!profileType) {
      console.warn(`Unknown role: ${role}, defaulting to shepherd`);
      return [{ type: 'shepherd', isActive: true }];
    }

    return [{ type: profileType, isActive: true }];
  }

  /**
   * Migrates a single user to the new system
   */
  static async migrateUser(userId: string, currentRole: string): Promise<void> {
    try {
      const businessProfiles = this.convertRoleToBusinessProfiles(currentRole);
      
      await updateDoc(doc(db, 'users', userId), {
        businessProfiles,
        // Keep the old role for backward compatibility
        role: currentRole
      });

      console.log(`✅ Migrated user ${userId} with role ${currentRole} to businessProfiles`);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Migrates all users without businessProfiles
   */
  static async migrateAllUsers(): Promise<{ migrated: number; errors: string[] }> {
    const results = { migrated: 0, errors: [] as string[] };
    
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      let batchCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        try {
          const userData = userDoc.data();
          
          // Skip if already has business profiles
          if (userData.businessProfiles && userData.businessProfiles.length > 0) {
            continue;
          }

          // Skip if no role defined
          if (!userData.role) {
            console.warn(`User ${userDoc.id} has no role, skipping`);
            continue;
          }

          const businessProfiles = this.convertRoleToBusinessProfiles(userData.role);
          
          batch.update(doc(db, 'users', userDoc.id), {
            businessProfiles,
            role: userData.role // Keep for backward compatibility
          });

          batchCount++;
          results.migrated++;

          // Commit batch every 500 operations (Firestore limit)
          if (batchCount >= 500) {
            await batch.commit();
            batchCount = 0;
          }

        } catch (error) {
          const errorMsg = `Failed to migrate user ${userDoc.id}: ${error}`;
          console.error(errorMsg);
          results.errors.push(errorMsg);
        }
      }

      // Commit remaining operations
      if (batchCount > 0) {
        await batch.commit();
      }

    } catch (error) {
      const errorMsg = `Migration failed: ${error}`;
      console.error(errorMsg);
      results.errors.push(errorMsg);
    }

    return results;
  }
}
