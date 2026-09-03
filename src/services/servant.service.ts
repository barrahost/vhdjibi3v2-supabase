import { Servant, ServantFormData } from '../types/servant.types';
import { validatePhoneNumber } from '../utils/phoneValidation';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export interface ImportResult {
  imported: number;
  skipped: Array<{ name: string; reason: string }>;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function rowToServant(row: any): Servant {
  return {
    id: row.id,
    fullName: row.full_name,
    nickname: row.nickname,
    gender: row.gender,
    phone: row.phone,
    email: row.email,
    departmentIds: row.department_ids || [],
    familyId: row.family_id || undefined,
    isHead: row.is_head,
    isShepherd: row.is_shepherd,
    shepherdId: row.shepherd_id,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    sourceType: row.source_type,
    sourceId: row.source_id,
    originalSoulId: row.original_soul_id,
    promotionDate: row.promotion_date ? new Date(row.promotion_date) : undefined,
  };
}

function formToRow(data: Partial<ServantFormData>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.fullName !== undefined)        row.full_name        = data.fullName.trim();
  if (data.nickname !== undefined)        row.nickname         = data.nickname?.trim() || null;
  if (data.gender !== undefined)          row.gender           = data.gender;
  if (data.phone !== undefined)           row.phone            = data.phone;
  if (data.email !== undefined)           row.email            = data.email?.trim() || null;
  if (data.departmentIds !== undefined)   row.department_ids   = data.departmentIds;
  if (data.familyId !== undefined)        row.family_id        = data.familyId || null;
  if (data.isHead !== undefined)          row.is_head          = data.isHead;
  if (data.isShepherd !== undefined)      row.is_shepherd      = data.isShepherd;
  if (data.shepherdId !== undefined)      row.shepherd_id      = data.shepherdId;
  if (data.status !== undefined)          row.status           = data.status;
  if (data.sourceType !== undefined)      row.source_type      = data.sourceType;
  if (data.sourceId !== undefined)        row.source_id        = data.sourceId;
  if (data.originalSoulId !== undefined)  row.original_soul_id = data.originalSoulId;
  if (data.promotionDate !== undefined)   row.promotion_date   = data.promotionDate?.toISOString() ?? null;
  return row;
}

// ─── ServantService ───────────────────────────────────────────────────────────

