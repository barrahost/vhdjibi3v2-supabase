import { Servant, ServantFormData, ServantSourceType } from '../types/servant.types';
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
    departmentId: row.department_id,
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
  if (data.fullName !== undefined)       row.full_name        = data.fullName.trim();
  if (data.nickname !== undefined)       row.nickname         = data.nickname?.trim() || null;
  if (data.gender !== undefined)         row.gender           = data.gender;
  if (data.phone !== undefined)          row.phone            = data.phone;
  if (data.email !== undefined)          row.email            = data.email?.trim() || null;
  if (data.departmentId !== undefined)   row.department_id    = data.departmentId;
  if (data.isHead !== undefined)         row.is_head          = data.isHead;
  if (data.isShepherd !== undefined)     row.is_shepherd      = data.isShepherd;
  if (data.shepherdId !== undefined)     row.shepherd_id      = data.shepherdId;
  if (data.status !== undefined)         row.status           = data.status;
  if (data.sourceType !== undefined)     row.source_type      = data.sourceType;
  if (data.sourceId !== undefined)       row.source_id        = data.sourceId;
  if (data.originalSoulId !== undefined) row.original_soul_id = data.originalSoulId;
  if (data.promotionDate !== undefined)  row.promotion_date   = data.promotionDate?.toISOString() ?? null;
  return row;
}

// ─── ServantService ───────────────────────────────────────────────────────────

