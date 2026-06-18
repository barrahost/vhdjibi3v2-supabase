import { Soul } from '../../types/database.types';

export function sanitizeSoulData(data: Partial<Soul>): Record<string, any> {
  const sanitized: Record<string, any> = {
    full_name: data.fullName?.trim(),
    gender: data.gender,
    location: data.location?.trim(),
    is_undecided: data.isUndecided === true,
    phone: data.phone,
    first_visit_date: data.firstVisitDate ? new Date(data.firstVisitDate) : null,
    shepherd_id: data.shepherdId ?? null,
    status: data.status || 'active',
    updated_at: new Date()
  };

  if (data.nickname?.trim()) {
    sanitized.nickname = data.nickname.trim();
  }

  if (data.coordinates && data.coordinates.latitude && data.coordinates.longitude) {
    sanitized.coordinates = data.coordinates;
  } else {
    sanitized.coordinates = null;
  }

  if (data.spiritualProfile) {
    sanitized.spiritual_profile = data.spiritualProfile;
  }

  if (data.photoURL !== undefined) {
    sanitized.photo_url = data.photoURL ?? null;
  }

  if ((data as any).originSource !== undefined) {
    sanitized.origin_source = (data as any).originSource || null;
  }

  if ((data as any).serviceFamilyId !== undefined) {
    sanitized.service_family_id = (data as any).serviceFamilyId ?? null;
  }

  return sanitized;
}
