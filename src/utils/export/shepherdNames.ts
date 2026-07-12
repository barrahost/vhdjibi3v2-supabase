import { Soul } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

export async function getShepherdNames(souls: Soul[]): Promise<Record<string, string>> {
  const shepherdNames: Record<string, string> = {};
  const shepherdIds = Array.from(new Set(souls.map(soul => soul.shepherdId).filter(Boolean))) as string[];

  if (shepherdIds.length === 0) return shepherdNames;

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('church_id', getChurchId())
    .in('id', shepherdIds);

  if (error) {
    console.error('Error loading shepherd names:', error);
    shepherdIds.forEach(id => { shepherdNames[id] = 'Erreur de chargement'; });
    return shepherdNames;
  }

  const rows = (data ?? []) as { id: string; full_name: string | null }[];
  const foundIds = new Set(rows.map(r => r.id));
  rows.forEach(r => { shepherdNames[r.id] = r.full_name || 'Berger non trouvé'; });
  shepherdIds.filter(id => !foundIds.has(id)).forEach(id => { shepherdNames[id] = 'Berger non trouvé'; });

  return shepherdNames;
}