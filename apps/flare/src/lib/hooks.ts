'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Decision, DashboardMetric, Anomaly, Notification } from '@/types';

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [metricsData, decisionsData, anomaliesData, notificationsData] = await Promise.all([
          api.getDashboardMetrics(),
          api.getDecisions({ status: 'pending' }),
          api.getAnomalies(),
          api.getNotifications(true),
        ]);

        setMetrics(metricsData);
        setDecisions(decisionsData);
        setAnomalies(anomaliesData);
        setNotifications(notificationsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const acceptDecision = async (id: string) => {
    await api.acceptDecision(id);
    setDecisions((prev) => prev.filter((d) => d.id !== id));
  };

  const rejectDecision = async (id: string) => {
    await api.rejectDecision(id);
    setDecisions((prev) => prev.filter((d) => d.id !== id));
  };

  const resolveAnomaly = async (id: string) => {
    await api.resolveAnomaly(id);
    setAnomalies((prev) => prev.filter((a) => a.id !== id));
  };

  const markNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return {
    metrics,
    decisions,
    anomalies,
    notifications,
    loading,
    error,
    acceptDecision,
    rejectDecision,
    resolveAnomaly,
    markNotificationRead,
  };
}
