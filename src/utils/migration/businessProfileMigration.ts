import { BusinessProfile } from '../../types/businessProfile.types';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

export class BusinessProfileMigration {
  static async migrateDepartmentLeaders(): Promise<{ migrated: number; errors: string[] }> {
    const results = { migrated: 0, errors: [] as string[] };
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, full_name, business_profiles')
        .eq('church_id', getChurchId())
        .eq('role', 'department_leader');
      if (error) throw error;

      console.log(`Found ${(users || []).length} department leaders to migrate`);

      for (const user of users || []) {
        try {
          if (user.business_profiles && user.business_profiles.length > 0) {
            console.log(`User ${user.full_name} already has business profiles, skipping`);
            continue;
          }
          const businessProfiles: BusinessProfile[] = [
            { type: 'department_leader', isActive: true },
            { type: 'shepherd', isActive: true },
          ];
          await supabase
            .from('users')
            .update({ business_profiles: businessProfiles, updated_at: new Date().toISOString() })
            .eq('id', user.id);
          results.migrated++;
          console.log(`Migrated user: ${user.full_name}`);
        } catch (err) {
          const msg = `Failed to migrate user ${user.id}: ${err}`;
          console.error(msg);
          results.errors.push(msg);
        }
      }
    } catch (error) {
      const msg = `Migration failed: ${error}`;
      console.error(msg);
      results.errors.push(msg);
    }
    return results;
  }

  static async updateUserProfiles(userId: string, profiles: BusinessProfile[]): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ business_profiles: profiles, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw new Error(`Failed to update user profiles: ${error.message}`);
    console.log(`Updated business profiles for user ${userId}`);
  }

  static async runMigration(): Promise<void> {
    const loadingToast = toast.loading('Migration des profils métier en cours...');
    try {
      const results = await this.migrateDepartmentLeaders();
      toast.dismiss(loadingToast);
      if (results.errors.length === 0) {
        toast.success(`Migration réussie ! ${results.migrated} responsables de département migrés.`);
      } else {
        toast.error(`Migration partiellement réussie. ${results.migrated} migrés, ${results.errors.length} erreurs.`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Erreur lors de la migration: ${error}`);
    }
  }
}
