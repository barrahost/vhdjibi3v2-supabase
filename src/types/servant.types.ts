export type ServantSourceType = 'soul' | 'user' | 'manual';

export interface Servant {
  id: string;
  fullName: string;
  nickname?: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  departmentId: string;
  isHead: boolean;
  isShepherd?: boolean;
  shepherdId?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  // Lien vers la personne source
  sourceType?: ServantSourceType;
  sourceId?: string;
  // Rétro-compat (= sourceId quand sourceType === 'soul')
  originalSoulId?: string;
  promotionDate?: Date;
}

export interface ServantFormData {
  fullName: string;
  nickname?: string;
  gender: 'male' | 'female';
  phone: string;
  email: string;
  departmentId: string;
  isHead: boolean;
  isShepherd?: boolean;
  shepherdId?: string;
  status?: 'active' | 'inactive';
  sourceType?: ServantSourceType;
  sourceId?: string;
  originalSoulId?: string;
  promotionDate?: Date;
}