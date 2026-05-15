import { Soul } from '../../types/database.types';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateSoulData(data: Partial<Soul>): ValidationResult {
  try {
    // Required fields validation
    if (!data.fullName?.trim()) {
      return { isValid: false, error: 'Le nom est obligatoire' };
    }

    if (!data.gender) {
      return { isValid: false, error: 'Le genre est obligatoire' };
    }

    if (!['male', 'female'].includes(data.gender)) {
      return { isValid: false, error: 'Le genre est invalide' };
    }

    if (!data.location?.trim()) {
      return { isValid: false, error: "Le lieu d'habitation est obligatoire" };
    }

    if (!data.firstVisitDate) {
      return { isValid: false, error: 'La date de première visite est obligatoire' };
    }

    // Phone validation
    if (data.phone) {
      const phoneRegex = /^\+225\d{10}$/;
      if (!phoneRegex.test(data.phone)) {
        return { isValid: false, error: 'Le format du numéro de téléphone est invalide' };
      }
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Erreur de validation des données' };
  }
}