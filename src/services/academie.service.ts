import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import type {
  AcademieClass, AcademieSession, AcademieResource, AcademieAssignment, AcademieEnrollment,
} from '../types/academie.types';

function rowToClass(row: any): AcademieClass {
  return {
    id: row.id, name: row.name, description: row.description || undefined,
    startDate: row.start_date || undefined, status: row.status,
  };
}

function rowToSession(row: any): AcademieSession {
  return {
    id: row.id, classId: row.class_id, weekNumber: row.week_number,
    section: row.section || undefined, theme: row.theme, objectives: row.objectives || undefined,
    duration: row.duration || undefined, moderatorName: row.moderator_name || undefined,
    sessionDate: row.session_date || undefined, isPublished: row.is_published,
  };
}

function rowToResource(row: any): AcademieResource {
  return {
    id: row.id, sessionId: row.session_id, type: row.type, title: row.title,
    r2Key: row.r2_key || undefined, url: row.url || undefined, order: row.order,
  };
}

function rowToAssignment(row: any): AcademieAssignment {
  return {
    id: row.id, sessionId: row.session_id, title: row.title, description: row.description || undefined,
    dueDate: row.due_date || undefined, isPublished: row.is_published,
  };
}

function rowToEnrollment(row: any): AcademieEnrollment {
  return {
    id: row.id, userId: row.user_id, classId: row.class_id, status: row.status, enrolledAt: row.enrolled_at,
  };
}

export class AcademieService {
  // ─── Classes ──────────────────────────────────────────────
  static async getClasses(): Promise<AcademieClass[]> {
    const { data, error } = await supabase.from('academie_classes').select('*')
      .eq('church_id', getChurchId()).order('name');
    if (error) throw error;
    return (data || []).map(rowToClass);
  }

  static async createClass(data: { name: string; description?: string; startDate?: string }): Promise<void> {
    const { error } = await supabase.from('academie_classes').insert({
      church_id: getChurchId(), name: data.name, description: data.description || null,
      start_date: data.startDate || null, status: 'active',
    });
    if (error) throw error;
  }

  static async updateClass(id: string, data: Partial<{ name: string; description: string; startDate: string; status: 'active' | 'inactive' }>): Promise<void> {
    const row: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) row.name = data.name;
    if (data.description !== undefined) row.description = data.description || null;
    if (data.startDate !== undefined) row.start_date = data.startDate || null;
    if (data.status !== undefined) row.status = data.status;
    const { error } = await supabase.from('academie_classes').update(row).eq('id', id);
    if (error) throw error;
  }

  // ─── Sessions ─────────────────────────────────────────────
  static async getSessionsByClass(classId: string): Promise<AcademieSession[]> {
    const { data, error } = await supabase.from('academie_sessions').select('*')
      .eq('church_id', getChurchId()).eq('class_id', classId).order('week_number');
    if (error) throw error;
    return (data || []).map(rowToSession);
  }

  static async getPublishedSessionsByClass(classId: string): Promise<AcademieSession[]> {
    const { data, error } = await supabase.from('academie_sessions').select('*')
      .eq('church_id', getChurchId()).eq('class_id', classId).eq('is_published', true).order('week_number');
    if (error) throw error;
    return (data || []).map(rowToSession);
  }

  static async setSessionPublished(id: string, isPublished: boolean): Promise<void> {
    const { error } = await supabase.from('academie_sessions')
      .update({ is_published: isPublished, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }

  // ─── Resources ────────────────────────────────────────────
  static async getResourcesBySession(sessionId: string): Promise<AcademieResource[]> {
    const { data, error } = await supabase.from('academie_resources').select('*')
      .eq('church_id', getChurchId()).eq('session_id', sessionId).order('order');
    if (error) throw error;
    return (data || []).map(rowToResource);
  }

  static async getResourcesBySessions(sessionIds: string[]): Promise<AcademieResource[]> {
    if (sessionIds.length === 0) return [];
    const { data, error } = await supabase.from('academie_resources').select('*')
      .eq('church_id', getChurchId()).in('session_id', sessionIds).order('order');
    if (error) throw error;
    return (data || []).map(rowToResource);
  }

  static async addResource(data: { sessionId: string; type: AcademieResource['type']; title: string; r2Key?: string; url?: string; order?: number }): Promise<void> {
    const { error } = await supabase.from('academie_resources').insert({
      church_id: getChurchId(), session_id: data.sessionId, type: data.type, title: data.title,
      r2_key: data.r2Key || null, url: data.url || null, order: data.order ?? 0,
    });
    if (error) throw error;
  }

  static async deleteResource(id: string): Promise<void> {
    const { error } = await supabase.from('academie_resources').delete().eq('id', id);
    if (error) throw error;
  }

  // ─── Assignments (devoirs) ────────────────────────────────
  static async getAssignmentsBySession(sessionId: string): Promise<AcademieAssignment[]> {
    const { data, error } = await supabase.from('academie_assignments').select('*')
      .eq('church_id', getChurchId()).eq('session_id', sessionId);
    if (error) throw error;
    return (data || []).map(rowToAssignment);
  }

  static async getAssignmentsBySessions(sessionIds: string[]): Promise<AcademieAssignment[]> {
    if (sessionIds.length === 0) return [];
    const { data, error } = await supabase.from('academie_assignments').select('*')
      .eq('church_id', getChurchId()).in('session_id', sessionIds);
    if (error) throw error;
    return (data || []).map(rowToAssignment);
  }

  static async addAssignment(data: { sessionId: string; title: string; description?: string; dueDate?: string }): Promise<void> {
    const { error } = await supabase.from('academie_assignments').insert({
      church_id: getChurchId(), session_id: data.sessionId, title: data.title,
      description: data.description || null, due_date: data.dueDate || null, is_published: false,
    });
    if (error) throw error;
  }

  static async setAssignmentPublished(id: string, isPublished: boolean): Promise<void> {
    const { error } = await supabase.from('academie_assignments').update({ is_published: isPublished }).eq('id', id);
    if (error) throw error;
  }

  // ─── Enrollments (inscriptions) ───────────────────────────
  static async getEnrollmentsByUser(userId: string): Promise<AcademieEnrollment[]> {
    const { data, error } = await supabase.from('academie_enrollments').select('*')
      .eq('church_id', getChurchId()).eq('user_id', userId).eq('status', 'active');
    if (error) throw error;
    return (data || []).map(rowToEnrollment);
  }

  static async getEnrollmentsByClass(classId: string): Promise<AcademieEnrollment[]> {
    const { data, error } = await supabase.from('academie_enrollments').select('*')
      .eq('church_id', getChurchId()).eq('class_id', classId);
    if (error) throw error;
    return (data || []).map(rowToEnrollment);
  }

  static async enroll(userId: string, classId: string): Promise<void> {
    const { error } = await supabase.from('academie_enrollments').upsert({
      church_id: getChurchId(), user_id: userId, class_id: classId, status: 'active',
    }, { onConflict: 'user_id,class_id' });
    if (error) throw error;
  }

  static async unenroll(userId: string, classId: string): Promise<void> {
    const { error } = await supabase.from('academie_enrollments')
      .update({ status: 'inactive' }).eq('user_id', userId).eq('class_id', classId);
    if (error) throw error;
  }
}