export class ServantService {
  /**
   * Create a new servant
   */
  static async createServant(data: ServantFormData): Promise<string> {
    try {
      const deptIds = data.departmentIds || [];

      // Vérifier si la personne existe déjà (même téléphone) → upsert
      const { data: existing } = await supabase
        .from('servants')
        .select('id, department_ids, family_id')
        .eq('church_id', getChurchId())
        .eq('phone', data.phone)
        .limit(1);

      if (existing && existing.length > 0) {
        // La personne existe : on ajoute simplement les nouveaux départements
        const existingDepts: string[] = existing[0].department_ids || [];
        const merged = [...new Set([...existingDepts, ...deptIds])];
        const { error } = await supabase
          .from('servants')
          .update({
            department_ids: merged,
            family_id: existing[0].family_id || data.familyId || null,
            is_head: data.isHead || false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);
        if (error) throw error;
        return existing[0].id;
      }

      // Nouvelle personne
      const id = crypto.randomUUID();
      const { error } = await supabase.from('servants').insert({
        id,
        church_id: getChurchId(),
        full_name: data.fullName.trim(),
        nickname: data.nickname?.trim() || null,
        gender: data.gender,
        phone: data.phone,
        email: data.email?.trim() || null,
        department_ids: deptIds,
        family_id: data.familyId || null,
        is_head: data.isHead,
        is_shepherd: data.isShepherd || false,
        shepherd_id: data.shepherdId || null,
        source_type: data.sourceType || 'manual',
        source_id: data.sourceId || null,
        original_soul_id: data.originalSoulId || (data.sourceType === 'soul' ? data.sourceId : null) || null,
        promotion_date: data.promotionDate?.toISOString() ?? null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return id;
    } catch (error) {
      console.error('Error creating servant:', error);
      throw error;
    }
  }

  /**
   * Get a servant by ID
   */
  static async getServant(id: string): Promise<Servant | null> {
    try {
      const { data, error } = await supabase
        .from('servants')
        .select('*')
        .eq('church_id', getChurchId())
        .eq('id', id)
        .single();
      if (error) {
        if (error.code === 'PGRST116') return null; // not found
        throw error;
      }
      return data ? rowToServant(data) : null;
    } catch (error) {
      console.error('Error getting servant:', error);
      throw error;
    }
  }

  /**
   * Update a servant
   */
  static async updateServant(id: string, data: Partial<ServantFormData>): Promise<void> {
    try {
      const current = await this.getServant(id);
      if (!current) throw new Error('B.O.S.S non trouvé');

      // Validate phone
      let formattedPhone = current.phone;
      if (data.phone) {
        const phoneValidation = validatePhoneNumber(data.phone);
        if (!phoneValidation.isValid) throw new Error(phoneValidation.error);
        formattedPhone = phoneValidation.formattedNumber || '';

        if (formattedPhone !== current.phone) {
          const { data: phoneSnap } = await supabase
            .from('servants')
            .select('id')
            .eq('church_id', getChurchId())
            .eq('phone', formattedPhone)
            .limit(1);
          if (phoneSnap && phoneSnap.length > 0 && phoneSnap[0].id !== id) {
            throw new Error('Ce numéro de téléphone est déjà utilisé');
          }
        }
      }

      // Validate email uniqueness
      let formattedEmail = current.email;
      if (data.email !== undefined) {
        formattedEmail = data.email?.trim() || '';
        if (formattedEmail && formattedEmail !== current.email) {
          const { data: emailSnap } = await supabase
            .from('servants')
            .select('id')
            .eq('church_id', getChurchId())
            .eq('email', formattedEmail)
            .limit(1);
          if (emailSnap && emailSnap.length > 0 && emailSnap[0].id !== id) {
            throw new Error('Cet email est déjà utilisé');
          }
        }
      }

      // Check department head conflict
      const updateRow: Record<string, any> = {
        updated_at: new Date().toISOString(),
        phone: formattedPhone,
        email: formattedEmail,
      };
      if (data.fullName)                  updateRow.full_name      = data.fullName.trim();
      if (data.nickname !== undefined)    updateRow.nickname       = data.nickname?.trim() || null;
      if (data.gender)                    updateRow.gender         = data.gender;
      if (data.departmentIds !== undefined) updateRow.department_ids = data.departmentIds;
      if (data.isHead !== undefined)      updateRow.is_head        = data.isHead;
      if (data.isShepherd !== undefined)  updateRow.is_shepherd    = data.isShepherd;
      if (data.shepherdId !== undefined)  updateRow.shepherd_id    = data.shepherdId;
      if (data.status !== undefined)      updateRow.status         = data.status;

      const { error } = await supabase.from('servants').update(updateRow).eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating servant:', error);
      throw error;
    }
  }

  /**
   * Delete a servant
   */
  static async deleteServant(id: string): Promise<void> {
    try {
      const servant = await this.getServant(id);
      if (!servant) throw new Error('B.O.S.S non trouvé');

      if (servant.isHead) {
        throw new Error('Ce B.O.S.S est responsable de département. Veuillez désigner un autre responsable avant de le supprimer.');
      }

      const { error } = await supabase.from('servants').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting servant:', error);
      throw error;
    }
  }

  /**
   * Get all servants
   */
  static async getAllServants(): Promise<Servant[]> {
    try {
      const { data, error } = await supabase
        .from('servants')
        .select('*')
        .eq('church_id', getChurchId())
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? []).map(rowToServant);
    } catch (error) {
      console.error('Error getting all servants:', error);
      throw error;
    }
  }

  /**
   * Get servants by department
   */
  static async getServantsByDepartment(departmentId: string): Promise<Servant[]> {
    try {
      const { data, error } = await supabase
        .from('servants')
        .select('*')
        .eq('church_id', getChurchId())
        .contains('department_ids', [departmentId])
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? []).map(rowToServant);
    } catch (error) {
      console.error('Error getting servants by department:', error);
      throw error;
    }
  }

  /**
   * Get department head
   */
  static async getDepartmentHead(departmentId: string): Promise<Servant | null> {
    try {
      const { data, error } = await supabase
        .from('servants')
        .select('*')
        .eq('church_id', getChurchId())
        .contains('department_ids', [departmentId])
        .eq('is_head', true)
        .eq('status', 'active')
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return rowToServant(data[0]);
    } catch (error) {
      console.error('Error getting department head:', error);
      throw error;
    }
  }

  /**
   * Assign a servant as department head
   */
  static async assignDepartmentHead(servantId: string, departmentId: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Retirer l'ancien responsable
      const { data: currentHead } = await supabase
        .from('servants')
        .select('id')
        .eq('church_id', getChurchId())
        .contains('department_ids', [departmentId])
        .eq('is_head', true)
        .eq('status', 'active')
        .limit(1);

      if (currentHead && currentHead.length > 0) {
        await supabase
          .from('servants')
          .update({ is_head: false, updated_at: now })
          .eq('id', currentHead[0].id);
      }

      // Désigner le nouveau responsable (s'assure qu'il est dans le département)
      const { data: servant } = await supabase
        .from('servants').select('department_ids').eq('id', servantId).limit(1);
      const currentDepts: string[] = servant?.[0]?.department_ids || [];
      const merged = [...new Set([...currentDepts, departmentId])];

      const { error } = await supabase
        .from('servants')
        .update({ department_ids: merged, is_head: true, updated_at: now })
        .eq('id', servantId);
      if (error) throw error;
    } catch (error) {
      console.error('Error assigning department head:', error);
      throw error;
    }
  }

