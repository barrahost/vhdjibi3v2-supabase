import { useEffect, useState } from 'react';

/** La page est-elle traduite par le navigateur ? (Google Traduction marque la page et change sa langue.) */
function isTranslated(): boolean {
  const html = document.documentElement;
  if (html.classList.contains('translated-ltr') || html.classList.contains('translated-rtl')) return true;
  const lang = (html.getAttribute('lang') || '').toLowerCase();
  if (lang && !lang.startsWith('fr')) return true;
  return !!document.querySelector('font[style*="vertical-align: inherit"]');
}

/**
 * Prévient la personne si son navigateur traduit quand même la page (malgré la demande de ne pas le faire) :
 * la traduction automatique peut perturber l'affichage. Le bandeau peut être fermé.
 */
export function TranslationWarning() {
  const [translated, setTranslated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => setTranslated(isTranslated());
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'lang'] });
    const timer = setInterval(check, 3000);
    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, []);

  if (!translated || dismissed) return null;
  return (
    <div
      role="alert"
      translate="no"
      data-testid="translation-warning"
      className="notranslate fixed top-0 inset-x-0 z-[10000] bg-amber-500 text-white px-4 py-2.5 shadow-md"
    >
      <div className="max-w-2xl mx-auto flex items-start gap-3 text-sm">
        <p className="flex-1 leading-snug">
          <span className="font-semibold">Cette page est en cours de traduction.</span> L’application est en français : désactive la
          traduction de ton navigateur (« Ne jamais traduire ce site ») pour éviter les erreurs d’affichage.
        </p>
        <button type="button" onClick={() => setDismissed(true)} className="flex-shrink-0 font-semibold underline">
          OK
        </button>
      </div>
    </div>
  );
}
