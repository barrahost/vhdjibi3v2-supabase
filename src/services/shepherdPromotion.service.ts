import { toast } from 'react-hot-toast';
import { ServantService } from './servant.service';
import { BusinessProfile, getProfileDepartmentIds } from '../types/businessProfile.types';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export class ShepherdPromotionService {
  /**
   * Promouvoir un berger au rang de responsable de département
   */
  static async promoteToDepartmentLeader(userId: string, departmentId: string): Promise<void> {
    try {
      console.log('🔄 [ShepherdPromotion] Début de la promotion:', { userId, departmentId });

      const { data: userRows, error: userErr } = await supabase
        .from('users')
        .select('id, full_name, nickname, gender, phone, email, role, business_profiles')
        .eq('church_id', getChurchId())
        .eq('id', userId)
        .limit(1);

      if (userErr || !userRows || userRows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const userRow = userRows[0];
      console.log('📋 [ShepherdPromotion] Données utilisateur:', {
        fullName: userRow.full_name,
        currentProfiles: userRow.business_profiles,
        phone: userRow.phone,
      });

      let existingProfiles: any[] = userRow.business_profiles || [];
      if (existingProfiles.length === 0 && userRow.role) {
        const roleMap: Record<string, string> = {
          shepherd: 'shepherd', intern: 'shepherd', adn: 'adn', admin: 'admin', pasteur: 'admin',
        };
        const profileType = roleMap[userRow.role];
        if (profileType) existingProfiles = [{ type: profileType, isActive: true }];
      }

      const hasDepartmentLeaderProfile = existingProfiles.some((p: any) => p.type === 'department_leader');
      let updatedProfiles: any[];

      if (hasDepartmentLeaderProfile) {
        updatedProfiles = existingProfiles.map((profile: any) => {
          if (profile.type !== 'department_leader') return profile;
          const ids = new Set(getProfileDepartmentIds(profile));
          ids.add(departmentId);
          return { ...profile, departmentId: undefined, departmentIds: Array.from(ids), isActive: true };
        });
      } else {
        updatedProfiles = [...existingProfiles, { type: 'department_leader', departmentIds: [departmentId], isActive: true }];
      }

      console.log('📝 [ShepherdPromotion] Profils mis à jour:', updatedProfiles);

      const now = new Date().toISOString();

      // Check existing servant by email
      const { data: servantRows } = await supabase
        .from('servants')
        .select('id')
        .eq('church_id', getChurchId())
        .eq('email', userRow.email)
        .limit(1);

      if (servantRows && servantRows.length > 0) {
        await supabase.from('servants').update({
          department_id: departmentId,
          is_head: true,
          updated_at: now,
        }).eq('id', servantRows[0].id);
        console.log('🔄 [ShepherdPromotion] Mise à jour B.O.S.S existant:', servantRows[0].id);
      } else {
        const newServant = {
          full_name: userRow.full_name,
          nickname: userRow.nickname || null,
          gender: userRow.gender || 'male',
          phone: userRow.phone,
          email: userRow.email,
          department_id: departmentId,
          is_head: true,
          is_shepherd: existingProfiles.some((p: any) => p.type === 'shepherd'),
          status: 'active',
          created_at: now,
          updated_at: now,
        };
        const { data: inserted } = await supabase.from('servants').insert(newServant).select('id').single();
        console.log('➕ [ShepherdPromotion] Création nouveau B.O.S.S:', inserted?.id);
      }

      await supabase.from('users').update({
        business_profiles: updatedProfiles,
        updated_at: now,
      }).eq('id', userRow.id);

      console.log('✅ [ShepherdPromotion] Promotion réussie!');
      toast.success(`${userRow.full_name} a été promu(e) responsable de département avec succès !`);

    } catch (error) {
      console.error('❌ [ShepherdPromotion] Erreur lors de la promotion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la promotion';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Rétrograder un responsable de département
   */
  static async demoteFromDepartmentLeader(userId: string): Promise<void> {
    try {
      console.log('🔄 [ShepherdPromotion] Début de la rétrogradation:', { userId });

      const { data: userRows, error: userErr } = await supabase
        .from('users')
        .select('id, full_name, email, business_profiles')
        .eq('church_id', getChurchId())
        .eq('id', userId)
        .limit(1);

      if (userErr || !userRows || userRows.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const userRow = userRows[0];
      const updatedProfiles = (userRow.business_profiles || []).filter(
        (profile: any) => profile.type !== 'department_leader'
      );

      const now = new Date().toISOString();

      // Update servant if exists
      const { data: servantRows } = await supabase
        .from('servants')
        .select('id')
        .eq('church_id', getChurchId())
        .eq('email', userRow.email)
        .limit(1);

      if (servantRows && servantRows.length > 0) {
        await supabase.from('servants').update({ is_head: false, updated_at: now }).eq('id', servantRows[0].id);
      }

      await supabase.from('users').update({
        business_profiles: updatedProfiles,
        updated_at: now,
      }).eq('id', userRow.id);

      console.log('✅ [ShepherdPromotion] Rétrogradation réussie!');
      toast.success('Rétrogradation effectuée avec succès');

    } catch (error) {
      console.error('❌ [ShepherdPromotion] Erreur lors de la rétrogradation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la rétrogradation';
      toast.error(errorMessage);
      throw error;
    }
  }
}
