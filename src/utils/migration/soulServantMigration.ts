import { Soul } from '../../types/database.types';
import { Servant } from '../../types/servant.types';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export class SoulServantMigration {
  /**
   * Migration script pour lier les âmes et serviteurs existants.
   * Identifie les serviteurs qui ont des âmes correspondantes et crée les liens.
   */
  static async linkExistingSoulsAndServants(): Promise<{
    linked: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let linked = 0;

    try {
      // Récupérer toutes les âmes actives
      const soulsRows = await getDocs(supabase)
        .from('souls')
        .select('*')
        .eq('status', 'active');
      if (soulsErr) throw soulsErr;

      const souls = (soulsRows ?? []).map((row: any) => ({
        ...row,
        id: row.id,
        fullName: row.full_name,
        phone: row.phone,
        isServant: row.is_servant,
        servantId: row.servant_id,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        firstVisitDate: row.first_visit_date ? new Date(row.first_visit_date) : undefined,
        promotionToServantDate: row.promotion_to_servant_date ? new Date(row.promotion_to_servant_date) : undefined,
      })) as Soul[];

      // Récupérer tous les serviteurs actifs
      const servantsRows = await getDocs(supabase)
        .from('servants')
        .select('*')
        .eq('status', 'active');
      if (servantsErr) throw servantsErr;

      const servants = (servantsRows ?? []).map((row: any) => ({
        ...row,
        id: row.id,
        fullName: row.full_name,
        phone: row.phone,
        originalSoulId: row.original_soul_id,
        createdAt: row.created_at ? new Date(row.created_at) : undefined,
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        promotionDate: row.promotion_date ? new Date(row.promotion_date) : undefined,
      })) as Servant[];

      // Identifier les correspondances potentielles
      for (const servant of servants) {
        if (servant.originalSoulId) continue;

        const matchingSoul = souls.find(soul =>
          soul.fullName.toLowerCase() === servant.fullName.toLowerCase() &&
          soul.phone === servant.phone &&
          !(soul as any).isServant
        );

        if (matchingSoul) {
          try {
            const now = new Date().toISOString();
            const promotionDate = servant.createdAt?.toISOString() ?? now;

            await Promise.all([
              supabase
                .from('servants')
                .update({ original_soul_id: matchingSoul.id, promotion_date: promotionDate, updated_at: now })
                .eq('id', servant.id),
              supabase
                .from('souls')
                .update({ is_servant: true, servant_id: servant.id, promotion_to_servant_date: promotionDate, updated_at: now })
                .eq('id', matchingSoul.id),
            ]);

            linked++;
          } catch (error) {
            errors.push(`Erreur lors de la liaison ${servant.fullName}: ${error}`);
          }
        }
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
      const promotedSouls = await getDocs(supabase)
        .from('souls')
        .select('id, full_name, servant_id, is_servant')
        .eq('is_servant', true);
      if (error) throw error;

      for (const soul of promotedSouls ?? []) {
        if (soul.servant_id) {
          const servantRows = await getDocs(supabase)
            .from('servants')
            .select('id')
            .eq('id', soul.servant_id)
            .limit(1);
          if (!servantRows || servantRows.length === 0) {
            brokenLinks.push(`Âme ${soul.full_name} (${soul.id}) référence un serviteur inexistant`);
          } else {
            validLinks++;
          }
        } else {
          brokenLinks.push(`Âme ${soul.full_name} (${soul.id}) marquée comme serviteur mais sans servantId`);
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

      const linkResult = await this.linkExistingSoulsAndServants();
      if (linkResult.errors.length > 0) {
        console.warn('Erreurs lors de la liaison:', linkResult.errors);
      }

      const validationResult = await this.validateLinks();
      if (validationResult.brokenLinks.length > 0) {
        console.warn('Liens cassés détectés:', validationResult.brokenLinks);
      }

      toast.success(
        `Migration terminée: ${linkResult.linked} liens créés, ${validationResult.validLinks} liens valides`,
        { id: 'migration' }
      );

      console.log('Résultats de migration:', {
        liensCreés: linkResult.linked,
        erreursLiaison: linkResult.errors.length,
        liensValides: validationResult.validLinks,
        liensCassés: validationResult.brokenLinks.length,
      });
    } catch (error) {
      console.error('Erreur lors de la migration complète:', error);
      toast.error('Erreur lors de la migration', { id: 'migration' });
      throw error;
    }
  }
}
