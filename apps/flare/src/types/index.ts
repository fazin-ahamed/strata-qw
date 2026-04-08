export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  tenantId: string;
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'recommendation' | 'alert' | 'insight';
  tradeOffs: { option: string; pros: string[]; cons: string[] }[];
  confidence: number;
  entityId?: string;
  entityType?: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'executed';
}

export interface Entity {
  id: string;
  type: 'person' | 'business' | 'account' | 'deal' | 'project';
  name: string;
  metadata: Record<string, any>;
  embeddings?: number[];
  relationships: Relationship[];
  events: Event[];
}

export interface Relationship {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: string;
  strength: number;
  metadata?: Record<string, any>;
}

export interface Event {
  id: string;
  type: 'email' | 'meeting' | 'transaction' | 'task' | 'decision';
  timestamp: Date;
  entityId?: string;
  summary: string;
  metadata: Record<string, any>;
  actionItems?: ActionItem[];
  decisions?: Decision[];
  visualContext?: VisualSnippet[];
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  eventId?: string;
}

export interface VisualSnippet {
  id: string;
  url: string;
  caption: string;
  timestamp: number;
  approved: boolean;
  meetingId?: string;
}

export interface Prediction {
  id: string;
  type: 'commitment_fulfillment' | 'churn_risk' | 'cash_flow' | 'anomaly';
  entityId: string;
  value: number;
  confidence: number;
  factors: string[];
  recommendedActions: string[];
  createdAt: Date;
}

export interface Anomaly {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  entityId?: string;
  detectedAt: Date;
  resolved: boolean;
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
  decisions: Decision[];
  visualSnippets: VisualSnippet[];
  recordingUrl?: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  visualization: 'number' | 'chart' | 'gauge';
}

export interface Notification {
  id: string;
  type: 'decision' | 'alert' | 'reminder' | 'update';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}
