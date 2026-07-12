import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { isShepherdUser } from '../roleHelpers';
import { formatDateForExcel } from '../dateUtils';

interface ShepherdRow {
  id: string;
  fullName: string;
  phone?: string;
}

interface SoulRow {
  fullName: string;
  phone?: string;
  location?: string;
  shepherdId?: string;
}

export async function exportShepherdsWithSouls(filename?: string): Promise<void> {
  const churchId = getChurchId();

  const [{ data: usersRaw, error: usersErr }, { data: soulsRaw, error: soulsErr }] = await Promise.all([
    supabase.from('users').select('*').eq('church_id', churchId).eq('status', 'active'),
    supabase.from('souls').select('id, full_name, phone, location, shepherd_id')
      .eq('church_id', churchId).eq('status', 'active'),
  ]);

  if (usersErr) throw usersErr;
  if (soulsErr) throw soulsErr;

  const shepherds: ShepherdRow[] = (usersRaw ?? [])
    .filter((r: any) => isShepherdUser(r))
    .map((r: any) => ({ id: r.id, fullName: r.full_name || '', phone: r.phone }));

  const souls: SoulRow[] = (soulsRaw ?? []).map((r: any) => ({
    fullName: r.full_name || '',
    phone: r.phone,
    location: r.location,
    shepherdId: r.shepherd_id ?? undefined,
  }));

  const shepherdsById = new Map(shepherds.map(s => [s.id, s]));

  const rows: Record<string, string>[] = [];

  const sortedShepherds = [...shepherds].sort((a, b) => a.fullName.localeCompare(b.fullName));

  for (const shepherd of sortedShepherds) {
    const soulsOfShepherd = souls
      .filter(s => s.shepherdId === shepherd.id)
      .sort((a, b) => a.fullName.localeCompare(b.fullName));

    if (soulsOfShepherd.length === 0) {
      rows.push({
        'Berger(e)': shepherd.fullName,
        'Téléphone berger(e)': shepherd.phone?.replace('+225', '') || '',
        'Nom de l\'âme': 'Aucune âme assignée',
        'Téléphone âme': '',
        'Lieu d\'habitation': '',
      });
    } else {
      soulsOfShepherd.forEach(soul => {
        rows.push({
          'Berger(e)': shepherd.fullName,
          'Téléphone berger(e)': shepherd.phone?.replace('+225', '') || '',
          'Nom de l\'âme': soul.fullName,
          'Téléphone âme': soul.phone?.replace('+225', '') || '',
          'Lieu d\'habitation': soul.location || '',
        });
      });
    }
  }

  // Âmes sans berger reconnu (shepherd_id null ou berger inactif/non trouvé)
  const unassignedSouls = souls
    .filter(s => !s.shepherdId || !shepherdsById.has(s.shepherdId))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  unassignedSouls.forEach(soul => {
    rows.push({
      'Berger(e)': 'Non assigné(e)',
      'Téléphone berger(e)': '',
      'Nom de l\'âme': soul.fullName,
      'Téléphone âme': soul.phone?.replace('+225', '') || '',
      'Lieu d\'habitation': soul.location || '',
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 30 }, // Berger(e)
    { wch: 18 }, // Téléphone berger(e)
    { wch: 30 }, // Nom de l'âme
    { wch: 15 }, // Téléphone âme
    { wch: 25 }, // Lieu d'habitation
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Bergers & Âmes');

  const defaultFilename = `bergers-et-ames-${formatDateForExcel(new Date()).replace(/\//g, '-')}`;
  XLSX.writeFile(wb, `${filename || defaultFilename}.xlsx`);
}
