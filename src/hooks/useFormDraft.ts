import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

interface Options<T> {
  /** Remet le brouillon retrouvé dans le formulaire (appelé une fois, au chargement de la page). */
  restore: (draft: T) => void;
  /** Rien de saisi : pas de brouillon à garder. */
  isEmpty: (value: T) => boolean;
  /** Faux une fois le formulaire envoyé (sinon le brouillon serait réécrit avec la saisie envoyée). */
  enabled?: boolean;
  /** Durée de conservation (12 h par défaut). */
  ttlMs?: number;
  /** Message affiché quand une saisie est retrouvée ; null pour n'en afficher aucun. */
  restoredMessage?: string | null;
}

/**
 * Brouillon d'un formulaire public, gardé sur le téléphone : après un rechargement (réseau coupé, appel reçu,
 * page fermée par erreur, souci d'affichage), la personne retrouve ce qu'elle avait saisi au lieu de tout recommencer.
 * Le brouillon est effacé par `clear()` une fois le formulaire envoyé, et expire de lui-même au bout de `ttlMs`.
 */
export function useFormDraft<T>(key: string, value: T, options: Options<T>) {
  const { restore, isEmpty, enabled = true, ttlMs = DEFAULT_TTL_MS, restoredMessage = 'Ta saisie en cours a été retrouvée : tu peux continuer.' } = options;
  const storageKey = `brouillon:${key}`;
  // On n'enregistre qu'après avoir tenté la reprise : sinon la saisie vide du premier affichage effacerait le brouillon
  const [hydrated, setHydrated] = useState(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    // Formulaire désactivé (ex. même formulaire utilisé dans une fenêtre de l'application) : pas de reprise
    if (!enabled) {
      setHydrated(true);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as { value: T; savedAt: number } | null;
      if (saved && Date.now() - saved.savedAt <= ttlMs && !isEmpty(saved.value)) {
        restoreRef.current(saved.value);
        if (restoredMessage) toast.success(restoredMessage, { id: `draft-${key}`, duration: 5000 });
      } else if (saved) {
        localStorage.removeItem(storageKey);
      }
    } catch {
      /* stockage indisponible ou brouillon illisible : on repart de zéro */
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const serialized = JSON.stringify(value);
  useEffect(() => {
    if (!hydrated || !enabled) return;
    try {
      if (isEmpty(value)) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, JSON.stringify({ value, savedAt: Date.now() }));
    } catch {
      /* navigation privée : pas de brouillon */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, enabled, serialized, storageKey]);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignoré */
    }
  }, [storageKey]);

  return { clear };
}
