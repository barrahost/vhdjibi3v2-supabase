## Modifications demandées

### 1. Supprimer la question « L'âme rejoindra-t-elle une église VH ? »
- Retirer le champ `willJoinVHChurch` de :
  - `src/types/evangelized.types.ts` (interface + type `WillJoinVHChurch`)
  - `src/components/evangelizedSouls/EvangelizedSoulForm.tsx` (state, UI radios, addDoc)
  - `src/components/evangelizedSouls/EditEvangelizedSoulModal.tsx` (state, UI radios, updateDoc)
  - `src/components/evangelizedSouls/DownloadTemplateButton.tsx` (colonne « Rejoindra une église VH »)
  - `src/components/evangelizedSouls/ImportEvangelizedSoulsFromExcel.tsx` (mapping + parser yes/no)
  - `src/pages/EvangelizedSoulManagement.tsx` (badge éventuel + colonne export Excel)

### 2. Mettre à jour les options de culte
Remplacer `PLANNED_SERVICE_OPTIONS` dans `src/types/evangelized.types.ts` :

```ts
export type PlannedService =
  | 'wednesday_evening'
  | 'sunday_first'
  | 'sunday_second'
  | 'undecided';

export const PLANNED_SERVICE_OPTIONS = [
  { value: 'wednesday_evening', label: 'Culte du Mercredi Soir - 19h' },
  { value: 'sunday_first',      label: '1er Culte du Dimanche - 7h' },
  { value: 'sunday_second',     label: '2e Culte du Dimanche - 10h' },
  { value: 'undecided',         label: 'Pas encore décidé' },
];
```

Note : les anciennes valeurs `friday_evening`, `sunday_morning`, `sunday_evening` sont supprimées. Les documents existants en Firestore qui les contiennent afficheront un libellé vide (acceptable, hors scope migration). `wednesday_evening` et `undecided` restent compatibles.

### 3. Cohérence du fichier d'import Excel
- `DownloadTemplateButton.tsx` :
  - Retirer la colonne « Rejoindra une église VH » (passe de 14 → 13 colonnes)
  - Mettre à jour l'en-tête « Culte envisagé » avec les nouveaux libellés exacts : `Culte du Mercredi Soir - 19h / 1er Culte du Dimanche - 7h / 2e Culte du Dimanche - 10h / Pas encore décidé`
  - Adapter la ligne d'exemple et les largeurs de colonnes
- `ImportEvangelizedSoulsFromExcel.tsx` :
  - Retirer le parser et la colonne `willJoinVHChurch`
  - Adapter le parser `plannedService` pour matcher (insensible casse + accents) les 4 nouveaux libellés ainsi que les codes directs (`wednesday_evening`, `sunday_first`, `sunday_second`, `undecided`). Tolérance sur quelques alias courts (« mercredi », « 1er dimanche » / « dimanche 7h », « 2e dimanche » / « dimanche 10h »).
  - Mettre à jour l'aperçu en conséquence
- `EvangelizedSoulManagement.tsx` : retirer la colonne « Rejoindra VH » de l'export Excel, badges mis à jour

### 4. Maintenance
- Bump version **1.7.79** dans `src/pages/Login.tsx` et `src/components/ui/Footer.tsx`
- Entrée `src/CHANGELOG.md` 1.7.79 : suppression question VH + nouveaux libellés cultes

## Hors scope
- Pas de migration des documents Firestore existants (les anciens codes culte resteront en base sans libellé)
- Pas de changement sur l'interface `Soul` ni sur le flux d'import vers `Soul`
