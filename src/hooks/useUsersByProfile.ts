import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
 * (soit dans `businessProfiles`, soit via le champ legacy `role`).
 */
export function useUsersByProfile(profileTypes: BusinessProfileType[]) {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'users'), where('status', '==', 'active'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as SimpleUser));

        const filtered = all.filter(u => {
          // Nouveau système : profils métier
          const fromProfiles = (u.businessProfiles || []).some(p =>
            profileTypes.includes(p.type)
          );
          // Système legacy : champ role
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
