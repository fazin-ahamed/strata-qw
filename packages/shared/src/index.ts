# Shared types and utilities for Strata platform

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Entity {
  id: string;
  type: 'person' | 'business' | 'account' | 'organization';
  name: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  entityId: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  source: string;
}

export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface Decision {
  id: string;
  userId: string;
  context: Record<string, unknown>;
  options: DecisionOption[];
  recommendation?: DecisionOption;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: Date;
  executedAt?: Date;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  tradeOffs: string[];
  confidence: number;
}

export interface Task {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
  transcript?: string;
  summary?: string;
  actionItems: ActionItem[];
  visualSnippets: VisualSnippet[];
  recordingUrl?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  completed: boolean;
}

export interface VisualSnippet {
  id: string;
  meetingId: string;
  imageUrl: string;
  caption?: string;
  timestamp: number;
  approved: boolean;
  createdAt: Date;
}

export interface Commitment {
  id: string;
  userId: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  source: string;
  createdAt: Date;
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: Date;
  merchant?: string;
}

export interface Insight {
  id: string;
  userId: string;
  type: 'anomaly' | 'prediction' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  data: Record<string, unknown>;
  createdAt: Date;
}

export type Domain = 'business' | 'personal';

export interface Context {
  domain: Domain;
  userId: string;
  currentActivity?: string;
  availability?: 'available' | 'busy' | 'away' | 'offline';
  location?: string;
  timeContext: {
    hour: number;
    dayOfWeek: number;
    isWorkday: boolean;
  };
}
