export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Commitment {
  id: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed' | 'overdue';
  source: 'email' | 'meeting' | 'manual';
  relatedEntity?: string;
  fulfillmentProbability?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  completed: boolean;
  context?: string;
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  channel: 'email' | 'sms' | 'chat';
  requiresReply: boolean;
  suggestedReply?: string;
}

export interface FinancialInsight {
  id: string;
  type: 'spending' | 'income' | 'forecast' | 'alert';
  title: string;
  description: string;
  amount?: number;
  trend?: 'up' | 'down';
  recommendation?: string;
}

export interface LifeEvent {
  id: string;
  type: 'meeting' | 'call' | 'deadline' | 'birthday' | 'renewal' | 'appointment';
  title: string;
  timestamp: Date;
  location?: string;
  participants?: string[];
  notes?: string;
}

export interface EnergyPattern {
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  energyLevel: number;
  focusQuality: number;
  recommendedTaskType: string;
}

export interface SmartFollowUp {
  id: string;
  contactId: string;
  contactName: string;
  topic: string;
  suggestedTime: Date;
  draftMessage: string;
  confidence: number;
}

export interface DecisionRecommendation {
  id: string;
  title: string;
  description: string;
  options: { label: string; pros: string[]; cons: string[] }[];
  recommendedOption?: string;
  personalImpact: string;
}

export interface DailyBriefing {
  date: Date;
  summary: string;
  topPriorities: Task[];
  upcomingEvents: LifeEvent[];
  pendingCommitments: Commitment[];
  financialSnapshot?: FinancialInsight;
  energyInsights?: EnergyPattern[];
}
