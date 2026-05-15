import { db, writeBatch } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Soul } from '../types/database.types';
import { ServantFormData } from '../types/servant.types';
import { toast } from 'react-hot-toast';

export class SoulPromotionService {
  /**
   * Promouvoir une âme au rang de serviteur
   * Cette fonction gère la transaction complète pour créer le serviteur et mettre à jour l'âme
   */
  static async promoteToServant(soulId: string, servantData: ServantFormData): Promise<string> {
    try {
      // Récupérer les données actuelles de l'âme
      const soulDoc = await getDoc(doc(db, 'souls', soulId));
      if (!soulDoc.exists()) {
        throw new Error('Âme non trouvée');
      }

      const soulDataCurrent = soulDoc.data() as Soul;
      
      // Vérifier si l'âme est déjà promue
      if (soulDataCurrent.isServant) {
        throw new Error('Cette âme est déjà promue au rang de serviteur');
      }

      // Créer un batch pour les opérations atomiques
      const batch = writeBatch(db);
      
      // Générer un ID pour le nouveau serviteur
      const servantId = doc(collection(db, 'servants')).id;
      const now = new Date();

      // Préparer les données du serviteur
      const servantDataToSave = {
        id: servantId,
        fullName: servantData.fullName || soulDataCurrent.fullName,
        nickname: servantData.nickname || soulDataCurrent.nickname,
        gender: servantData.gender || soulDataCurrent.gender,
        phone: servantData.phone || soulDataCurrent.phone,
        email: servantData.email, // Email requis pour les serviteurs
        departmentId: servantData.departmentId,
        isHead: servantData.isHead || false,
        isShepherd: servantData.isShepherd || false,
        shepherdId: servantData.shepherdId,
        status: servantData.status || 'active',
        originalSoulId: soulId, // Lien vers l'âme d'origine
        promotionDate: Timestamp.fromDate(now),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      };

      // Ajouter le serviteur à la collection
      batch.set(doc(db, 'servants', servantId), servantDataToSave);

      // Mettre à jour l'âme avec les informations de promotion
      batch.update(doc(db, 'souls', soulId), {
        isServant: true,
        servantId: servantId,
        promotionToServantDate: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now)
      });

      // Exécuter la transaction
      await batch.commit();

      console.log('✅ [SoulPromotion] Promotion réussie:', {
        soulId,
        servantId,
        fullName: soulDataCurrent.fullName,
        servantData: servantDataToSave
      });

      toast.success(`${soulDataCurrent.fullName} a été promu(e) au rang de serviteur avec succès !`);
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

    // Vérifier si l'âme a un profil spirituel approprié (optionnel)
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
      // Cette fonction pourrait être étendue pour calculer les statistiques
      // Pour l'instant, elle retourne des valeurs par défaut
      return {
        totalSouls: 0,
        promotedToServant: 0,
        eligibleForPromotion: 0
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalSouls: 0,
        promotedToServant: 0,
        eligibleForPromotion: 0
      };
    }
  }
}