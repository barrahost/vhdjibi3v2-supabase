export interface AttendanceRecord {
  id: string;
  soulId: string;
  shepherdId: string;
  date: Date;
  present: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Soul {
  id: string;
  fullName: string;
  [key: string]: any;
}