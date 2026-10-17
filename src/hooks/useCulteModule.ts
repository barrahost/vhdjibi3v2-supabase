import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Le module « Cultes » (brief, contrôle, débrief, plan d'actions) repose sur les tables créées
// par supabase_culte_brief_debrief.sql. Tant que ce script n'a pas été exécuté, l'appli se
// comporte exactement comme avant : on sonde donc l'existence d'une de ces tables, une seule
// fois par session, et tout le reste de l'interface en dépend.
let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

function isMissingTable(error: any): boolean {
  const code = error?.code;
  const message = String(error?.message || '');
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /does not exist|schema cache|Could not find the table/i.test(message)
  );
}

export function probeCulteModule(): Promise<boolean> {
  if (cached !== null) return Promise.resolve(cached);
  if (!inflight) {
    inflight = (async () => {
      try {
        const { error } = await supabase.from('culte_meetings').select('id').limit(1);
        if (!error) cached = true;
        else if (isMissingTable(error)) cached = false;
        // Autre erreur (réseau…) : on ne mémorise rien, le prochain montage ré-essaiera.
      } catch {
        /* idem */
      }
      inflight = null;
      return cached ?? false;
    })();
  }
  return inflight;
}

/** `skip` évite la requête pour les profils qui n'ont aucun accès aux cultes. */
export function useCulteModule(options: { skip?: boolean } = {}): { enabled: boolean; loading: boolean } {
  const skip = !!options.skip;
  const [enabled, setEnabled] = useState<boolean>(cached ?? false);
  const [loading, setLoading] = useState<boolean>(!skip && cached === null);

  useEffect(() => {
    if (skip || cached !== null) {
      if (cached !== null) {
        setEnabled(cached);
        setLoading(false);
      }
      return;
    }
    let cancelled = false;
    probeCulteModule().then((value) => {
      if (cancelled) return;
      setEnabled(value);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [skip]);

  return { enabled: skip ? false : enabled, loading };
}
