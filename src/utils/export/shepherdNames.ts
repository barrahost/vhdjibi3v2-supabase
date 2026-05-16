import { Soul } from '../../types/database.types';
import { supabase } from '../../lib/supabase';

export async function getShepherdNames(souls: Soul[]): Promise<Record<string, string>> {
  const shepherdNames: Record<string, string> = {};
  const shepherdIds = new Set(souls.map(soul => soul.shepherdId).filter(Boolean));
  
  for (const shepherdId of shepherdIds) {
    if (!shepherdId) continue;

    try {
      // Chercher dans la collection users
      const userDoc = await supabase.from('users').select('*').eq('id', shepherdId).single();
      if (userDoc.exists()) {
        shepherdNames[shepherdId] = userDoc.data().fullName;
      } else {
        shepherdNames[shepherdId] = 'Berger non trouvé';
      }
    } catch (error) {
      console.error(`Error loading shepherd name for ID ${shepherdId}:`, error);
      shepherdNames[shepherdId] = 'Erreur de chargement';
    }
  }
  
  return shepherdNames;
}