import type { Church } from '../contexts/ChurchContext';

// Nom du produit (commun à tous les tenants)
const PRODUCT = 'Bergerie';
const DEFAULT_COLOR = '#00665C';

// Conserve le dernier blob de manifest pour le révoquer au changement d'église
let manifestBlobUrl: string | null = null;

/** Crée/met à jour une balise <meta name="..."> et renvoie l'élément. */
function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Met à jour le href d'un <link rel="..."> (crée la balise si absente). */
function setLinkHref(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function guessIconType(url: string): string {
  return url.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png';
}

/**
 * Applique le branding du tenant courant au document :
 * titre de l'onglet, theme-color, favicon et manifest PWA (généré dynamiquement).
 * Sans église (avant chargement / domaine super-admin sans sélection) → branding produit neutre.
 */
export function applyChurchBranding(church: Church | null) {
  const origin = window.location.origin;
  const name = church?.name || PRODUCT;
  const shortName = church?.shortName || PRODUCT;
  const color = church?.primaryColor || DEFAULT_COLOR;

  // 1. Titre de l'onglet : « Bergerie — <église> »
  document.title = church ? `${PRODUCT} — ${name}` : PRODUCT;

  // 2. Couleur du chrome navigateur (mobile)
  setMeta('theme-color', color);

  // 3. Favicon par église (best-effort)
  if (church?.logoUrl) {
    setLinkHref('icon', church.logoUrl);
  }

  // 4. Manifest PWA dynamique — URLs ABSOLUES (un manifest blob: résout le relatif contre l'URL du blob)
  const icons = church?.logoUrl
    ? [{ src: church.logoUrl, sizes: 'any', type: guessIconType(church.logoUrl), purpose: 'any maskable' }]
    : [
        { src: `${origin}/logo-192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${origin}/logo-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        { src: `${origin}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
      ];

  const manifest = {
    name: `${PRODUCT} — ${name}`,
    short_name: shortName,
    description: `Application de suivi pastoral — ${name}`,
    start_url: `${origin}/`,
    scope: `${origin}/`,
    display: 'standalone',
    background_color: color,
    theme_color: color,
    icons,
  };

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  if (manifestBlobUrl) URL.revokeObjectURL(manifestBlobUrl);
  manifestBlobUrl = URL.createObjectURL(blob);
  setLinkHref('manifest', manifestBlobUrl);
}
