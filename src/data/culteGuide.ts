import type { ChecklistScope } from '../types/culteBrief.types';

// Contenu inspiré du « Guide pour les briefs & débriefs des cultes » du Centre Kodesh,
// proposé comme point de départ : tout reste modifiable dans l'appli.

/** Les 8 questions du brief, dans l'ordre de la « méthode commune d'analyse ». */
export const BRIEF_FIELDS = {
  vision: {
    label: "Atmosphère attendue",
    question: "Quelle atmosphère le Saint-Esprit attend-il pour ce culte ?",
    hint: "Préparation du culte dans l'intercession, pour recevoir les instructions du Seigneur.",
  },
  theme: {
    label: 'Thème',
    question: 'Quel est le thème de ce culte ?',
    hint: 'Pour harmoniser tous les départements autour de la même orientation.',
  },
  vigilance: {
    label: 'Points de vigilance',
    question: 'Quels sont les points de vigilance ?',
    hint: 'Annonces complémentaires, prestation, intervention spéciale, présentation (fiancés, nouveaux mariés, bébés…). Le respect du timing en est un.',
  },
  keyActors: {
    label: 'Acteurs clés',
    question: 'Qui sont les acteurs clés qui interviennent ?',
    hint: 'Chantres, dirigeant, leads, prédicateur, interventions spéciales. Une coordination chantres – com – dirigeant est de mise.',
  },
  exceptional: {
    label: 'Éléments exceptionnels',
    question: 'Quels éléments exceptionnels faut-il intégrer ?',
    hint: 'Dress code particulier (styles et couleurs), événement spécial…',
  },
  toRemember: {
    label: 'À retenir',
    question: 'Que devons-nous retenir ?',
    hint: 'Résumés du message, points clés, vidéos à archiver…',
  },
} as const;

/** Les 6 questions du débrief général. */
export const DEBRIEF_QUESTIONS = [
  { key: 'planned', label: "Qu'est-ce qui était prévu ?" },
  { key: 'happened', label: "Qu'est-ce qui s'est réellement passé ?" },
  { key: 'worked', label: "Qu'est-ce qui a bien fonctionné ?" },
  { key: 'failed', label: "Qu'est-ce qui n'a pas fonctionné ?" },
  { key: 'why', label: "Pourquoi cela n'a-t-il pas fonctionné ?" },
  { key: 'decision', label: 'Quelle décision prenons-nous pour le prochain culte ?' },
] as const;

/** Fiche de débrief d'un département. */
export const DEBRIEF_SHEET_FIELDS = [
  { key: 'positives', label: 'Points positifs', rows: 2 },
  { key: 'difficulties', label: 'Difficultés rencontrées', rows: 2 },
  { key: 'causes', label: 'Causes identifiées', rows: 2 },
  {
    key: 'needs',
    label: 'Besoins',
    hint: 'Matériel, personnel, formation, information ou coordination — un par ligne : chacun devient une action du plan.',
    rows: 3,
  },
  { key: 'solutions', label: 'Solutions proposées', rows: 2 },
] as const;

export const BRIEF_REGIE_QUESTION = 'À 6 h 00, sommes-nous réellement prêts à recevoir le peuple ?';

/** Séquences types d'un culte (titres seulement : à placer dans le temps selon l'horaire du culte). */
export const GUIDE_RUN_SHEET: { title: string; departmentName?: string; support?: string; needsRegie?: boolean; durationMin?: number }[] = [
  { title: 'Prière des serviteurs' },
  { title: 'Accueil du peuple et intercession (sujets personnels)', support: 'Fiches' },
  { title: 'Like & Share', support: 'Visuel', needsRegie: true, durationMin: 5 },
  { title: 'Louange', support: 'Paroles', needsRegie: true },
  { title: 'Intervention du dirigeant', needsRegie: true },
  { title: 'Offrande', support: 'Modalités de don', needsRegie: true },
  { title: 'Informations', support: 'Visuels et vidéos', needsRegie: true },
  { title: 'Sainte Cène', support: 'Éléments et versets', needsRegie: true },
  { title: 'Témoignages et vidéos', support: 'Vidéos validées', needsRegie: true },
  { title: 'Prédication', support: 'Bible et supports', needsRegie: true },
  { title: 'Ministère et fin du culte' },
];

export interface GuideChecklistArea {
  key: string;
  label: string;
  items: { task: string; scope?: ChecklistScope }[];
}

