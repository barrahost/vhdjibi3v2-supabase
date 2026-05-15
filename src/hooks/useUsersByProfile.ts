import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { BusinessProfileType } from '../types/businessProfile.types';

export interface SimpleUser {
  id: string;
  uid?: string;
  fullName: string;
  nickname?: string;
  phone?: string;
  role?: string;
  businessProfiles?: { type: BusinessProfileType; isActive?: boolean }[];
}

/**
 * Récupère les utilisateurs ayant un certain profil métier
 * (soit dans `business_profiles`, soit via le champ legacy `role`).
 */
export function useUsersByProfile(profileTypes: BusinessProfileType[]) {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('users')
          .select('id, uid, full_name, nickname, phone, role, business_profiles')
          .eq('status', 'active');

        if (err) throw err;

        const all: SimpleUser[] = (data || []).map((row: any) => ({
          id: row.id,
          uid: row.uid,
          fullName: row.full_name,
          nickname: row.nickname,
          phone: row.phone,
          role: row.role,
          businessProfiles: row.business_profiles || [],
        }));

        const filtered = all.filter(u => {
          const fromProfiles = (u.businessProfiles || []).some(p =>
            profileTypes.includes(p.type)
          );
          const fromRole = u.role && profileTypes.includes(u.role as BusinessProfileType);
          return fromProfiles || fromRole;
        });

        setUsers(filtered);
      } catch (err: any) {
        console.error('Error loading users by profile:', err);
        setError(err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [JSON.stringify(profileTypes)]);

  return { users, loading, error };
}
