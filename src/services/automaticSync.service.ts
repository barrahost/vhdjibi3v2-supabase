import { BusinessProfile } from '../types/businessProfile.types';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

/**
 * Service de synchronisation automatique des profils business
 * pour les responsables de département
 */
export class AutomaticSyncService {
  /**
   * Synchronise les profils après création d'un serviteur
   */
  static async syncOnServantCreation(
    servantData: {
      fullName: string;
      email: string;
      departmentId: string;
      isHead: boolean;
    }
  ): Promise<void> {
    if (!servantData.isHead || !servantData.email) {
      return;
    }

    try {
      const { data: userRows } = await supabase
        .from('users')
        .select('id, business_profiles')
        .eq('email', servantData.email)
        .limit(1);

      if (!userRows || userRows.length === 0) {
        console.log(`Aucun utilisateur trouvé pour ${servantData.email}, synchronisation ignorée`);
        return;
      }

      const userRow = userRows[0];
      const existingProfiles = userRow.business_profiles || [];

      const hasProperProfiles =
        existingProfiles.some((p: any) => p.type === 'department_leader') &&
        existingProfiles.some((p: any) => p.type === 'shepherd');

      if (hasProperProfiles) {
        console.log(`Profils déjà configurés pour ${servantData.fullName}`);
        return;
      }

      const businessProfiles: BusinessProfile[] = [
        { type: 'department_leader', departmentId: servantData.departmentId, isActive: false },
        { type: 'shepherd', isActive: true },
      ];

      await supabase
        .from('users')
        .update({ business_profiles: businessProfiles, role: 'department_leader', updated_at: new Date().toISOString() })
        .eq('id', userRow.id);

      console.log(`✓ Profils synchronisés pour ${servantData.fullName}`);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  }

  /**
   * Synchronise les profils après modification d'un serviteur
   */
  static async syncOnServantUpdate(
    oldData: { isHead: boolean; email?: string },
    newData: { fullName: string; email: string; departmentId: string; isHead: boolean }
  ): Promise<void> {
    const emailToUse = newData.email || oldData.email;
    if (!emailToUse) return;

    const wasHead = oldData.isHead;
    const isNowHead = newData.isHead;
    if (wasHead === isNowHead) return;

    try {
      const { data: userRows } = await supabase
        .from('users')
        .select('id, business_profiles')
        .eq('email', emailToUse)
        .limit(1);

      if (!userRows || userRows.length === 0) {
        console.log(`Aucun utilisateur trouvé pour ${emailToUse}`);
        return;
      }

      const userRow = userRows[0];
      const existingProfiles: any[] = userRow.business_profiles || [];
      const now = new Date().toISOString();

      if (isNowHead) {
        const businessProfiles: BusinessProfile[] = [
          { type: 'department_leader', departmentId: newData.departmentId, isActive: false },
          { type: 'shepherd', isActive: true },
        ];
        await supabase
          .from('users')
          .update({ business_profiles: businessProfiles, role: 'department_leader', updated_at: now })
          .eq('id', userRow.id);
        console.log(`✓ ${newData.fullName} promu responsable - profils créés`);
        toast.success(`Profils synchronisés pour ${newData.fullName}`);
      } else {
        const filteredProfiles = existingProfiles.filter((p: any) => p.type !== 'department_leader');
        let newRole = 'shepherd';
        if (filteredProfiles.some((p: any) => p.type === 'admin')) newRole = 'admin';
        else if (filteredProfiles.some((p: any) => p.type === 'adn')) newRole = 'adn';
        await supabase
          .from('users')
          .update({ business_profiles: filteredProfiles, role: newRole, updated_at: now })
          .eq('id', userRow.id);
        console.log(`✓ ${newData.fullName} retiré de responsable - profil supprimé`);
        toast.success(`Profils mis à jour pour ${newData.fullName}`);
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast.error('Erreur lors de la synchronisation des profils');
    }
  }

  /**
   * Synchronise lors de la suppression d'un serviteur responsable
   */
  static async syncOnServantDeletion(
    servantData: { fullName: string; email?: string; isHead: boolean }
  ): Promise<void> {
    if (!servantData.isHead || !servantData.email) return;

    try {
      const { data: userRows } = await supabase
        .from('users')
        .select('id, business_profiles')
        .eq('email', servantData.email)
        .limit(1);

      if (!userRows || userRows.length === 0) return;

      const userRow = userRows[0];
      const existingProfiles: any[] = userRow.business_profiles || [];
      const filteredProfiles = existingProfiles.filter((p: any) => p.type !== 'department_leader');

      let newRole = 'shepherd';
      if (filteredProfiles.some((p: any) => p.type === 'admin')) newRole = 'admin';
      else if (filteredProfiles.some((p: any) => p.type === 'adn')) newRole = 'adn';

      await supabase
        .from('users')
        .update({ business_profiles: filteredProfiles, role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userRow.id);

      console.log(`✓ Profil department_leader retiré pour ${servantData.fullName}`);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  }
}
