export interface AudioTeaching {
  id: string;
  title: string;
  description: string;
  speaker: string;
  category: string;
  tags: string[];
  duration: number;
  file_url: string;
  thumbnail_url?: string;
  featured: boolean;
  date: Date;
  theme?: string;
  playlist?: string;
  plays?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'active' | 'inactive' | 'deleted';
}

export interface AudioFormData {
  title: string;
  description: string;
  speaker: string;
  category: string;
  tags: string[];
  date: string;
  file: File | null;
  thumbnail: File | null;
  featured: boolean;
  theme?: string;
  playlist?: string;
}

export const AUDIO_CATEGORIES = [
  'Culte',
  'Prière',
  'Formation',
  'Témoignage',
  'Conférence',
  'Séminaire'
] as const;

export const AUDIO_PLAYLISTS = [
  'Enseignements récents',
  'Fondements de la foi',
  'Croissance spirituelle',
  'Leadership',
  'Vie chrétienne'
] as const;