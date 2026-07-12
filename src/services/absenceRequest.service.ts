import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export const ABSENCE_REASONS = ['Voyage', 'Repos', 'Maladie', 'Professionnel', 'Autre'] as const;
export type AbsenceReason = typeof ABSENCE_REASONS[number];

export interface AbsenceUser {
  id: string;
  fullName: string;
  roles: string[];
}

export interface AbsencePeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason: AbsenceReason;
}

export interface AbsenceRequest {
  id: string;
  churchId: string;
  userId: string;
  userName: string;
  userRole: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: AbsenceReason;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: Date;
  submittedAt: Date;
}

function mapRequest(r: any): AbsenceRequest {
  return {
    id: r.id,
    churchId: r.church_id,
    userId: r.user_id,
    userName: r.user_name,
    userRole: r.user_role,
    startDate: r.start_date,
    endDate: r.end_date,
    reason: r.reason,
    status: r.status,
    rejectionReason: r.rejection_reason ?? undefined,
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at) : undefined,
    submittedAt: new Date(r.submitted_at),
  };
}

export const AbsenceRequestService = {
  // ── Public (SECURITY DEFINER — sans auth) ──────────────────────────────

  async getUsersForForm(churchId: string): Promise<AbsenceUser[]> {
    // Même liste d'utilisateurs actifs que le formulaire de congé
    const { data, error } = await supabase.rpc('get_users_for_leave_form', {
      p_church_id: churchId,
    });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      roles: Array.isArray(r.roles) ? r.roles : [],
    }));
  },

  async getUserExistingRequests(userId: string, churchId: string): Promise<AbsencePeriod[]> {
    const { data, error } = await supabase.rpc('get_user_absence_requests', {
      p_user_id: userId,
      p_church_id: churchId,
    });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      start_date: r.start_date,
      end_date: r.end_date,
      reason: r.reason,
    }));
  },

  async submitRequests(
    userId: string,
    userName: string,
    userRole: string,
    churchId: string,
    periods: AbsencePeriod[]
  ): Promise<void> {
    const { error } = await supabase.rpc('submit_absence_requests', {
      p_user_id: userId,
      p_user_name: userName,
      p_user_role: userRole,
      p_church_id: churchId,
      p_periods: periods,
    });
    if (error) throw new Error(error.message);
  },

  // ── Admin (auth requise) ────────────────────────────────────────────────

  async getAllRequests(): Promise<AbsenceRequest[]> {
    const { data, error } = await supabase
      .from('absence_requests')
      .select('*')
      .eq('church_id', getChurchId())
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRequest);
  },

  async approveRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('absence_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('church_id', getChurchId());
    if (error) throw error;
  },

  async rejectRequest(id: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('absence_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('church_id', getChurchId());
    if (error) throw error;
  },
};
