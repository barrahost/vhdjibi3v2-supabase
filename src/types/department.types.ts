export interface Department {
  id: string;
  name: string;
  description: string;
  leader: string;
  order: number;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  status: 'active' | 'inactive';
}

export interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader: string;
  order: number;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
  status: 'active' | 'inactive';
}
