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
  // Decisions
  getDecisions: (filters?: { priority?: string; status?: string }) =>
    fetchApi<any>('/decisions', {
      method: 'GET',
      query: filters ? new URLSearchParams(filters as any).toString() : undefined,
    }),

  acceptDecision: (id: string) =>
    fetchApi<any>(`/decisions/${id}/accept`, { method: 'POST' }),

  rejectDecision: (id: string) =>
    fetchApi<any>(`/decisions/${id}/reject`, { method: 'POST' }),

  executeDecision: (id: string) =>
    fetchApi<any>(`/decisions/${id}/execute`, { method: 'POST' }),

  // Entities
  getEntities: (type?: string) =>
    fetchApi<any>(`/entities${type ? `?type=${type}` : ''}`),

  getEntity: (id: string) => fetchApi<any>(`/entities/${id}`),

  searchEntities: (query: string) =>
    fetchApi<any>(`/entities/search?q=${encodeURIComponent(query)}`),

  // Events
  getEvents: (filters?: { type?: string; entityId?: string; limit?: number }) =>
    fetchApi<any>('/events', {
      method: 'GET',
      query: filters ? new URLSearchParams(filters as any).toString() : undefined,
    }),

  // Meetings
  getMeetings: (filters?: { upcoming?: boolean; past?: boolean }) =>
    fetchApi<any>('/meetings', {
      method: 'GET',
      query: filters ? new URLSearchParams(filters as any).toString() : undefined,
    }),

  getMeeting: (id: string) => fetchApi<any>(`/meetings/${id}`),

  approveVisualSnippet: (meetingId: string, snippetId: string) =>
    fetchApi<any>(`/meetings/${meetingId}/visuals/${snippetId}/approve`, {
      method: 'POST',
    }),

  rejectVisualSnippet: (meetingId: string, snippetId: string) =>
    fetchApi<any>(`/meetings/${meetingId}/visuals/${snippetId}/reject`, {
      method: 'POST',
    }),

  // Predictions & Anomalies
  getPredictions: (type?: string) =>
    fetchApi<any>(`/predictions${type ? `?type=${type}` : ''}`),

  getAnomalies: (severity?: string) =>
    fetchApi<any>(`/anomalies${severity ? `?severity=${severity}` : ''}`),

  resolveAnomaly: (id: string) =>
    fetchApi<any>(`/anomalies/${id}/resolve`, { method: 'POST' }),

  // Dashboard
  getDashboardMetrics: () => fetchApi<any>('/dashboard/metrics'),

  getBusinessTimeline: () => fetchApi<any>('/dashboard/timeline'),

  // Notifications
  getNotifications: (unreadOnly?: boolean) =>
    fetchApi<any>(`/notifications${unreadOnly ? '?unread=true' : ''}`),

  markNotificationRead: (id: string) =>
    fetchApi<any>(`/notifications/${id}/read`, { method: 'POST' }),

  // Actions
  queueAction: (action: { type: string; payload: any; requiresApproval?: boolean }) =>
    fetchApi<any>('/actions', {
      method: 'POST',
      body: JSON.stringify(action),
    }),

  getActionStatus: (taskId: string) =>
    fetchApi<any>(`/actions/${taskId}/status`),

  // Natural Language Query
  query: (question: string) =>
    fetchApi<any>('/query', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),
};
