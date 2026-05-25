import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

export interface Speaker {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

/**
 * Charge la liste des orateurs configurés (table audio_speakers, actifs uniquement).
 * Calqué sur useCategories. Pas de toast bloquant en cas d'erreur : la table peut
 * ne pas encore exister tant que la migration n'a pas été appliquée.
 */
export function useSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('audio_speakers')
          .select('*')
          .eq('church_id', getChurchId())
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) throw error;
        setSpeakers((data || []) as Speaker[]);
      } catch (error) {
        console.error('Error loading speakers:', error);
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel('audio-speakers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_speakers' }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { speakers, loading };
}