export class ServantService {
  /**
   * Create a new servant
   */
  static async createServant(data: ServantFormData): Promise<string> {
    try {
      // Duplicate check: same source in same department
      if (data.sourceType && data.sourceId) {
        const { data: dup } = await supabase
          .from('servants')
          .select('id')
          .eq('church_id', getChurchId())
          .eq('source_type', data.sourceType)
          .eq('source_id', data.sourceId)
          .eq('department_id', data.departmentId)
          .limit(1);
        if (dup && dup.length > 0) {
          throw new Error('Cette personne est déjà serviteur dans ce département');
        }
      } else {
        // Manual: prevent duplicate phone in same department
        const { data: phoneSnap } = await supabase
          .from('servants')
          .select('id')
          .eq('church_id', getChurchId())
          .eq('phone', data.phone)
          .eq('department_id', data.departmentId)
          .limit(1);
        if (phoneSnap && phoneSnap.length > 0) {
          throw new Error('Ce numéro est déjà utilisé pour un serviteur dans ce département');
        }

        // Cross-department warning (non-blocking)
        try {
          const { data: globalSnap } = await supabase
            .from('servants')
            .select('department_id')
            .eq('church_id', getChurchId())
            .eq('phone', data.phone)
            .eq('status', 'active');
          const otherDepts = (globalSnap ?? []).filter(d => d.department_id !== data.departmentId);
          if (otherDepts.length > 0) {
            console.warn(`[Servants] Numéro ${data.phone} déjà utilisé dans ${otherDepts.length} autre(s) département(s)`);
          }
        } catch (e) {
          console.warn('Cross-department duplicate check failed', e);
        }
      }

      // Check for existing department head
      if (data.isHead) {
        const { data: headSnap } = await supabase
          .from('servants')
          .select('id')
          .eq('church_id', getChurchId())
          .eq('department_id', data.departmentId)
          .eq('is_head', true)
          .eq('status', 'active')
          .limit(1);
        if (headSnap && headSnap.length > 0) {
          throw new Error('Ce département a déjà un responsable');
        }
      }

      const id = crypto.randomUUID();
      const row = {
        id,
        full_name: data.fullName.trim(),
        nickname: data.nickname?.trim() || null,
        gender: data.gender,
        phone: data.phone,
        email: data.email?.trim() || null,
        department_id: data.departmentId,
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
      };

      const { error } = await supabase.from('servants').insert(row);
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
      if (!current) throw new Error('Serviteur non trouvé');

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
      const newDepartmentId = data.departmentId || current.departmentId;
      const newIsHead = data.isHead !== undefined ? data.isHead : current.isHead;
      if (newIsHead && (data.departmentId || data.isHead !== undefined)) {
        const { data: headSnap } = await supabase
          .from('servants')
          .select('id')
          .eq('church_id', getChurchId())
          .eq('department_id', newDepartmentId)
          .eq('is_head', true)
          .eq('status', 'active')
          .limit(1);
        if (headSnap && headSnap.length > 0 && headSnap[0].id !== id) {
          throw new Error('Ce département a déjà un responsable');
        }
      }

      const updateRow: Record<string, any> = {
        updated_at: new Date().toISOString(),
        phone: formattedPhone,
        email: formattedEmail,
      };
      if (data.fullName)              updateRow.full_name     = data.fullName.trim();
      if (data.nickname !== undefined) updateRow.nickname     = data.nickname?.trim() || null;
      if (data.gender)                updateRow.gender        = data.gender;
      if (data.departmentId)          updateRow.department_id = data.departmentId;
      if (data.isHead !== undefined)  updateRow.is_head       = data.isHead;
      if (data.isShepherd !== undefined) updateRow.is_shepherd = data.isShepherd;
      if (data.shepherdId !== undefined) updateRow.shepherd_id = data.shepherdId;
      if (data.status !== undefined)  updateRow.status        = data.status;

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
      if (!servant) throw new Error('Serviteur non trouvé');

      if (servant.isHead) {
        throw new Error('Ce serviteur est responsable de département. Veuillez désigner un autre responsable avant de le supprimer.');
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
        .eq('department_id', departmentId)
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
        .eq('department_id', departmentId)
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

      // Remove any existing department head
      const { data: currentHead } = await supabase
        .from('servants')
        .select('id')
        .eq('church_id', getChurchId())
        .eq('department_id', departmentId)
        .eq('is_head', true)
        .eq('status', 'active')
        .limit(1);

      if (currentHead && currentHead.length > 0) {
        await supabase
          .from('servants')
          .update({ is_head: false, updated_at: now })
          .eq('id', currentHead[0].id);
      }

      // Assign the new head
      const { error } = await supabase
        .from('servants')
        .update({ department_id: departmentId, is_head: true, updated_at: now })
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
   * Find existing servants for a department restricted to a list of source ids.
   */
  private static async getExistingSourceIds(
    departmentId: string,
    sourceType: ServantSourceType,
    sourceIds: string[]
  ): Promise<Set<string>> {
    const existing = new Set<string>();
    if (sourceIds.length === 0) return existing;

    // chunk into 100 at a time for Supabase .in()
    for (let i = 0; i < sourceIds.length; i += 100) {
      const chunk = sourceIds.slice(i, i + 100);
      const { data } = await supabase
        .from('servants')
        .select('source_id')
        .eq('church_id', getChurchId())
        .eq('department_id', departmentId)
        .eq('source_type', sourceType)
        .in('source_id', chunk);
      (data ?? []).forEach((d: any) => { if (d.source_id) existing.add(d.source_id); });
    }
    return existing;
  }

  /**
   * Import servants from existing souls.
   */
  static async importFromSouls(soulIds: string[], departmentId: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: [] };
    if (soulIds.length === 0 || !departmentId) return result;

    const existing = await this.getExistingSourceIds(departmentId, 'soul', soulIds);

    for (let i = 0; i < soulIds.length; i += 100) {
      const chunk = soulIds.slice(i, i + 100);
      const { data: souls } = await supabase
        .from('souls')
        .select('*')
        .eq('church_id', getChurchId())
        .in('id', chunk);
      if (error) throw error;

      for (const soul of souls ?? []) {
        const name = soul.full_name || 'Inconnu';

        if (existing.has(soul.id)) {
          result.skipped.push({ name, reason: 'Déjà serviteur dans ce département' });
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
            department_id: departmentId,
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

    const existing = await this.getExistingSourceIds(departmentId, 'user', userDocIds);

    for (let i = 0; i < userDocIds.length; i += 100) {
      const chunk = userDocIds.slice(i, i + 100);
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('church_id', getChurchId())
        .in('id', chunk);
      if (error) throw error;

      for (const user of users ?? []) {
        const name = user.full_name || 'Inconnu';

        if (existing.has(user.id)) {
          result.skipped.push({ name, reason: 'Déjà serviteur dans ce département' });
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
            department_id: departmentId,
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
