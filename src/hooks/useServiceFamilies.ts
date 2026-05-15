import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ServiceFamily } from '../types/database.types';

export function useServiceFamilies(onlyActive: boolean = true) {
  const [families, setFamilies] = useState<ServiceFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const constraints = onlyActive
          ? [where('status', '==', 'active'), orderBy('order', 'asc')]
          : [orderBy('order', 'asc')];
        const q = query(collection(db, 'serviceFamilies'), ...constraints);
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceFamily));
        setFamilies(data);
      } catch (err: any) {
        console.error('Error loading service families:', err);
        setError(err?.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onlyActive]);

  return { families, loading, error };
}
