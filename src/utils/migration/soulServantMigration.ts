import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Soul } from '../../types/database.types';
import { Servant } from '../../types/servant.types';
import { toast } from 'react-hot-toast';

export class SoulServantMigration {
  /**
   * Migration script pour lier les âmes et serviteurs existants
   * Cette fonction identifie les serviteurs qui ont des âmes correspondantes
   * et crée les liens appropriés
   */
  static async linkExistingSoulsAndServants(): Promise<{
    linked: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let linked = 0;

    try {
      // Récupérer toutes les âmes actives
      const soulsSnapshot = await getDocs(
        query(collection(db, 'souls'), where('status', '==', 'active'))
      );
      const souls = soulsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        firstVisitDate: doc.data().firstVisitDate?.toDate(),
        promotionToServantDate: doc.data().promotionToServantDate?.toDate()
      })) as Soul[];

      // Récupérer tous les serviteurs actifs
      const servantsSnapshot = await getDocs(
        query(collection(db, 'servants'), where('status', '==', 'active'))
      );
      const servants = servantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        promotionDate: doc.data().promotionDate?.toDate()
      })) as Servant[];

      const batch = writeBatch(db);
      let batchSize = 0;

      // Identifier les correspondances potentielles
      for (const servant of servants) {
        // Ignorer les serviteurs qui ont déjà un lien
        if (servant.originalSoulId) continue;

        // Chercher une âme correspondante par nom et téléphone
        const matchingSoul = souls.find(soul => 
          soul.fullName.toLowerCase() === servant.fullName.toLowerCase() &&
          soul.phone === servant.phone &&
          !soul.isServant // Âme pas encore marquée comme serviteur
        );

        if (matchingSoul) {
          try {
            // Mettre à jour le serviteur avec le lien vers l'âme
            batch.update(doc(db, 'servants', servant.id), {
              originalSoulId: matchingSoul.id,
              promotionDate: servant.createdAt, // Utiliser la date de création du serviteur
              updatedAt: new Date()
            });

            // Mettre à jour l'âme avec le lien vers le serviteur
            batch.update(doc(db, 'souls', matchingSoul.id), {
              isServant: true,
              servantId: servant.id,
              promotionToServantDate: servant.createdAt,
              updatedAt: new Date()
            });

            linked++;
            batchSize += 2;

            // Exécuter le batch tous les 200 opérations (limite Firestore = 500)
            if (batchSize >= 200) {
              await batch.commit();
              batchSize = 0;
            }

          } catch (error) {
            errors.push(`Erreur lors de la liaison ${servant.fullName}: ${error}`);
          }
        }
      }

      // Exécuter le batch final s'il y a des opérations en attente
      if (batchSize > 0) {
        await batch.commit();
      }

      return { linked, errors };

    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      throw new Error(`Erreur lors de la migration: ${error}`);
    }
  }

  /**
   * Valider l'intégrité des liens après migration
   */
  static async validateLinks(): Promise<{
    validLinks: number;
    brokenLinks: string[];
  }> {
    const brokenLinks: string[] = [];
    let validLinks = 0;

    try {
      // Vérifier les âmes marquées comme serviteurs
      const promotedSouls = await getDocs(
        query(collection(db, 'souls'), where('isServant', '==', true))
      );

      for (const soulDoc of promotedSouls.docs) {
        const soul = soulDoc.data() as Soul;
        
        if (soul.servantId) {
          // Vérifier que le serviteur existe
          try {
            const servantDoc = await getDocs(
              query(collection(db, 'servants'), where('id', '==', soul.servantId))
            );
            
            if (servantDoc.empty) {
              brokenLinks.push(`Âme ${soul.fullName} (${soulDoc.id}) référence un serviteur inexistant`);
            } else {
              validLinks++;
            }
          } catch (error) {
            brokenLinks.push(`Erreur lors de la vérification de l'âme ${soul.fullName}: ${error}`);
          }
        } else {
          brokenLinks.push(`Âme ${soul.fullName} (${soulDoc.id}) marquée comme serviteur mais sans servantId`);
        }
      }

      return { validLinks, brokenLinks };

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      throw new Error(`Erreur lors de la validation: ${error}`);
    }
  }

  /**
   * Exécuter la migration complète avec validation
   */
  static async runFullMigration(): Promise<void> {
    try {
      toast.loading('Migration en cours...', { id: 'migration' });

      // Étape 1: Lier les âmes et serviteurs
      const linkResult = await this.linkExistingSoulsAndServants();
      
      if (linkResult.errors.length > 0) {
        console.warn('Erreurs lors de la liaison:', linkResult.errors);
      }

      // Étape 2: Valider les liens
      const validationResult = await this.validateLinks();
      
      if (validationResult.brokenLinks.length > 0) {
        console.warn('Liens cassés détectés:', validationResult.brokenLinks);
      }

      toast.success(
        `Migration terminée: ${linkResult.linked} liens créés, ${validationResult.validLinks} liens valides`,
        { id: 'migration' }
      );

      // Log détaillé des résultats
      console.log('Résultats de migration:', {
        liensCreés: linkResult.linked,
        erreursLiaison: linkResult.errors.length,
        liensValides: validationResult.validLinks,
        liensCassés: validationResult.brokenLinks.length
      });

    } catch (error) {
      console.error('Erreur lors de la migration complète:', error);
      toast.error('Erreur lors de la migration', { id: 'migration' });
      throw error;
    }
  }
}