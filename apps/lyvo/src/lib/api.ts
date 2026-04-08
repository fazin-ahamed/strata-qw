const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Daily Briefing
  getDailyBriefing: (date?: string) =>
    fetchApi<any>(`/briefing${date ? `?date=${date}` : ''}`),

  // Tasks
  getTasks: (filters?: { priority?: string; completed?: boolean }) =>
    fetchApi<any>('/tasks', {
      method: 'GET',
      query: filters ? new URLSearchParams(filters as any).toString() : undefined,
    }),

  completeTask: (id: string) =>
    fetchApi<any>(`/tasks/${id}/complete`, { method: 'POST' }),

  addTask: (task: { title: string; priority: string; dueDate?: string }) =>
    fetchApi<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  // Commitments
  getCommitments: (status?: string) =>
    fetchApi<any>(`/commitments${status ? `?status=${status}` : ''}`),

  fulfillCommitment: (id: string) =>
    fetchApi<any>(`/commitments/${id}/fulfill`, { method: 'POST' }),

  // Messages & Inbox
  getInbox: (filters?: { requiresReply?: boolean; channel?: string }) =>
    fetchApi<any>('/inbox', {
      method: 'GET',
      query: filters ? new URLSearchParams(filters as any).toString() : undefined,
    }),

  sendReply: (messageId: string, content: string) =>
    fetchApi<any>(`/inbox/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getSuggestedReplies: (messageId: string) =>
    fetchApi<any>(`/inbox/${messageId}/suggestions`),

  // Life Events Timeline
  getLifeTimeline: (range?: { start?: string; end?: string }) =>
    fetchApi<any>('/timeline', {
      method: 'GET',
      query: range ? new URLSearchParams(range as any).toString() : undefined,
    }),

  // Smart Follow-ups
  getSmartFollowUps: () => fetchApi<any>('/followups'),

  sendFollowUp: (followUpId: string) =>
    fetchApi<any>(`/followups/${followUpId}/send`, { method: 'POST' }),

  // Financial Intelligence
  getFinancialInsights: () => fetchApi<any>('/finance/insights'),

  getSpendingForecast: () => fetchApi<any>('/finance/forecast'),

  // Energy & Focus
  getEnergyPatterns: () => fetchApi<any>('/energy/patterns'),

  // Personal Decisions
  getDecisionRecommendations: () => fetchApi<any>('/decisions/personal'),

  acceptDecision: (id: string) =>
    fetchApi<any>(`/decisions/personal/${id}/accept`, { method: 'POST' }),

  // Life Automation
  scheduleReminder: (reminder: {
    content: string;
    scheduledTime: string;
    context?: any;
  }) =>
    fetchApi<any>('/automation/reminders', {
      method: 'POST',
      body: JSON.stringify(reminder),
    }),

  trackRenewal: (renewal: {
    name: string;
    dueDate: string;
    amount?: number;
    category: string;
  }) =>
    fetchApi<any>('/automation/renewals', {
      method: 'POST',
      body: JSON.stringify(renewal),
    }),

  // Natural Language Query
  query: (question: string) =>
    fetchApi<any>('/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
