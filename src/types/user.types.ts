// src/types/user.types.ts

import { Role } from './permission.types'; // garde si utile ailleurs
import { BusinessProfile } from './businessProfile.types';

export type UserRoles = 'admin' | 'shepherd' | 'adn' | 'intern';

export type UserType = UserRoles | null;

export interface UserCreateData {
  fullName: string;
  email: string;
  password: string;
  roles: UserRoles;
  phone?: string;
  photo?: File | null;
}

export interface User {
  id: string;
  uid: string;
  fullName: string;
  nickname?: string;
  email: string;
  role?: string; // Keep for backward compatibility
  roles?: UserRoles; // Keep for backward compatibility
  businessProfiles?: BusinessProfile[]; // New system
  activeProfiles?: BusinessProfile[]; // Currently active profiles
  additionalMenus?: string[]; // Keep for backward compatibility
  phone?: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  photoURL?: string | null;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  fromAdminsCollection?: boolean;
}
