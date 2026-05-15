import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader: string;
  leaderId?: string;
  shepherdIds?: string[];
  order: number;
  status: 'active' | 'inactive';
  createdAt: string | null;
  updatedAt: string | null;
}

export function useServiceFamilies(onlyActive: boolean = true) {
  const [families, setFamilies] = useState<ServiceFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        let q = supabase
          .from('service_families')
          .select('*')
          .order('order', { ascending: true });

        if (onlyActive) {
          q = q.eq('status', 'active');
        }

        const { data, error: err } = await q;
        if (err) throw err;

        setFamilies(
          (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            leader: row.leader,
            leaderId: row.leader_id,
            shepherdIds: row.shepherd_ids,
            order: row.order,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })) as ServiceFamily[]
        );
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
