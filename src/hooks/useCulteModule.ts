import { useEffect, useState } from 'react';
import { getCachedCulteModule, probeCulteModule } from '../lib/culteModule';

export { probeCulteModule };

/** `skip` évite la requête pour les profils qui n'ont aucun accès aux cultes. */
export function useCulteModule(options: { skip?: boolean } = {}): { enabled: boolean; loading: boolean } {
  const skip = !!options.skip;
  const [enabled, setEnabled] = useState<boolean>(getCachedCulteModule() ?? false);
  const [loading, setLoading] = useState<boolean>(!skip && getCachedCulteModule() === null);

  useEffect(() => {
    const known = getCachedCulteModule();
    if (skip || known !== null) {
      if (known !== null) {
        setEnabled(known);
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
