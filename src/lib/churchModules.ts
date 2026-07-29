/**
 * Définition des modules disponibles dans l'application.
 * Chaque module peut être activé/désactivé par église via bergerie-adm.
 */

export interface ModuleDefinition {
  key: string;
  label: string;
  description: string;
  icon: string;
  category: 'pastoral' | 'administration' | 'communication' | 'statistiques';
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  // Pastoral
  { key: 'souls',                label: 'Gestion des Âmes',         description: 'Âmes, âmes indécises, suivi spirituel', icon: '❤️',  category: 'pastoral' },
  { key: 'evangelization',       label: 'Évangélisation',            description: 'Âmes évangélisées par les stagiaires',  icon: '🌱',  category: 'pastoral' },
  { key: 'interactions',         label: 'Interactions & Rappels',    description: 'Suivi des interactions et rappels bergers', icon: '💬', category: 'pastoral' },
  { key: 'attendance',           label: 'Présences',                 description: 'Gestion des présences aux cultes',       icon: '📅',  category: 'pastoral' },
  { key: 'spiritual_progression',label: 'Progression Spirituelle',   description: 'Suivi de la progression des membres',    icon: '📈',  category: 'pastoral' },
  { key: 'soul_map',             label: 'Carte des Âmes',            description: 'Carte géographique des membres',         icon: '🗺️',  category: 'pastoral' },
  { key: 'birthdays',            label: 'Anniversaires',             description: 'Liste et rappels des anniversaires',     icon: '🎂',  category: 'pastoral' },
  // Administration
  { key: 'users',                label: 'Utilisateurs',              description: 'Gestion des membres et rôles',           icon: '👥',  category: 'administration' },
  { key: 'servants',             label: 'B.O.S.S',                description: 'Gestion des B.O.S.S',                 icon: '🤝',  category: 'administration' },
  { key: 'departments',          label: 'Départements & Familles',   description: 'Gestion des départements et familles',   icon: '🏢',  category: 'administration' },
  // Communication
  { key: 'sms',                  label: 'SMS',                       description: 'Envoi de SMS et modèles',                icon: '📱',  category: 'communication' },
  { key: 'audio',                label: 'Replay & Audio',            description: 'Gestion des médias et replay cultes',    icon: '🎧',  category: 'communication' },
  // Statistiques
  { key: 'statistics',           label: 'Statistiques',              description: 'Tableaux de bord et rapports',           icon: '📊',  category: 'statistiques' },
];

export type ModuleKey = typeof MODULE_DEFINITIONS[number]['key'];

/** Config par défaut : tous les modules activés */
export const DEFAULT_MODULES: Record<string, boolean> = Object.fromEntries(
  MODULE_DEFINITIONS.map(m => [m.key, true])
);

export type ChurchModules = Record<string, boolean>;

/** Vérifie si un module est actif (défaut: true si absent de la config) */
export function isModuleEnabled(modules: ChurchModules | null | undefined, key: string): boolean {
  if (!modules) return true; // pas de config = tout activé
  if (key in modules) return modules[key];
  return true; // module inconnu = activé par défaut
}
