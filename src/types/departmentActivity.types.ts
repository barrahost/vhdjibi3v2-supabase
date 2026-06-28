export type ActivityType = 'prayer' | 'youth' | 'agape' | 'meeting' | 'other';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  prayer: 'Temps de prière',
  youth: 'Jeunes',
  agape: 'Agape',
  meeting: 'Rencontre',
  other: 'Autre',
};

export interface DepartmentActivity {
  id: string;
  churchId: string;
  departmentId: string;
  title: string;
  type: ActivityType;
  date: Date;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface ActivityParticipation {
  id: string;
  churchId: string;
  activityId: string;
  servantId: string;
  present: boolean;
  notes?: string;
}

export interface ServantParticipationRate {
  servantId: string;
  totalActivities: number;
  presentCount: number;
  rate: number; // 0–1
}

export interface ActivityWithParticipations extends DepartmentActivity {
  participations: ActivityParticipation[];
  presentCount: number;
  totalServants: number;
}
