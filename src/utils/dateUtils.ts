export function formatDate(date: Date | any): string {
  if (!date) return 'Non définie';
  
  try {
    // Handle Firestore timestamp
    if (date?.toDate) {
      date = date.toDate();
    }
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date invalide';
  }
}

export function formatDateForInput(date: Date | any): string {
  if (!date) return '';
  
  try {
    // Handle Firestore timestamp
    if (date?.toDate) {
      date = date.toDate();
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}

export function formatDateForExcel(date: Date | any): string {
  if (!date) return '';
  
  try {
    // Handle Firestore timestamp
    if (date?.toDate) {
      date = date.toDate();
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date for Excel:', error);
    return '';
  }
}

export function isValidDate(date: any): boolean {
  if (!date) return false;
  
  try {
    // Handle Firestore timestamp
    if (date?.toDate) {
      date = date.toDate();
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}

/**
 * Format duration in seconds to HH:MM:SS or MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g. "1:23:45" or "3:45")
 */
export function formatDuration(seconds: number): string {
  // Handle hours if duration is over 60 minutes
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
  
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Calcule le nombre de jours restants jusqu'au prochain anniversaire
 * @param birthDate - Date d'anniversaire au format "MM-DD"
 * @returns Le nombre de jours restants
 */
export function getDaysUntilBirthday(birthDate: string): number {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [month, day] = birthDate.split('-').map(Number);

  // Créer la date d'anniversaire
  let birthdayThisYear = new Date(currentYear, month - 1, day);
  let nextBirthday = birthdayThisYear;

  // Si l'anniversaire est déjà passé cette année
  if (today.getTime() > birthdayThisYear.getTime()) {
    // Utiliser la date de l'année prochaine
    nextBirthday = new Date(currentYear + 1, month - 1, day);
  }

  // Calculer la différence en millisecondes
  const diffTime = nextBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Format date for use in filenames (YYYY-MM-DD)
 */
export function formatDateForFileName(date: Date | any): string {
  if (!date) return '';
  
  try {
    // Handle Firestore timestamp
    if (date?.toDate) {
      date = date.toDate();
    }

    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for filename:', error);
    return '';
  }
}

/**
 * Check if a date is within the last 7 days
 * @param date - The date to check
 * @returns True if the date is within the last 7 days, false otherwise
 */
export function isWithinLast7Days(date: Date | any): boolean {
  if (!date) return false;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let dateObj;

    // Handle Firestore timestamp
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date(date);
    }
    
    if (isNaN(dateObj.getTime())) {
      return false;
    }
    
    return dateObj >= sevenDaysAgo;
  } catch (error) {
    return false;
  }
}