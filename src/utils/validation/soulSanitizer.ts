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

  // Champs carte de bienvenue
  if (data.email !== undefined) {
    sanitized.email = data.email?.trim() || null;
  }
  if (data.profession !== undefined) {
    sanitized.profession = data.profession?.trim() || null;
  }
  if (data.attendedCommunity !== undefined) {
    sanitized.attended_community = data.attendedCommunity?.trim() || null;
  }
  if (data.isRegular !== undefined) {
    sanitized.is_regular = data.isRegular ?? null;
  }
  if (data.ageRange !== undefined) {
    sanitized.age_range = data.ageRange || null;
  }
  if (data.maritalStatus !== undefined) {
    sanitized.marital_status = data.maritalStatus || null;
  }
  if (data.decision !== undefined) {
    sanitized.decision = data.decision || null;
    // Garder is_undecided synchronisé avec la décision
    sanitized.is_undecided = data.decision === 'undecided';
  }
  if (data.prayerRequest !== undefined) {
    sanitized.prayer_request = data.prayerRequest?.trim() || null;
  }

  return sanitized;
}
