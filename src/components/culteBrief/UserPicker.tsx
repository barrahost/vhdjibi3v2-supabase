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
  // Dernier nom que ce composant a lui-même transmis : on ne réécrit pas la zone de saisie pendant la frappe
  const emitted = useRef<string | null>(value.name ?? null);

  useEffect(() => {
    CulteDirectory.assignableUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if ((value.name ?? null) !== emitted.current) {
      emitted.current = value.name ?? null;
      setQuery(value.name ?? '');
    }
  }, [value.name]);

  const emit = (next: PickedUser) => {
    emitted.current = next.name ?? null;
    onChange(next);
  };

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
    emit({ id: user.id, name: user.fullName });
    setQuery(user.fullName);
    setOpen(false);
  };

  // Chaque frappe est transmise tout de suite : un nom qui ne correspond à personne reste un responsable « hors appli »
  const handleType = (text: string) => {
    setQuery(text);
    setOpen(true);
    const typed = text.trim();
    if (!typed) return emit({ id: null, name: null });
    const exact = users.find((u) => normalize(u.fullName) === normalize(typed));
    emit(exact ? { id: exact.id, name: exact.fullName } : { id: null, name: typed });
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
          onChange={(e) => handleType(e.target.value)}
          className={`${inputCls} pr-10`}
          autoComplete="off"
        />
        {query && !disabled && (
          <button
            type="button"
            aria-label="Effacer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('');
              emit({ id: null, name: null });
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-gray-400 hover:text-gray-600"
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

      {/* Affiché dès la frappe (et non à la fermeture de la liste) : une ligne qui apparaîtrait au moment où l'on
          touche « Ajouter » décalerait le bouton entre l'appui et le relâchement, et le clic serait perdu */}
      {!value.id && value.name && (
        <p className="mt-1 text-xs text-gray-400">Hors appli : cette personne ne sera pas notifiée.</p>
      )}
    </div>
  );
}
