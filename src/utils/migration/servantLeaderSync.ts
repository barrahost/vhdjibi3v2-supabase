import { BusinessProfile } from '../../types/businessProfile.types';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

export class ServantLeaderSync {
  static async syncAllDepartmentHeads(): Promise<{ synced: number; errors: string[] }> {
    const results = { synced: 0, errors: [] as string[] };
    try {
      const { data: servants, error: sErr } = await supabase
        .from('servants')
        .select('id, full_name, email, department_id')
        .eq('church_id', getChurchId())
        .eq('is_head', true)
        .eq('status', 'active');
      if (sErr) throw sErr;

      console.log(`Found ${(servants || []).length} department heads to sync`);

      for (const servant of servants || []) {
        try {
          if (!servant.email) { console.warn(`Servant ${servant.full_name} has no email, skipping`); continue; }

          const { data: userRows } = await supabase
            .from('users')
            .select('id, full_name, business_profiles')
            .eq('church_id', getChurchId())
            .eq('email', servant.email)
            .limit(1);

          if (!userRows || userRows.length === 0) {
            console.warn(`No user found for servant ${servant.full_name} (${servant.email})`);
            continue;
          }

          const user = userRows[0];
          const existing: any[] = user.business_profiles || [];
          const hasProper =
            existing.some((p: any) => p.type === 'department_leader') &&
            existing.some((p: any) => p.type === 'shepherd');

          if (hasProper) { console.log(`User ${user.full_name} already has proper profiles, skipping`); continue; }

          const businessProfiles: BusinessProfile[] = [
            { type: 'department_leader', departmentIds: [servant.department_id], isActive: false },
            { type: 'shepherd', isActive: true },
          ];

          await supabase
            .from('users')
            .update({ business_profiles: businessProfiles, role: 'department_leader', updated_at: new Date().toISOString() })
            .eq('id', user.id);

          results.synced++;
          console.log(`Synced user: ${user.full_name} with department ${servant.department_id}`);
        } catch (err) {
          const msg = `Failed to sync servant ${servant.id}: ${err}`;
          console.error(msg);
          results.errors.push(msg);
        }
      }
    } catch (error) {
      const msg = `Sync failed: ${error}`;
      console.error(msg);
      results.errors.push(msg);
    }
    return results;
  }

  static async syncSingleServant(servantEmail: string): Promise<void> {
    const { data: servants } = await supabase
      .from('servants')
      .select('id, department_id')
      .eq('church_id', getChurchId())
      .eq('email', servantEmail)
      .eq('is_head', true)
      .limit(1);
    if (!servants || servants.length === 0) throw new Error('Servant not found or not a department head');

    const servant = servants[0];
    const { data: userRows } = await supabase
      .from('users')
      .select('id')
      .eq('church_id', getChurchId())
      .eq('email', servantEmail)
      .limit(1);
    if (!userRows || userRows.length === 0) throw new Error('User not found');

    const businessProfiles: BusinessProfile[] = [
      { type: 'department_leader', departmentId: servant.department_id, isActive: false },
      { type: 'shepherd', isActive: true },
    ];
    await supabase
      .from('users')
      .update({ business_profiles: businessProfiles, role: 'department_leader', updated_at: new Date().toISOString() })
      .eq('id', userRows[0].id);
    console.log(`Successfully synced servant: ${servantEmail}`);
  }

  static async runSync(): Promise<void> {
    const loadingToast = toast.loading('Synchronisation des responsables de département...');
    try {
      const results = await this.syncAllDepartmentHeads();
      toast.dismiss(loadingToast);
      if (results.errors.length === 0) {
        toast.success(`Synchronisation réussie ! ${results.synced} responsables synchronisés.`);
      } else {
        toast.error(`Synchronisation partielle. ${results.synced} synchronisés, ${results.errors.length} erreurs.`);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(`Erreur lors de la synchronisation: ${error}`);
    }
  }
}
