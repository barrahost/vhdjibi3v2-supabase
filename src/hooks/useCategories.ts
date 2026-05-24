import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('audio_categories')
          .select('*')
          .eq('church_id', getChurchId())
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories((data || []) as Category[]);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel('audio-categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_categories' }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { categories, loading };
}
