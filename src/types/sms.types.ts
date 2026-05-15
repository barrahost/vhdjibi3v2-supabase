export interface SMSTemplate {
  id: string;
  title: string;
  content: string;
  status: 'active' | 'inactive';
  category?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SMSRecipient {
  id: string;
  fullName: string;
  nickname?: string;
  phone: string;
}

export interface SMSMessage {
  recipients: SMSRecipient[];
  message: string;
  templateId?: string;
}

export interface SMSVariable {
  key: string;
  label: string;
  example: string;
}

export const SMS_VARIABLES: SMSVariable[] = [
  { key: '[nom]', label: 'Nom complet de l\'âme', example: 'Jean Kouassi' },
  { key: '[surnom]', label: 'Surnom (ou nom si pas de surnom)', example: 'Jean' }
];

export const SMS_CATEGORIES = [
  'Bienvenue',
  'Culte',
  'Évangélisation',
  'Anniversaire',
  'Suivi',
  'Autre'
] as const;