/** Points de contrôle du guide, à piocher département par département. `day` = une fois par jour. */
export const GUIDE_CHECKLIST_AREAS: GuideChecklistArea[] = [
  {
    key: 'accueil-securite',
    label: 'Accueil et sécurité',
    items: [
      { task: "Heure réelle d'arrivée des serviteurs", scope: 'day' },
      { task: 'Participation à la prière des serviteurs', scope: 'day' },
      { task: 'Brief et orientation du service', scope: 'day' },
      { task: 'Postes et positions définis (tribus et portiers)' },
      { task: 'Dispositif sécuritaire connu', scope: 'day' },
    ],
  },
  {
    key: 'louange-musique',
    label: 'Louange et musique',
    items: [
      { task: "Heure réelle d'arrivée des chantres et des musiciens", scope: 'day' },
      { task: 'Installation complète des instruments', scope: 'day' },
      { task: 'Liste de chants' },
      { task: 'Tenue vestimentaire et adoration gestuelle' },
      { task: 'Maquillage des chantres' },
    ],
  },
  {
    key: 'com-sono',
    label: 'Communication et sono',
    items: [
      { task: 'Micros disponibles, chargés et fonctionnels', scope: 'day' },
      { task: 'Instruments accordés et prêts', scope: 'day' },
      { task: 'Ordinateurs, écrans, câbles et retours opérationnels', scope: 'day' },
      { task: 'Coordination effective avec la régie' },
      { task: "Déroulé musical connu à l'avance" },
      { task: 'Transitions prévues entre les différents moments' },
      { task: 'Solution de secours définie en cas de problème technique', scope: 'day' },
    ],
  },
  {
    key: 'priere-serviteurs',
    label: 'Prière des serviteurs',
    items: [
      { task: 'Rassemblement de tous les serviteurs', scope: 'day' },
      { task: 'Prière commune et consécration du culte', scope: 'day' },
      { task: 'Prière pour les différents départements', scope: 'day' },
      { task: 'Prière pour les malades (si applicable)', scope: 'day' },
      { task: 'Prière pour le prédicateur et la direction du culte', scope: 'day' },
      { task: 'Prière pour la régie et les équipes techniques', scope: 'day' },
      { task: 'Présence des représentants de tous les départements', scope: 'day' },
      { task: "Démarrage de la prière à l'heure prévue", scope: 'day' },
    ],
  },
  {
    key: 'accueil-peuple',
    label: 'Accueil du peuple et intercession',
    items: [
      { task: 'Accueil chaleureux, digne et respectueux' },
      { task: 'Personnel en nombre suffisant' },
      { task: 'Confidentialité des informations recueillies' },
      { task: "Qualité de l'entretien et écoute attentive" },
      { task: 'Bonne compréhension du besoin exprimé' },
      { task: 'Fiche complète, exacte et lisible' },
      { task: 'Transmission rapide et fiable au prédicateur' },
      { task: 'Classement et traçabilité des fiches' },
    ],
  },
  {
    key: 'regie-audiovisuel',
    label: 'Régie et audiovisuel',
    items: [
      { task: 'Conducteur complet reçu et compris' },
      { task: 'Ordre des séquences, vidéos et slides connus' },
      { task: 'Versets et paroles prêts' },
      { task: 'Micros, caméras, plans caméra et retours scène vérifiés', scope: 'day' },
      { task: 'Son, éclairage, affichage et streaming testés', scope: 'day' },
      { task: 'Génériques et transitions disponibles' },
      { task: 'Connexion internet vérifiée et solution de secours opérationnelle', scope: 'day' },
      { task: 'Canal de communication scène – régie défini en cas de changement' },
    ],
  },
  {
    key: 'like-share',
    label: 'Séquence Like & Share',
    items: [
      { task: "Message bref préparé à l'avance" },
      { task: 'Durée précisément définie' },
      { task: 'Plateformes officielles rappelées' },
      { task: 'Consigne simple pour le partage dans les groupes WhatsApp' },
      { task: 'Visuel ou support vidéo prêt' },
      { task: 'Coordination avec la régie' },
      { task: "Indicateur simple pour mesurer l'impact" },
    ],
  },
  {
    key: 'annonces',
    label: 'Annonces et supports',
    items: [
      { task: 'Liste des informations indispensables arrêtée' },
      { task: 'Ordre et durée des annonces définis' },
      { task: 'Personne chargée de préparer les informations identifiée' },
      { task: 'Circuit de validation connu' },
      { task: 'Visuels et vidéos prêts' },
      { task: 'Cohérence entre le message annoncé et le support projeté' },
      { task: 'Transmission des supports à la régie dans les délais' },
    ],
  },
  {
    key: 'culte-celebration',
    label: 'Pendant le culte : louange',
    items: [
      { task: 'Choix et ordre des chants validés' },
      { task: 'Durée maîtrisée' },
      { task: 'Enchaînements et transitions fluides' },
      { task: 'Qualité musicale et sonorisation' },
      { task: 'Coordination entre la scène et la régie' },
      { task: 'Projection correcte des paroles' },
      { task: 'Gestion fiable des micros' },
      { task: "Atmosphère spirituelle propice à l'adoration" },
    ],
  },
];
