import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { buildSave, canTakeAttendance, dayRange, latestPerSoul, seesAllSouls, shepherdKeys, type AttendanceRow, type PresenceMark } from '../lib/attendance';

const PAGE_SIZE = 1000;
const MAX_PAGES = 50;
const CHUNK = 100; // identifiants par requête « in » : l'adresse de la requête reste courte

export interface AttendanceUser {
  id: string;
  uid: string | null;
  fullName: string;
  canTake: boolean;
  seesAll: boolean;
  /** Identifiants possibles du berger dans souls.shepherd_id et attendances.shepherd_id. */
  keys: string[];
}

export interface PointableSoul {
  id: string;
  fullName: string;
  nickname: string;
  phone: string;
}

/** Lit toutes les lignes d'une requête, au-delà du plafond de lignes par requête du serveur. */
async function readAll<T>(make: () => any): Promise<T[]> {
  const all: T[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data, error } = await make().range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return all;
}

function chunks<T>(items: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

export const AttendanceService = {
  /** La personne connectée (lue en base : son rôle et ses casquettes font foi). */
  async currentUser(): Promise<AttendanceUser | null> {
    let localId: string | undefined;
    try {
      localId = JSON.parse(localStorage.getItem('user') || '{}').id;
    } catch {
      localId = undefined;
    }
    if (!localId) return null;
    const { data, error } = await supabase
      .from('users')
      .select('id, uid, full_name, role, business_profiles')
      .eq('church_id', getChurchId())
      .eq('id', localId)
      .limit(1);
    if (error) throw error;
    const row = data?.[0];
    if (!row) return null;
    return {
      id: row.id,
      uid: row.uid ?? null,
      fullName: row.full_name ?? '',
      canTake: canTakeAttendance(row),
      seesAll: seesAllSouls(row),
      keys: shepherdKeys(row),
    };
  },

  /** Les âmes à pointer : celles du berger (enregistrées sous son id ou son uid), ou toutes pour l'administration. */
  async souls(user: AttendanceUser): Promise<PointableSoul[]> {
    const rows = await readAll<any>(() => {
      let query = supabase
        .from('souls')
        .select('id, full_name, nickname, phone')
        .eq('church_id', getChurchId())
        .or('status.eq.active,status.is.null')
        .order('id', { ascending: true });
      if (!user.seesAll) query = query.in('shepherd_id', user.keys);
      return query;
    });
    return rows.map((row) => ({
      id: String(row.id),
      fullName: String(row.full_name ?? '').trim(),
      nickname: String(row.nickname ?? '').trim(),
      phone: String(row.phone ?? '').trim(),
    }));
  },

  /**
   * Les présences déjà enregistrées ce jour-là (quel que soit le berger qui les a saisies) : pour ces âmes, ou pour
   * toute l'église (soulIds = null).
   */
  async forDay(day: string, soulIds: string[] | null): Promise<AttendanceRow[]> {
    const { from, to } = dayRange(day);
    const base = () =>
      supabase
        .from('attendances')
        .select('id, soul_id, shepherd_id, date, present, notes, created_at, updated_at')
        .eq('church_id', getChurchId())
        .gte('date', from)
        .lt('date', to)
        .order('id', { ascending: true });
    if (soulIds === null) return readAll<AttendanceRow>(base);
    const results: AttendanceRow[] = [];
    for (const ids of chunks(soulIds)) results.push(...(await readAll<AttendanceRow>(() => base().in('soul_id', ids))));
    return results;
  },

  /**
   * Enregistre le pointage d'une journée : met à jour la présence déjà saisie pour une âme ce jour-là, ou en crée
   * une ; supprime les doublons laissés par l'ancien formulaire. Toute erreur de la base remonte à l'écran.
   */
  async saveDay(params: { day: string; marks: Map<string, PresenceMark>; user: AttendanceUser; scope: string[] | null }) {
    const { day, marks, user, scope } = params;
    // Relu juste avant d'écrire (un autre appareil a pu pointer entre-temps), sur toutes les âmes du formulaire :
    // les doublons de la journée sont nettoyés même pour les âmes qu'on ne modifie pas.
    const { bySoul, duplicates } = latestPerSoul(await AttendanceService.forDay(day, scope));
    const plan = buildSave({
      day,
      marks,
      existing: bySoul,
      duplicates,
      shepherdId: user.id,
      churchId: getChurchId(),
      now: new Date().toISOString(),
      newId: () => crypto.randomUUID(),
    });
    for (const rows of chunks(plan.inserts)) {
      const { error } = await supabase.from('attendances').insert(rows);
      if (error) throw error;
    }
    for (const update of plan.updates) {
      for (const ids of chunks(update.ids)) {
        const { data, error } = await supabase
          .from('attendances')
          .update({ present: update.present, updated_at: new Date().toISOString() })
          .in('id', ids)
          .select('id');
        if (error) throw error;
        // Une règle de la base peut refuser la modification sans erreur : on vérifie qu'elle a bien eu lieu.
        if ((data ?? []).length < ids.length) throw new Error('la base de données a refusé la correction des présences déjà enregistrées');
      }
    }
    // Les doublons de l'ancien formulaire : leur suppression n'est pas indispensable (on ne lit que le plus récent).
    for (const ids of chunks(plan.deleteIds)) {
      const { error } = await supabase.from('attendances').delete().in('id', ids);
      if (error) console.warn('Doublons de présence non supprimés :', error);
    }
    return plan;
  },

  /**
   * L'historique des présences depuis un jour donné (ou depuis toujours) : pour un berger, celles qu'il a saisies
   * (sous son id ou son uid) et celles de ses âmes ; pour l'administration, toutes.
   */
  async history(user: AttendanceUser, soulIds: string[], sinceDay: string | null): Promise<AttendanceRow[]> {
    const base = () => {
      let query = supabase
        .from('attendances')
        .select('id, soul_id, shepherd_id, date, present, notes, created_at, updated_at')
        .eq('church_id', getChurchId())
        .order('date', { ascending: false })
        .order('id', { ascending: true });
      if (sinceDay) query = query.gte('date', dayRange(sinceDay).from);
      return query;
    };
    if (user.seesAll) return readAll<AttendanceRow>(base);
    const byId = new Map<string, AttendanceRow>();
    (await readAll<AttendanceRow>(() => base().in('shepherd_id', user.keys))).forEach((row) => byId.set(row.id, row));
    for (const ids of chunks(soulIds)) {
      (await readAll<AttendanceRow>(() => base().in('soul_id', ids))).forEach((row) => byId.set(row.id, row));
    }
    return Array.from(byId.values());
  },

  /** Noms des âmes, par paquets d'identifiants. */
  async soulNames(ids: string[]): Promise<Map<string, { fullName: string; phone: string }>> {
    const names = new Map<string, { fullName: string; phone: string }>();
    for (const chunk of chunks(Array.from(new Set(ids)))) {
      const { data, error } = await supabase.from('souls').select('id, full_name, phone').eq('church_id', getChurchId()).in('id', chunk);
      if (error) throw error;
      (data ?? []).forEach((s: any) => names.set(String(s.id), { fullName: s.full_name ?? '', phone: s.phone ?? '' }));
    }
    return names;
  },
};
