'use client';

import React, { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export function MetricCard({ title, value, change, trend }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-semibold text-gray-900">{value}</p>
        <span className={`text-sm font-medium ${trendColor}`}>
          {trendIcon} {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}

export function ExecutiveDashboard() {
  const [metrics] = useState({
    revenue: { value: '$2.4M', change: 12.5, trend: 'up' as const },
    churn: { value: '2.1%', change: -0.3, trend: 'up' as const },
    burnRate: { value: '$180K', change: 5.2, trend: 'down' as const },
    activeUsers: { value: '8,432', change: 18.7, trend: 'up' as const },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
        <p className="text-gray-600">Real-time business intelligence and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Revenue"
          value={metrics.revenue.value}
          change={metrics.revenue.change}
          trend={metrics.revenue.trend}
        />
        <MetricCard
          title="Churn Rate"
          value={metrics.churn.value}
          change={metrics.churn.change}
          trend={metrics.churn.trend}
        />
        <MetricCard
          title="Burn Rate"
          value={metrics.burnRate.value}
          change={metrics.burnRate.change}
          trend={metrics.burnRate.trend}
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers.value}
          change={metrics.activeUsers.change}
          trend={metrics.activeUsers.trend}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart placeholder - integrate with charting library</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Detection</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded">
              <span className="text-yellow-600">⚠️</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Unusual spike in support tickets</p>
                <p className="text-xs text-gray-600">Detected 2 hours ago - 45% above normal</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded">
              <span className="text-blue-600">ℹ️</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Customer acquisition cost decreased</p>
                <p className="text-xs text-gray-600">Positive trend - 12% reduction this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
