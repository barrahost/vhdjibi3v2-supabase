import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import { DEPARTMENT_NAME_BY_REPORT_TYPE, normalizeDeptName } from '../types/culteReport.types';

// Annuaire léger (départements et utilisateurs actifs) partagé par le module « Cultes » :
// sélecteurs de responsable, droits par département, destinataires des notifications.

export interface DirectoryDepartment {
  id: string;
  name: string;
}

export interface DirectoryUser {
  id: string;
  fullName: string;
  phone: string | null;
  role: string | null;
  profileTypes: string[];
  /** Départements dirigés (profil responsable de département). */
  ledDepartmentIds: string[];
  /** Départements supervisés (profil pasteur assistant). */
  supervisedDepartmentIds: string[];
}

/** Casquettes qui donnent accès au module (permission MANAGE_CULTE_REPORTS) : un responsable doit pouvoir ouvrir son action. */
export const CULTE_ACCESS_ROLES = ['admin', 'super_admin', 'pasteur', 'pasteur_assistant', 'department_leader'];

const TTL_MS = 5 * 60_000;

interface CacheEntry<T> {
  churchId: string;
  at: number;
  data: T;
}

let departmentsCache: CacheEntry<DirectoryDepartment[]> | null = null;
let usersCache: CacheEntry<DirectoryUser[]> | null = null;

const fresh = <T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> =>
  !!entry && entry.churchId === getChurchId() && Date.now() - entry.at < TTL_MS;

export const CulteDirectory = {
  async departments(): Promise<DirectoryDepartment[]> {
    if (fresh(departmentsCache)) return departmentsCache.data;
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, status')
      .eq('church_id', getChurchId());
    if (error) throw error;
    const list: DirectoryDepartment[] = (data ?? [])
      .filter((d: any) => !d.status || d.status === 'active')
      .map((d: any) => ({ id: d.id, name: d.name }))
      .sort((a: DirectoryDepartment, b: DirectoryDepartment) => a.name.localeCompare(b.name, 'fr'));
    departmentsCache = { churchId: getChurchId(), at: Date.now(), data: list };
    return list;
  },

  async users(): Promise<DirectoryUser[]> {
    if (fresh(usersCache)) return usersCache.data;
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, phone, role, business_profiles, status')
      .eq('church_id', getChurchId())
      .eq('status', 'active');
    if (error) throw error;
    const list: DirectoryUser[] = (data ?? [])
      .filter((u: any) => !!u.full_name)
      .map((u: any) => {
        const profiles: any[] = Array.isArray(u.business_profiles) ? u.business_profiles : [];
        const types = new Set<string>(profiles.map((p) => p?.type).filter(Boolean));
        if (u.role) types.add(u.role);
        return {
          id: u.id,
          fullName: u.full_name,
          phone: u.phone ?? null,
          role: u.role ?? null,
          profileTypes: Array.from(types),
          ledDepartmentIds: getProfileDepartmentIds(profiles.find((p) => p?.type === 'department_leader')),
          supervisedDepartmentIds: getProfileDepartmentIds(profiles.find((p) => p?.type === 'pasteur_assistant')),
        };
      })
      .sort((a: DirectoryUser, b: DirectoryUser) => a.fullName.localeCompare(b.fullName, 'fr'));
    usersCache = { churchId: getChurchId(), at: Date.now(), data: list };
    return list;
  },

  /** Personnes à qui confier une action : celles qui ont accès au plan d'actions (sinon la notification mènerait nulle part). */
  async assignableUsers(): Promise<DirectoryUser[]> {
    const users = await this.users();
    return users.filter((u) => u.profileTypes.some((t) => CULTE_ACCESS_ROLES.includes(t)));
  },

  /** Utilisateurs à prévenir pour un brief : responsables de département, assistants et pasteurs. */
  async briefAudience(): Promise<DirectoryUser[]> {
    const users = await this.users();
    const wanted = new Set(['department_leader', 'pasteur_assistant', 'pasteur']);
    return users.filter((u) => u.profileTypes.some((t) => wanted.has(t)));
  },

  /** Responsables du culte à alerter en direct : pasteurs et direction du département « Gestion des cultes ». */
  async managersAudience(): Promise<DirectoryUser[]> {
    const [users, departments] = await Promise.all([this.users(), this.departments()]);
    const wanted = normalizeDeptName(DEPARTMENT_NAME_BY_REPORT_TYPE.worship);
    const culteDepartmentId = departments.find((d) => normalizeDeptName(d.name) === wanted)?.id;
    return users.filter(
      (u) =>
        u.profileTypes.includes('pasteur') ||
        (!!culteDepartmentId && (u.ledDepartmentIds.includes(culteDepartmentId) || u.supervisedDepartmentIds.includes(culteDepartmentId)))
    );
  },

  /** Responsables (et assistants superviseurs) d'un département. */
  async leadersOf(departmentId: string): Promise<DirectoryUser[]> {
    const users = await this.users();
    return users.filter(
      (u) => u.ledDepartmentIds.includes(departmentId) || u.supervisedDepartmentIds.includes(departmentId)
    );
  },

  invalidate() {
    departmentsCache = null;
    usersCache = null;
  },
};