  /**
   * Get all servants who are also shepherds
   */
  static async getServantShepherds(): Promise<Servant[]> {
    try {
      const { data, error } = await supabase
        .from('servants')
        .select('*')
        .eq('church_id', getChurchId())
        .eq('is_shepherd', true)
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? []).map(rowToServant);
    } catch (error) {
      console.error('Error getting servant shepherds:', error);
      throw error;
    }
  }

  /**
   * Bulk delete servants
   * Department heads will be deactivated instead of deleted
   */
  static async bulkDeleteServants(servantIds: string[]): Promise<{ deleted: number; deactivated: number }> {
    try {
      let deletedCount = 0;
      let deactivatedCount = 0;
      const now = new Date().toISOString();

      for (const servantId of servantIds) {
        const servant = await this.getServant(servantId);
        if (!servant) {
          console.warn(`Servant ${servantId} not found, skipping`);
          continue;
        }

        if (servant.isHead) {
          await supabase
            .from('servants')
            .update({ status: 'inactive', updated_at: now })
            .eq('id', servantId);
          deactivatedCount++;
        } else {
          await supabase.from('servants').delete().eq('id', servantId);
          deletedCount++;
        }
      }

      return { deleted: deletedCount, deactivated: deactivatedCount };
    } catch (error) {
      console.error('Error in bulk delete servants:', error);
      throw error;
    }
  }

  /**
   * Trouve les B.O.S.S déjà existants parmi une liste de téléphones.
   * Le dédoublonnage se fait par téléphone (comme dans createServant), pas
   * par source_id : un B.O.S.S saisi manuellement ou importé via Excel
   * n'a pas de source_id, et un dédoublonnage par source_id le manquerait,
   * créant un doublon à chaque nouvel import.
   */
  private static async getExistingByPhone(phones: string[]): Promise<Map<string, { id: string; departmentIds: string[] }>> {
    const map = new Map<string, { id: string; departmentIds: string[] }>();
    const cleanPhones = [...new Set(phones.filter(Boolean))];
    if (cleanPhones.length === 0) return map;

    for (let i = 0; i < cleanPhones.length; i += 100) {
      const chunk = cleanPhones.slice(i, i + 100);
      const { data } = await supabase
        .from('servants')
        .select('id, phone, department_ids')
        .eq('church_id', getChurchId())
        .in('phone', chunk);
      (data ?? []).forEach((d: any) => {
        if (d.phone) map.set(d.phone, { id: d.id, departmentIds: d.department_ids || [] });
      });
    }
    return map;
  }

  /**
   * Import servants from existing souls.
   */
  static async importFromSouls(soulIds: string[], departmentId: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: [] };
    if (soulIds.length === 0 || !departmentId) return result;

    for (let i = 0; i < soulIds.length; i += 100) {
      const chunk = soulIds.slice(i, i + 100);
      const { data: souls, error } = await supabase
        .from('souls')
        .select('*')
        .eq('church_id', getChurchId())
        .in('id', chunk);
      if (error) throw error;

      const existingByPhone = await this.getExistingByPhone((souls ?? []).map((s: any) => s.phone));

      for (const soul of souls ?? []) {
        const name = soul.full_name || 'Inconnu';
        const existing = soul.phone ? existingByPhone.get(soul.phone) : undefined;

        if (existing) {
          if (existing.departmentIds.includes(departmentId)) {
            result.skipped.push({ name, reason: 'Déjà B.O.S.S dans ce département' });
            continue;
          }
          try {
            const merged = [...new Set([...existing.departmentIds, departmentId])];
            const { error: updErr } = await supabase.from('servants')
              .update({ department_ids: merged, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
            if (updErr) throw updErr;
            result.skipped.push({ name, reason: 'Déjà B.O.S.S — département ajouté à sa fiche existante' });
          } catch (e: any) {
            result.skipped.push({ name, reason: e?.message || 'Erreur lors de la mise à jour' });
          }
          continue;
        }

        try {
          const { error: insertErr } = await supabase.from('servants').insert({
        church_id: getChurchId(),
            id: crypto.randomUUID(),
            full_name: (soul.full_name || '').trim(),
            nickname: soul.nickname?.trim() || null,
            gender: soul.gender || 'male',
            phone: soul.phone || '',
            email: soul.email?.trim() || null,
            department_ids: [departmentId],
            is_head: false,
            is_shepherd: false,
            shepherd_id: null,
            source_type: 'soul',
            source_id: soul.id,
            original_soul_id: soul.id,
            promotion_date: new Date().toISOString(),
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          if (insertErr) throw insertErr;
          result.imported++;
        } catch (e: any) {
          console.error('Error importing soul as servant:', e);
          result.skipped.push({ name, reason: e?.message || 'Erreur inconnue' });
        }
      }
    }

    return result;
  }

  /**
   * Import servants from existing users (any role).
   */
  static async importFromUsers(userDocIds: string[], departmentId: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: [] };
    if (userDocIds.length === 0 || !departmentId) return result;

    for (let i = 0; i < userDocIds.length; i += 100) {
      const chunk = userDocIds.slice(i, i + 100);
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('church_id', getChurchId())
        .in('id', chunk);
      if (error) throw error;

      const existingByPhone = await this.getExistingByPhone((users ?? []).map((u: any) => u.phone));

      for (const user of users ?? []) {
        const name = user.full_name || 'Inconnu';
        const existing = user.phone ? existingByPhone.get(user.phone) : undefined;

        if (existing) {
          if (existing.departmentIds.includes(departmentId)) {
            result.skipped.push({ name, reason: 'Déjà B.O.S.S dans ce département' });
            continue;
          }
          try {
            const merged = [...new Set([...existing.departmentIds, departmentId])];
            const { error: updErr } = await supabase.from('servants')
              .update({ department_ids: merged, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
            if (updErr) throw updErr;
            result.skipped.push({ name, reason: 'Déjà B.O.S.S — département ajouté à sa fiche existante' });
          } catch (e: any) {
            result.skipped.push({ name, reason: e?.message || 'Erreur lors de la mise à jour' });
          }
          continue;
        }

        try {
          const isShepherd =
            user.role === 'shepherd' ||
            !!(user.business_profiles?.some?.((p: any) => p?.type === 'shepherd'));

          const { error: insertErr } = await supabase.from('servants').insert({
        church_id: getChurchId(),
            id: crypto.randomUUID(),
            full_name: (user.full_name || '').trim(),
            nickname: user.nickname?.trim() || null,
            gender: user.gender || 'male',
            phone: user.phone || '',
            email: user.email?.trim() || null,
            department_ids: [departmentId],
            is_head: false,
            is_shepherd: isShepherd,
            shepherd_id: null,
            source_type: 'user',
            source_id: user.id,
            original_soul_id: null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          if (insertErr) throw insertErr;
          result.imported++;
        } catch (e: any) {
          console.error('Error importing user as servant:', e);
          result.skipped.push({ name, reason: e?.message || 'Erreur inconnue' });
        }
      }
    }

    return result;
  }
}
