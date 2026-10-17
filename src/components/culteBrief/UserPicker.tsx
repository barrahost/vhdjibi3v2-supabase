import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { CulteDirectory, type DirectoryUser } from '../../services/culteDirectory.service';
import { BUSINESS_PROFILE_LABELS, type BusinessProfileType } from '../../types/businessProfile.types';
import { inputCls } from './ui';

export interface PickedUser {
  id: string | null;
  name: string | null;
}

interface UserPickerProps {
  value: PickedUser;
  onChange: (value: PickedUser) => void;
  placeholder?: string;
  /** Les responsables de ce département sont proposés en premier. */
  suggestedDepartmentId?: string | null;
  disabled?: boolean;
  /** id de la zone de saisie (pour relier un libellé). */
  inputId?: string;
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function roleLabel(user: DirectoryUser): string {
  const type = user.profileTypes.find((t) => t in BUSINESS_PROFILE_LABELS) as BusinessProfileType | undefined;
  return type ? BUSINESS_PROFILE_LABELS[type] : '';
}

/**
 * Choix d'une personne de l'appli (pour la notifier) avec recherche par nom. Un nom saisi qui ne
 * correspond à personne est conservé tel quel (responsable hors appli, sans notification).
 */
export function UserPicker({ value, onChange, placeholder = 'Choisir une personne…', suggestedDepartmentId, disabled, inputId }: UserPickerProps) {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [query, setQuery] = useState(value.name ?? '');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    CulteDirectory.users().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => setQuery(value.name ?? ''), [value.name]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const matches = useMemo(() => {
    const needle = normalize(query.trim());
    const filtered = needle ? users.filter((u) => normalize(u.fullName).includes(needle)) : users;
    const priority = (u: DirectoryUser) =>
      suggestedDepartmentId && (u.ledDepartmentIds.includes(suggestedDepartmentId) || u.supervisedDepartmentIds.includes(suggestedDepartmentId)) ? 0 : 1;
    return [...filtered].sort((a, b) => priority(a) - priority(b) || a.fullName.localeCompare(b.fullName, 'fr')).slice(0, 8);
  }, [users, query, suggestedDepartmentId]);

  const pick = (user: DirectoryUser) => {
    onChange({ id: user.id, name: user.fullName });
    setQuery(user.fullName);
    setOpen(false);
  };

  const commitFreeText = () => {
    const typed = query.trim();
    if (!typed) {
      if (value.id || value.name) onChange({ id: null, name: null });
    } else if (typed !== value.name) {
      const exact = users.find((u) => normalize(u.fullName) === normalize(typed));
      onChange(exact ? { id: exact.id, name: exact.fullName } : { id: null, name: typed });
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onBlur={() => window.setTimeout(commitFreeText, 150)}
          className={`${inputCls} pr-8`}
          autoComplete="off"
        />
        {query && !disabled && (
          <button
            type="button"
            aria-label="Effacer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('');
              onChange({ id: null, name: null });
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && !disabled && matches.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg">
          {matches.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(user)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="min-w-0 truncate">{user.fullName}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                  {roleLabel(user)}
                  {value.id === user.id && <Check className="w-3 h-3 text-[#00665C]" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!value.id && value.name && (
        <p className="mt-1 text-xs text-gray-400">Hors appli : cette personne ne sera pas notifiée.</p>
      )}
    </div>
  );
}
