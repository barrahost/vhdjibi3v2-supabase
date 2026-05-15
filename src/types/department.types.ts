import { Timestamp } from 'firebase/firestore';

export interface Department {
  id: string;
  name: string;
  description: string;
  leader: string;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'inactive';
}

export interface ServiceFamily {
  id: string;
  name: string;
  description: string;
  leader: string;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'inactive';
}