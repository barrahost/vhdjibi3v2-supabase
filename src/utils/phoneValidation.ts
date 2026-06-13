export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  error?: string;
  cleanNumber?: string; // Ajout de cette propriété pour retourner le numéro à 10 chiffres
}

export function validatePhoneNumber(phone: string): PhoneValidationResult {
  try {
    // Supprimer tous les caractères non numériques
    let cleaned = phone.replace(/\D/g, '');

    // Si le numéro nettoyé commence par '225' et a une longueur de 13 chiffres,
    // cela signifie qu'il inclut déjà le code pays. On le retire pour la validation.
    if (cleaned.startsWith('225') && cleaned.length === 13) {
      cleaned = cleaned.substring(3); // Retire les 3 premiers chiffres ('225')
    }

    // Vérifier que nous avons exactement 10 chiffres
    if (cleaned.length !== 10) {
      return {
        isValid: false,
        error: 'Le numéro doit contenir exactement 10 chiffres'
      };
    }

    // Format final : +225XXXXXXXXXX
    const formattedNumber = `+225${cleaned}`;

    return {
      isValid: true,
      formattedNumber,
      cleanNumber: cleaned // Retourne le numéro à 10 chiffres sans préfixe
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Format de numéro invalide'
    };
  }
}

// Numéro international au format 225XXXXXXXXXX (sans +), ou null si invalide.
function toInternational(phone?: string | null): string | null {
  if (!phone) return null;
  const { isValid, cleanNumber } = validatePhoneNumber(phone);
  if (!isValid || !cleanNumber) return null;
  return `225${cleanNumber}`;
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