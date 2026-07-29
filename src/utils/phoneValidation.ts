import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { DEFAULT_PHONE_COUNTRY } from '../components/ui/PhoneInput';

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber?: string; // Format international complet, ex: +2250700075363
  error?: string;
  cleanNumber?: string; // Numero national sans indicatif, ex: 0700075363
}

/** Valide un numero pour n'importe quel pays. Si le numero ne precise pas d'indicatif
 * (pas de '+'), on suppose la Cote d'Ivoire par defaut -- retro-compatible avec tous
 * les numeros existants saisis avant l'introduction du selecteur de pays. */
export function validatePhoneNumber(phone: string, defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY): PhoneValidationResult {
  try {
    if (!phone || !phone.trim()) {
      return { isValid: false, error: 'Le numéro est obligatoire' };
    }

    const parsed = parsePhoneNumberFromString(phone, defaultCountry);
    if (!parsed || !parsed.isValid()) {
      return { isValid: false, error: 'Numéro de téléphone invalide' };
    }

    return {
      isValid: true,
      formattedNumber: parsed.number, // E.164, ex: +2250700075363
      cleanNumber: parsed.nationalNumber, // Sans indicatif, ex: 0700075363 (format national)
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Format de numéro invalide',
    };
  }
}

// Numéro international au format 225XXXXXXXXXX (sans +), ou null si invalide.
function toInternational(phone?: string | null): string | null {
  if (!phone) return null;
  const { isValid, formattedNumber } = validatePhoneNumber(phone);
  if (!isValid || !formattedNumber) return null;
  return formattedNumber.replace(/^\+/, '');
}

// Lien d'appel direct (tel:) ou null si le numéro est invalide.
export function telHref(phone?: string | null): string | null {
  const intl = toInternational(phone);
  return intl ? `tel:+${intl}` : null;
}

// Lien WhatsApp (wa.me) ou null si le numéro est invalide.
export function whatsappHref(phone?: string | null): string | null {
  const intl = toInternational(phone);
  return intl ? `https://wa.me/${intl}` : null;
}
