import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { setCurrentChurchId } from '../lib/churchId';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Church {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
}

interface ChurchContextType {
  church: Church | null;
  churchId: string;
  loading: boolean;
  isSuperAdminDomain: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extrait le slug depuis le hostname.
 * agc.evdh.org       → 'agc'
 * bergerie.evdh.org  → null  (super admin domain)
 * evdh.org           → null  (super admin domain)
 * localhost          → null  (dev → fallback 'agc')
 */
function getSlugFromHostname(hostname: string): string | null {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return null; // dev
  }
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain === 'bergerie') return null; // super admin
    return subdomain;
  }
  return null; // root domain = super admin
}

function isSuperAdmin(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return false; // dev = church mode
  }
  const slug = getSlugFromHostname(hostname);
  return slug === null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ChurchContext = createContext<ChurchContextType>({
  church: null,
  churchId: 'agc',
  loading: true,
  isSuperAdminDomain: false,
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);

  const hostname = window.location.hostname;
  const slug = getSlugFromHostname(hostname);
  const superAdminDomain = isSuperAdmin(hostname);

  useEffect(() => {
    if (superAdminDomain) {
      // Domaine super admin — pas de church context nécessaire
      setLoading(false);
      return;
    }

    const effectiveSlug = slug || 'agc'; // localhost → AGC par défaut

    supabase
      .from('churches')
      .select('*')
      .eq('slug', effectiveSlug)
      .eq('status', 'active')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error(`Église "${effectiveSlug}" introuvable:`, error);
          // Fallback : utiliser AGC
          setCurrentChurchId(data.id);
        setChurch({
            id: 'agc',
            name: 'Assemblée Grâce Confondante',
            slug: 'agc',
            logoUrl: null,
            primaryColor: '#00665C',
            address: null,
            phone: null,
            email: null,
            status: 'active',
          });
        } else {
          setCurrentChurchId(data.id);
        setChurch({
            id: data.id,
            name: data.name,
            slug: data.slug,
            logoUrl: data.logo_url,
            primaryColor: data.primary_color || '#00665C',
            address: data.address,
            phone: data.phone,
            email: data.email,
            status: data.status,
          });
        }
        setLoading(false);
      });
  }, []);

  const churchId = church?.id || (superAdminDomain ? '' : 'agc');

  return (
    <ChurchContext.Provider
      value={{
        church,
        churchId,
        loading,
        isSuperAdminDomain: superAdminDomain,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);
