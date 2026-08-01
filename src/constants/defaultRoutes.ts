// Pages proposées comme "page d'accueil par défaut" d'un utilisateur.
// La valeur vide = tableau de bord (comportement standard).
export const DEFAULT_ROUTE_OPTIONS: { value: string; label: string }[] = [
  { value: '',                          label: 'Tableau de bord (par défaut)' },
  { value: '/rapports/worship',         label: 'Rapports — Gestion de Culte' },
  { value: '/rapports/adn',             label: 'Rapports — ADN' },
  { value: '/rapports/finance',         label: 'Rapports — Emmeraude' },
  { value: '/rapports/academie',        label: 'Rapports — Académie' },
  { value: '/rapports/sainte_cene',     label: 'Rapports — Sainte Cène' },
  { value: '/rapports/sono',            label: 'Rapports — Communication & Sono' },
  { value: '/rapport-culte',            label: 'Formulaire de rapport de culte' },
  { value: '/ames',                     label: 'Toutes les âmes' },
  { value: '/assigned-souls',           label: 'Mes âmes suivies' },
  { value: '/ames-evangelisees',        label: 'Âmes évangélisées' },
  { value: '/evangelisation/relances',  label: 'À relancer (évangéliste)' },
  { value: '/evangelisation/attendus',  label: 'Attendus au culte (évangéliste)' },
  { value: '/serviteurs',               label: 'B.O.S.S' },
  { value: '/interactions',             label: 'Interactions' },
  { value: '/presences',                label: 'Présences' },
  { value: '/ma-famille/ames',          label: 'Membres de ma famille' },
];
