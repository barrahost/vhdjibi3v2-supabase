import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export interface LeaveUser {
  id: string;
  fullName: string;
  roles: string[];
}

export interface LeavePeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

export interface LeaveRequest {
  id: string;
  churchId: string;
  userId: string;
  userName: string;
  userRole: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: Date;
  submittedAt: Date;
}

function mapRequest(r: any): LeaveRequest {
  return {
    id: r.id,
    churchId: r.church_id,
    userId: r.user_id,
    userName: r.user_name,
    userRole: r.user_role,
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status,
    rejectionReason: r.rejection_reason ?? undefined,
    reviewedAt: r.reviewed_at ? new Date(r.reviewed_at) : undefined,
    submittedAt: new Date(r.submitted_at),
  };
}

// SMS best-effort (pasteur à la soumission, demandeur à la décision) : le
// contenu est reconstruit côté serveur, et un échec SMS ne doit jamais faire
// échouer l'opération déjà enregistrée en base.
function notifyLeaveSms(payload: { type: 'submitted'; userId: string } | { type: 'decision'; requestId: string }): void {
  supabase.functions
    .invoke('notify-leave-request', { body: payload })
    .then((res: { error: { message?: string } | null }) => {
      if (res.error) console.warn('SMS demande de congé non envoyé :', res.error.message);
    })
    .catch((e: unknown) => console.warn('SMS demande de congé non envoyé :', e));
}

export const LeaveRequestService = {
  // ── Public (SECURITY DEFINER — sans auth) ──────────────────────────────

  async getUsersForForm(churchId: string): Promise<LeaveUser[]> {
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

  async getUserExistingRequests(userId: string, churchId: string): Promise<LeavePeriod[]> {
    const { data, error } = await supabase.rpc('get_user_leave_requests', {
      p_user_id: userId,
      p_church_id: churchId,
    });
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      start_date: r.start_date,
      end_date: r.end_date,
    }));
  },

  async submitRequests(
    userId: string,
    userName: string,
    userRole: string,
    churchId: string,
    periods: LeavePeriod[]
  ): Promise<void> {
    const { error } = await supabase.rpc('submit_leave_requests', {
      p_user_id: userId,
      p_user_name: userName,
      p_user_role: userRole,
      p_church_id: churchId,
      p_periods: periods,
    });
    if (error) throw new Error(error.message);
    notifyLeaveSms({ type: 'submitted', userId });
  },

  // ── Admin (auth requise) ────────────────────────────────────────────────

  async getAllRequests(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('church_id', getChurchId())
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRequest);
  },

  async approveRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('church_id', getChurchId());
    if (error) throw error;
    notifyLeaveSms({ type: 'decision', requestId: id });
  },

  async rejectRequest(id: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('church_id', getChurchId());
    if (error) throw error;
    notifyLeaveSms({ type: 'decision', requestId: id });
  },

  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', id)
      .eq('church_id', getChurchId());
    if (error) throw error;
  },
};
