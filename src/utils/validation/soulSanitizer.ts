import { Soul } from '../../types/database.types';

export function sanitizeSoulData(data: Partial<Soul>): Partial<Soul> {
  const sanitized: Record<string, any> = {
    fullName: data.fullName?.trim(),
    gender: data.gender,
    location: data.location?.trim(),
    isUndecided: data.isUndecided === true,
    phone: data.phone,
    firstVisitDate: data.firstVisitDate ? new Date(data.firstVisitDate) : null,
    shepherdId: data.shepherdId,
    status: data.status || 'active',
    updatedAt: new Date()
  };

  // Only include nickname if it exists and isn't empty
  if (data.nickname?.trim()) {
    sanitized.nickname = data.nickname.trim();
  }

  // Only include coordinates if they exist and are valid
  if (data.coordinates && data.coordinates.latitude && data.coordinates.longitude) {
    sanitized.coordinates = data.coordinates;
  } else {
    // Explicitly set coordinates to null if they don't exist or are invalid
    sanitized.coordinates = null;
  }

  // Only include spiritual profile if it exists
  if (data.spiritualProfile) {
    sanitized.spiritualProfile = data.spiritualProfile;
  }

  // Only include photoURL if it exists
  if (data.photoURL !== undefined) {
    sanitized.photoURL = data.photoURL;
  }

  return sanitized;
}