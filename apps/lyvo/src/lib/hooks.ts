'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DailyBriefing, Task, Commitment, Message, SmartFollowUp, FinancialInsight } from '@/types';

export function usePersonalDashboard() {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [inbox, setInbox] = useState<Message[]>([]);
  const [followUps, setFollowUps] = useState<SmartFollowUp[]>([]);
  const [financialInsights, setFinancialInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [briefingData, tasksData, commitmentsData, inboxData, followUpsData, financeData] = await Promise.all([
          api.getDailyBriefing(),
          api.getTasks({ completed: false }),
          api.getCommitments('pending'),
          api.getInbox({ requiresReply: true }),
          api.getSmartFollowUps(),
          api.getFinancialInsights(),
        ]);

        setBriefing(briefingData);
        setTasks(tasksData);
        setCommitments(commitmentsData);
        setInbox(inboxData);
        setFollowUps(followUpsData);
        setFinancialInsights(financeData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const completeTask = async (id: string) => {
    await api.completeTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const fulfillCommitment = async (id: string) => {
    await api.fulfillCommitment(id);
    setCommitments((prev) => prev.filter((c) => c.id !== id));
  };

  const sendReply = async (messageId: string, content: string) => {
    await api.sendReply(messageId, content);
    setInbox((prev) => prev.filter((m) => m.id !== messageId));
  };

  const sendFollowUp = async (id: string) => {
    await api.sendFollowUp(id);
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    briefing,
    tasks,
    commitments,
    inbox,
    followUps,
    financialInsights,
    loading,
    error,
    completeTask,
    fulfillCommitment,
    sendReply,
    sendFollowUp,
  };
}
