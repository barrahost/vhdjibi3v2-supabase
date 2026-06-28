import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import {
  DepartmentActivity,
  ActivityParticipation,
  ServantParticipationRate,
  ActivityType,
} from '../types/departmentActivity.types';

function mapActivity(row: any): DepartmentActivity {
  return {
    id: row.id,
    churchId: row.church_id,
    departmentId: row.department_id,
    title: row.title,
    type: row.type as ActivityType,
    date: new Date(row.date),
    notes: row.notes ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapParticipation(row: any): ActivityParticipation {
  return {
    id: row.id,
    churchId: row.church_id,
    activityId: row.activity_id,
    servantId: row.servant_id,
    present: row.present,
    notes: row.notes ?? undefined,
  };
}

export const DepartmentActivityService = {
  async createActivity(
    departmentId: string,
    data: { title: string; type: ActivityType; date: string; notes?: string; createdBy?: string },
    presentServantIds: string[],
    allServantIds: string[]
  ): Promise<DepartmentActivity> {
    const churchId = getChurchId();

    const { data: actRow, error } = await supabase
      .from('department_activities')
      .insert({
        church_id: churchId,
        department_id: departmentId,
        title: data.title,
        type: data.type,
        date: data.date,
        notes: data.notes || null,
        created_by: data.createdBy || null,
      })
      .select()
      .single();

    if (error) throw error;

    if (allServantIds.length > 0) {
      const participations = allServantIds.map((sid) => ({
        church_id: churchId,
        activity_id: actRow.id,
        servant_id: sid,
        present: presentServantIds.includes(sid),
      }));
      const { error: pErr } = await supabase
        .from('department_activity_participations')
        .insert(participations);
      if (pErr) throw pErr;
    }

    return mapActivity(actRow);
  },

  async getActivitiesForDepartment(departmentId: string): Promise<DepartmentActivity[]> {
    const { data, error } = await supabase
      .from('department_activities')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('department_id', departmentId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapActivity);
  },

  async getParticipationsForActivity(activityId: string): Promise<ActivityParticipation[]> {
    const { data, error } = await supabase
      .from('department_activity_participations')
      .select('*')
      .eq('church_id', getChurchId())
      .eq('activity_id', activityId);

    if (error) throw error;
    return (data ?? []).map(mapParticipation);
  },

  async getParticipationRates(
    departmentId: string,
    servantIds: string[]
  ): Promise<ServantParticipationRate[]> {
    if (servantIds.length === 0) return [];

    const { data: activities, error: aErr } = await supabase
      .from('department_activities')
      .select('id')
      .eq('church_id', getChurchId())
      .eq('department_id', departmentId);

    if (aErr) throw aErr;
    const activityIds = (activities ?? []).map((a: any) => a.id);
    const total = activityIds.length;

    if (total === 0) {
      return servantIds.map((sid) => ({ servantId: sid, totalActivities: 0, presentCount: 0, rate: 0 }));
    }

    const { data: parts, error: pErr } = await supabase
      .from('department_activity_participations')
      .select('servant_id, present')
      .eq('church_id', getChurchId())
      .in('activity_id', activityIds)
      .in('servant_id', servantIds)
      .eq('present', true);

    if (pErr) throw pErr;

    const countBySid: Record<string, number> = {};
    (parts ?? []).forEach((p: any) => {
      countBySid[p.servant_id] = (countBySid[p.servant_id] ?? 0) + 1;
    });

    return servantIds.map((sid) => {
      const presentCount = countBySid[sid] ?? 0;
      return { servantId: sid, totalActivities: total, presentCount, rate: presentCount / total };
    });
  },

  async deleteActivity(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('department_activities')
      .delete()
      .eq('id', activityId)
      .eq('church_id', getChurchId());
    if (error) throw error;
  },
};
