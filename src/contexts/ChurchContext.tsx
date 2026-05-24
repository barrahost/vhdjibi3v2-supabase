import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { setCurrentChurchId } from '../lib/churchId';
import { ChurchModules, DEFAULT_MODULES, isModuleEnabled } from '../lib/churchModules';
export { isModuleEnabled };

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
  modules: ChurchModules;
}

interface ChurchContextType {
  church: Church | null;
  churchId: string;
  loading: boolean;
  isSuperAdminDomain: boolean;
  modules: ChurchModules;
  hasModule: (key: string) => boolean;
  // Super admin only
  allChurches: Church[];
  selectedChurchId: string;
  setSelectedChurchId: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getSlugFromHostname(hostname: string): string | null {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return null;
  }
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain === 'bergerie-adm') return null;
    return subdomain;
  }
  return null;
}

function isSuperAdmin(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return false;
  }
  const parts = hostname.split('.');
  if (parts.length >= 3 && parts[0] === 'bergerie-adm') return true;
  return parts.length < 3;
}

function mapRow(data: Record<string, unknown>): Church {
  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    logoUrl: (data.logo_url as string) ?? null,
    primaryColor: (data.primary_color as string) || '#00665C',
    address: (data.address as string) ?? null,
    phone: (data.phone as string) ?? null,
    email: (data.email as string) ?? null,
    status: data.status as string,
    modules: (data.modules as ChurchModules) ?? DEFAULT_MODULES,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ChurchContext = createContext<ChurchContextType>({
  church: null,
  churchId: 'bergerie',
  loading: true,
  isSuperAdminDomain: false,
  modules: DEFAULT_MODULES,
  hasModule: () => true,
  allChurches: [],
  selectedChurchId: '',
  setSelectedChurchId: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [allChurches, setAllChurches] = useState<Church[]>([]);
  const [selectedChurchId, _setSelectedChurchId] = useState<string>('');

  const hostname = window.location.hostname;
  const slug = getSlugFromHostname(hostname);
  const superAdminDomain = isSuperAdmin(hostname);

  /** Change selected church + update the module singleton so all queries auto-filter */
  const setSelectedChurchId = (id: string) => {
    _setSelectedChurchId(id);
    setCurrentChurchId(id);
  };

  useEffect(() => {
    if (superAdminDomain) {
      supabase
        .from('churches')
        .select('*')
        .eq('status', 'active')
        .order('name')
        .then(({ data, error }: { data: Record<string, unknown>[] | null, error: unknown }) => {
          if (!error && data && data.length > 0) {
            const churches = data.map(mapRow);
            setAllChurches(churches);
            _setSelectedChurchId(churches[0].id);
            setCurrentChurchId(churches[0].id);
          }
          setLoading(false);
        });
      return;
    }

    const effectiveSlug = slug || 'bergerie';

    supabase
      .from('churches')
      .select('*')
      .eq('slug', effectiveSlug)
      .eq('status', 'active')
      .single()
      .then(({ data, error }: { data: Record<string, unknown> | null, error: unknown | null }) => {
        if (error || !data) {
          console.error(`Eglise "${effectiveSlug}" introuvable:`, error);
          const fallback: Church = {
            id: 'bergerie',
            name: 'Assemblee Grace Confondante',
            slug: 'bergerie',
            logoUrl: null,
            primaryColor: '#00665C',
            address: null,
            phone: null,
            email: null,
            status: 'active',
            modules: DEFAULT_MODULES,
          };
          setCurrentChurchId('bergerie');
          setChurch(fallback);
        } else {
          setCurrentChurchId(data.id as string);
          setChurch(mapRow(data));
        }
        setLoading(false);
      });
  }, []);

  const churchId = church?.id || (superAdminDomain ? selectedChurchId : 'bergerie');

  const modules = church?.modules ?? DEFAULT_MODULES;
  const hasModule = (key: string) => isModuleEnabled(modules, key);

  return (
    <ChurchContext.Provider
      value={{
        church,
        churchId,
        loading,
        isSuperAdminDomain: superAdminDomain,
        modules,
        hasModule,
        allChurches,
        selectedChurchId,
        setSelectedChurchId,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
}

export const useChurch = () => useContext(ChurchContext);
