import { supabase } from './supabase';

// Le module « Cultes » (brief, contrôle, débrief, plan d'actions) repose sur les tables créées
// par supabase_culte_brief_debrief.sql. Tant que ce script n'a pas été exécuté, l'appli se
// comporte exactement comme avant : on sonde donc l'existence d'une de ces tables, une seule
// fois par session, et tout le reste de l'interface en dépend.
let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

// Table absente : 42P01 (Postgres) ou PGRST205 (PostgREST, table inconnue du cache). Surtout pas
// PGRST002 (« Could not query the database for the schema cache », un 503 passager pendant le
// rechargement du schéma) : il ne doit pas désactiver le module pour toute la session.
function isMissingTable(error: any): boolean {
  const code = error?.code;
  const message = String(error?.message || '');
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /Could not find the table|relation .* does not exist/i.test(message)
  );
}

/** Résultat déjà connu de la sonde (null tant qu'elle n'a pas abouti). */
export const getCachedCulteModule = (): boolean | null => cached;

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
