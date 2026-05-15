import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Department } from '../types/department.types';
import toast from 'react-hot-toast';

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error: err } = await supabase
          .from('departments')
          .select('*')
          .order('order', { ascending: true });

        if (err) throw err;

        setDepartments(
          (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            leader: row.leader,
            order: row.order,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })) as Department[]
        );
      } catch (err: any) {
        console.error('Error loading departments:', err);
        const msg = 'Erreur lors du chargement des départements';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel('departments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { departments, loading, error };
}
