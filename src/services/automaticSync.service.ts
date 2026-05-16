import { BusinessProfile } from '../types/businessProfile.types';
import { collection, db, query, where } from '../lib/firebase';
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
    // Ne synchroniser que si c'est un responsable et qu'il a un email
    if (!servantData.isHead || !servantData.email) {
      return;
    }

    try {
      // Trouver l'utilisateur correspondant
      const userQuery = query(collection(db, 'users'), where('email', '==', servantData.email)
      
      const { data: userData } = await userQuery;
      
      if (userData.empty) {
        console.log(`Aucun utilisateur trouvé pour ${servantData.email}, synchronisation ignorée`);
        return;
      }

      const userDoc = userData[0];
      const userData = userDocData;

      // Vérifier si l'utilisateur a déjà les bons profils
      const hasProperProfiles = userData.businessProfiles && 
        userData.businessProfiles.some((p: any) => p.type === 'department_leader') &&
        userData.businessProfiles.some((p: any) => p.type === 'shepherd');

      if (hasProperProfiles) {
        console.log(`Profils déjà configurés pour ${servantData.fullName}`);
        return;
      }

      // Créer les profils business
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

      const { error: _updateErr } = await supabase.from('users').update({
        businessProfiles,
        role: 'department_leader'
      });

      console.log(`✓ Profils synchronisés pour ${servantData.fullName}`);
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      // Ne pas bloquer la création du serviteur
    }
  }

  /**
   * Synchronise les profils après modification d'un serviteur
   */
  static async syncOnServantUpdate(
    oldData: {
      isHead: boolean;
      email?: string;
    },
    newData: {
      fullName: string;
      email: string;
      departmentId: string;
      isHead: boolean;
    }
  ): Promise<void> {
    const emailToUse = newData.email || oldData.email;
    
    if (!emailToUse) {
      return;
    }

    // Détecter les changements de statut isHead
    const wasHead = oldData.isHead;
    const isNowHead = newData.isHead;

    // Aucun changement de statut responsable
    if (wasHead === isNowHead) {
      return;
    }

    try {
      // Trouver l'utilisateur
      const userQuery = query(collection(db, 'users'), where('email', '==', emailToUse)
      
      const { data: userData } = await userQuery;
      
      if (userData.empty) {
        console.log(`Aucun utilisateur trouvé pour ${emailToUse}`);
        return;
      }

      const userDoc = userData[0];
      const userData = userDocData;

      if (isNowHead) {
        // Promotion: ajouter les profils department_leader et shepherd
        const businessProfiles: BusinessProfile[] = [
          {
            type: 'department_leader',
            departmentId: newData.departmentId,
            isActive: false
          },
          {
            type: 'shepherd',
            isActive: true
          }
        ];

        const { error: _updateErr } = await supabase.from('users').update({
          businessProfiles,
          role: 'department_leader'
        });

        console.log(`✓ ${newData.fullName} promu responsable - profils créés`);
        toast.success(`Profils synchronisés pour ${newData.fullName}`);
        
      } else {
        // Rétrogradation: retirer le profil department_leader
        const existingProfiles = userData.businessProfiles || [];
        const filteredProfiles = existingProfiles.filter(
          (p: any) => p.type !== 'department_leader'
        );

        // Déterminer le nouveau rôle
        let newRole = 'shepherd';
        if (filteredProfiles.some((p: any) => p.type === 'admin')) {
          newRole = 'admin';
        } else if (filteredProfiles.some((p: any) => p.type === 'adn')) {
          newRole = 'adn';
        }

        const { error: _updateErr } = await supabase.from('users').update({
          businessProfiles: filteredProfiles,
          role: newRole
        });

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
    servantData: {
      fullName: string;
      email?: string;
      isHead: boolean;
    }
  ): Promise<void> {
    // Ne traiter que les responsables avec email
    if (!servantData.isHead || !servantData.email) {
      return;
    }

    try {
      // Trouver l'utilisateur
      const userQuery = query(collection(db, 'users'), where('email', '==', servantData.email)
      
      const { data: userData } = await userQuery;
      
      if (userData.empty) {
        return;
      }

      const userDoc = userData[0];
      const userData = userDocData;

      // Retirer le profil department_leader
      const existingProfiles = userData.businessProfiles || [];
      const filteredProfiles = existingProfiles.filter(
        (p: any) => p.type !== 'department_leader'
      );

      // Déterminer le nouveau rôle
      let newRole = 'shepherd';
      if (filteredProfiles.some((p: any) => p.type === 'admin')) {
        newRole = 'admin';
      } else if (filteredProfiles.some((p: any) => p.type === 'adn')) {
        newRole = 'adn';
      }

      const { error: _updateErr } = await supabase.from('users').update({
        businessProfiles: filteredProfiles,
        role: newRole
      });

      console.log(`✓ Profil department_leader retiré pour ${servantData.fullName}`);
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  }
}
