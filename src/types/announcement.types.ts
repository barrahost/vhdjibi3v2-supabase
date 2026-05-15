export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AnnouncementLog {
  id: string;
  announcementId: string;
  action: 'create' | 'update' | 'toggle';
  previousContent?: string;
  newContent?: string;
  previousStatus?: boolean;
  newStatus?: boolean;
  timestamp: Date;
  userId: string;
  userFullName: string;
}