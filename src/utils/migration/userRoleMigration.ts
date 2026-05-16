import { BusinessProfile } from '../../types/businessProfile.types';
import { supabase } from '../../lib/supabase';

export class UserRoleMigration {
  static convertRoleToBusinessProfiles(role: string): BusinessProfile[] {
    const roleMap: Record<string, BusinessProfile['type']> = {
      shepherd: 'shepherd',
      intern: 'shepherd',
      adn: 'adn',
      admin: 'admin',
      pasteur: 'admin',
      super_admin: 'admin',
      department_leader: 'department_leader',
    };
    const profileType = roleMap[role];
    if (!profileType) {
      console.warn(`Unknown role: ${role}, defaulting to shepherd`);
      return [{ type: 'shepherd', isActive: true }];
    }
    return [{ type: profileType, isActive: true }];
  }

  static async migrateUser(userId: string, currentRole: string): Promise<void> {
    try {
      const businessProfiles = this.convertRoleToBusinessProfiles(currentRole);
      await supabase
        .from('users')
        .update({ business_profiles: businessProfiles, updated_at: new Date().toISOString() })
        .eq('id', userId);
      console.log(`✅ Migrated user ${userId} with role ${currentRole}`);
    } catch (error) {
      console.error(`❌ Failed to migrate user ${userId}:`, error);
      throw error;
    }
  }

  static async migrateAllUsers(): Promise<{ migrated: number; errors: string[] }> {
    const results = { migrated: 0, errors: [] as string[] };
    try {
      const { data: users, error } = await supabase.from('users').select('id, role, business_profiles');
      if (error) throw error;

      for (const user of users || []) {
        try {
          if (user.business_profiles && user.business_profiles.length > 0) continue;
          if (!user.role) { console.warn(`User ${user.id} has no role, skipping`); continue; }
          const businessProfiles = this.convertRoleToBusinessProfiles(user.role);
          await supabase
            .from('users')
            .update({ business_profiles: businessProfiles, updated_at: new Date().toISOString() })
            .eq('id', user.id);
          results.migrated++;
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
}
