import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

export const DEFAULT_PHONE_COUNTRY: CountryCode = 'CI';

interface CountryOption {
  code: CountryCode;
  name: string;
  dial: string;
}

function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' });
  } catch {
    return null;
  }
})();

const ALL_COUNTRIES: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: regionNames?.of(code) || code,
    dial: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

/** Devine le pays d'un numero deja stocke (avec ou sans '+') -- par defaut Cote d'Ivoire,
 * pour rester retro-compatible avec tous les numeros existants saisis sans indicatif. */
function guessCountry(value: string | undefined | null): CountryCode {
  if (!value) return DEFAULT_PHONE_COUNTRY;
  try {
    const parsed = parsePhoneNumberFromString(value, DEFAULT_PHONE_COUNTRY);
    if (parsed?.country) return parsed.country;
  } catch {
    // ignore
  }
  return DEFAULT_PHONE_COUNTRY;
}

function nationalDigits(value: string | undefined | null, country: CountryCode): string {
  if (!value) return '';
  try {
    const parsed = parsePhoneNumberFromString(value, country);
    if (parsed) return parsed.formatNational().replace(/\D/g, '');
  } catch {
    // ignore
  }
  return value.replace(/\D/g, '');
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, placeholder, required, className = '', disabled }: PhoneInputProps) {
  const [country, setCountry] = useState<CountryCode>(() => guessCountry(value));
  const [national, setNational] = useState<string>(() => nationalDigits(value, guessCountry(value)));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Resynchronise si la valeur change depuis l'exterieur (ex: chargement d'une fiche existante)
  useEffect(() => {
    const guessed = guessCountry(value);
    setCountry(guessed);
    setNational(nationalDigits(value, guessed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_COUNTRIES;
    return ALL_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const current = ALL_COUNTRIES.find((c) => c.code === country) || ALL_COUNTRIES.find((c) => c.code === DEFAULT_PHONE_COUNTRY)!;

  const emitChange = (nextCountry: CountryCode, nextNational: string) => {
    const digits = nextNational.replace(/\D/g, '');
    if (!digits) { onChange(''); return; }
    onChange(`+${getCountryCallingCode(nextCountry)}${digits}`);
  };

  const handlePickCountry = (code: CountryCode) => {
    setCountry(code);
    setOpen(false);
    setSearch('');
    emitChange(code, national);
  };

  const handleNationalChange = (raw: string) => {
    setNational(raw);
    emitChange(country, raw);
  };

  return (
    <div ref={containerRef} className={`relative flex gap-2 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex-shrink-0 flex items-center gap-1.5 h-12 px-3 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>{flagEmoji(current.code)}</span>
        <span className="font-medium text-gray-700">+{current.dial}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      <input
        type="tel"
        required={required}
        disabled={disabled}
        value={national}
        onChange={(e) => handleNationalChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-12 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 transition-colors"
      />

      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-72 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un pays..."
                className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-700/30"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-xs text-center text-gray-400">Aucun pays trouvé.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handlePickCountry(c.code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                    c.code === country ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{flagEmoji(c.code)}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-gray-400 text-xs flex-shrink-0">+{c.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
