import { db, writeBatch } from '../lib/firebase';
import { collection, doc, getDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { ServantService } from './servant.service';
import { BusinessProfile } from '../types/businessProfile.types';

export class ShepherdPromotionService {
  /**
   * Promouvoir un berger au rang de responsable de département
   * Cette fonction met à jour le profil business de l'utilisateur et crée/met à jour l'entrée serviteur
   */
  static async promoteToDepartmentLeader(
    userId: string, 
    departmentId: string
  ): Promise<void> {
    try {
      console.log('🔄 [ShepherdPromotion] Début de la promotion:', { userId, departmentId });

      // Récupérer les données de l'utilisateur
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userId)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error('Utilisateur non trouvé');
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      console.log('📋 [ShepherdPromotion] Données utilisateur:', {
        fullName: userData.fullName,
        currentProfiles: userData.businessProfiles,
        phone: userData.phone
      });

      // Handle legacy role system - convert if needed
      let existingProfiles = userData.businessProfiles || [];
      if (existingProfiles.length === 0 && userData.role) {
        // Convert legacy role to businessProfile
        const roleMap: Record<string, BusinessProfile['type']> = {
          'shepherd': 'shepherd',
          'intern': 'shepherd',
          'adn': 'adn',
          'admin': 'admin',
          'pasteur': 'admin'
        };
        const profileType = roleMap[userData.role];
        if (profileType) {
          existingProfiles = [{ type: profileType, isActive: true }];
        }
      }

      // Vérifier si l'utilisateur a déjà le profil department_leader
      const hasDepartmentLeaderProfile = existingProfiles.some(
        (p: any) => p.type === 'department_leader'
      );

      // Préparer les nouveaux profils business
      let updatedProfiles;
      if (hasDepartmentLeaderProfile) {
        // Mettre à jour le profil existant
        updatedProfiles = existingProfiles.map((profile: any) => {
          if (profile.type === 'department_leader') {
            return {
              ...profile,
              departmentId,
              isActive: true
            };
          }
          return profile;
        });
      } else {
        // Ajouter le nouveau profil
        updatedProfiles = [
          ...existingProfiles,
          {
            type: 'department_leader',
            departmentId,
            isActive: true
          }
        ];
      }

      console.log('📝 [ShepherdPromotion] Profils mis à jour:', updatedProfiles);

      // Vérifier si un serviteur existe déjà pour cet utilisateur
      const servantQuery = query(
        collection(db, 'servants'),
        where('email', '==', userData.email)
      );
      const servantSnapshot = await getDocs(servantQuery);

      const batch = writeBatch(db);
      const now = new Date();

      if (!servantSnapshot.empty) {
        // Mettre à jour le serviteur existant
        const servantDoc = servantSnapshot.docs[0];
        console.log('🔄 [ShepherdPromotion] Mise à jour serviteur existant:', servantDoc.id);
        
        batch.update(doc(db, 'servants', servantDoc.id), {
          departmentId,
          isHead: true,
          updatedAt: Timestamp.fromDate(now)
        });
      } else {
        // Créer un nouveau serviteur
        const servantId = doc(collection(db, 'servants')).id;
        console.log('➕ [ShepherdPromotion] Création nouveau serviteur:', servantId);
        
        const servantData = {
          id: servantId,
          fullName: userData.fullName,
          nickname: userData.nickname,
          gender: userData.gender || 'male',
          phone: userData.phone,
          email: userData.email,
          departmentId,
          isHead: true,
          isShepherd: userData.businessProfiles?.some((p: any) => p.type === 'shepherd') || false,
          status: 'active',
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        };

        batch.set(doc(db, 'servants', servantId), servantData);
      }

      // Mettre à jour l'utilisateur avec les nouveaux profils business
      batch.update(doc(db, 'users', userDoc.id), {
        businessProfiles: updatedProfiles,
        updatedAt: Timestamp.fromDate(now)
      });

      // Exécuter la transaction
      await batch.commit();

      console.log('✅ [ShepherdPromotion] Promotion réussie!');
      toast.success(`${userData.fullName} a été promu(e) responsable de département avec succès !`);

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

      // Récupérer les données de l'utilisateur
      const userQuery = query(
        collection(db, 'users'),
        where('uid', '==', userId)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error('Utilisateur non trouvé');
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      // Retirer le profil department_leader
      const updatedProfiles = (userData.businessProfiles || []).filter(
        (profile: any) => profile.type !== 'department_leader'
      );

      // Mettre à jour le serviteur s'il existe
      const servantQuery = query(
        collection(db, 'servants'),
        where('email', '==', userData.email)
      );
      const servantSnapshot = await getDocs(servantQuery);

      const batch = writeBatch(db);
      const now = new Date();

      if (!servantSnapshot.empty) {
        const servantDoc = servantSnapshot.docs[0];
        batch.update(doc(db, 'servants', servantDoc.id), {
          isHead: false,
          updatedAt: Timestamp.fromDate(now)
        });
      }

      // Mettre à jour l'utilisateur
      batch.update(doc(db, 'users', userDoc.id), {
        businessProfiles: updatedProfiles,
        updatedAt: Timestamp.fromDate(now)
      });

      await batch.commit();

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
