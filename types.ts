
export enum AppView {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  CONNECTION = 'CONNECTION',
  MESSAGES = 'MESSAGES',
  CAMPAIGNS = 'CAMPAIGNS',
  SETTINGS = 'SETTINGS',
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  companyName: string;
  avatarUrl?: string;
}

export interface MessageTemplate {
  id: string;
  _id?: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType: 'none' | 'image' | 'video';
  category: string;
  lastModified: string;
}

export interface Contact {
  phone: string;
  name?: string;
}

export interface ContactList {
  id: string;
  _id?: string;
  name: string;
  contacts: Contact[];
  count?: number; // Virtual property for UI
  lastUpdated?: string; // Virtual property for UI
  createdAt?: string;
}

export interface WhatsappGroup {
  id: string;
  _id?: string;
  name: string;
  participants: number;
  image?: string;
}

export interface Campaign {
  id: string;
  _id?: string;
  name: string;
  status: 'scheduled' | 'running' | 'completed' | 'draft' | 'failed';
  templateId?: string;
  messageContent?: string;
  targetType: 'list' | 'group';
  targetName?: string; 
  targetId?: string; 
  targetCount?: number;
  schedules: string[]; 
  
  // Metrics
  sentCount?: number;
  deliveredCount?: number;
  readCount?: number;
  failedCount?: number;
  
  createdAt?: string;
}

export interface DashboardStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  recentActivity: Campaign[];
  chartData: { name: string; sent: number; failed: number }[];
}

export interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}
