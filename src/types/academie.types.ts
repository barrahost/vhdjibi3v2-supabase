export const ACADEMIE_R2_PUBLIC_URL = 'https://pub-0b04f4639f4e41489b5c3a6cdc109f80.r2.dev';

export interface AcademieClass {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  status: 'active' | 'inactive';
}

export interface AcademieSession {
  id: string;
  classId: string;
  weekNumber: number;
  section?: string;
  theme: string;
  objectives?: string;
  duration?: string;
  moderatorName?: string;
  sessionDate?: string;
  isPublished: boolean;
}

export type AcademieResourceType = 'video' | 'audio' | 'pdf' | 'link';

export interface AcademieResource {
  id: string;
  sessionId: string;
  type: AcademieResourceType;
  title: string;
  r2Key?: string;
  url?: string;
  order: number;
}

export interface AcademieAssignment {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  dueDate?: string;
  isPublished: boolean;
}

export interface AcademieEnrollment {
  id: string;
  userId: string;
  classId: string;
  status: 'active' | 'inactive';
  enrolledAt: string;
}

export function resourceUrl(resource: Pick<AcademieResource, 'r2Key' | 'url'>): string {
  if (resource.r2Key) return `${ACADEMIE_R2_PUBLIC_URL}/${resource.r2Key}`;
  return resource.url || '';
}
