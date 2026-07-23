import { Soul } from '../types/database.types';
import { ServantFormData } from '../types/servant.types';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export class SoulPromotionService {
  /**
   * Promouvoir une âme au rang de serviteur
   */
  static async promoteToServant(soulId: string, servantData: ServantFormData): Promise<string> {
    try {
      const { data: soulRow, error: soulErr } = await supabase
        .from('souls')
        .select('*')
        .eq('church_id', getChurchId())
        .eq('id', soulId)
        .single();

      if (soulErr || !soulRow) {
        throw new Error('Âme non trouvée');
      }

      const soulDataCurrent = soulRow as any;

      if (soulDataCurrent.is_servant) {
        throw new Error('Cette âme est déjà promue au rang de serviteur');
      }

      const now = new Date().toISOString();

      // Insert servant
      const servantPayload = {
        full_name: servantData.fullName || soulDataCurrent.full_name,
        nickname: servantData.nickname || soulDataCurrent.nickname,
        gender: servantData.gender || soulDataCurrent.gender,
        phone: servantData.phone || soulDataCurrent.phone,
        email: servantData.email,
        department_ids: servantData.departmentIds || [],
        is_head: servantData.isHead || false,
        is_shepherd: servantData.isShepherd || false,
        shepherd_id: servantData.shepherdId || null,
        status: servantData.status || 'active',
        original_soul_id: soulId,
        promotion_date: now,
        created_at: now,
        updated_at: now,
      };

      const { data: newServant, error: servantErr } = await supabase
        .from('servants')
        .insert(servantPayload)
        .select('id')
        .single();

      if (servantErr || !newServant) {
        throw new Error('Erreur lors de la création du serviteur');
      }

      const servantId = newServant.id;

      // Update soul
      await supabase.from('souls').update({
        is_servant: true,
        servant_id: servantId,
        promotion_to_servant_date: now,
        updated_at: now,
      }).eq('id', soulId);

      console.log('✅ [SoulPromotion] Promotion réussie:', { soulId, servantId });
      toast.success(`${soulDataCurrent.full_name} a été promu(e) au rang de serviteur avec succès !`);
      return servantId;

    } catch (error) {
      console.error('Erreur lors de la promotion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la promotion au rang de serviteur';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Vérifier si une âme peut être promue au rang de serviteur
   */
  static canBePromoted(soul: Soul): { canPromote: boolean; reason?: string } {
    if (soul.isServant) {
      return { canPromote: false, reason: 'Cette âme est déjà serviteur' };
    }
    if (soul.status !== 'active') {
      return { canPromote: false, reason: 'Seules les âmes actives peuvent être promues' };
    }
    if (!soul.spiritualProfile?.isBornAgain) {
      return { canPromote: false, reason: 'L\'âme doit être née de nouveau pour devenir serviteur' };
    }
    return { canPromote: true };
  }

  /**
   * Obtenir les statistiques de promotion pour un berger
   */
  static async getPromotionStats(shepherdId: string): Promise<{
    totalSouls: number;
    promotedToServant: number;
    eligibleForPromotion: number;
  }> {
    try {
      return { totalSouls: 0, promotedToServant: 0, eligibleForPromotion: 0 };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return { totalSouls: 0, promotedToServant: 0, eligibleForPromotion: 0 };
    }
  }
}
