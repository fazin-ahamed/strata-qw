'use client';

import { useDashboard } from '@/lib/hooks';
import { DecisionCard } from '@/components/DecisionCard';
import { DashboardMetric } from '@/types';

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-gray-600 text-sm font-medium">{metric.label}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold">{metric.value}</span>
        {metric.change !== 0 && (
          <span className={`text-sm ${trendColors[metric.trend]}`}>
            {trendIcons[metric.trend]} {Math.abs(metric.change)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    metrics,
    decisions,
    anomalies,
    notifications,
    loading,
    error,
    acceptDecision,
    rejectDecision,
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Business Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            ⚠️ {anomalies.length} Anomal{anomalies.length === 1 ? 'y' : 'ies'} Detected
          </h2>
          <div className="space-y-2">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="flex justify-between items-center bg-white p-3 rounded">
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                    anomaly.severity === 'critical' ? 'bg-red-600 text-white' :
                    anomaly.severity === 'warning' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {anomaly.severity.toUpperCase()}
                  </span>
                  <span className="font-medium">{anomaly.description}</span>
                </div>
                <button
                  onClick={() => {}}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  Investigate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Decisions */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Pending Decisions</h2>
        {decisions.length === 0 ? (
          <div className="bg-green-50 p-6 rounded-lg text-green-800">
            ✓ No pending decisions. You're all caught up!
          </div>
        ) : (
          <div>
            {decisions.map((decision) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                onAccept={acceptDecision}
                onReject={rejectDecision}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Notifications</h2>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  notification.read ? 'bg-gray-50' : 'bg-white border-blue-300'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-gray-600 text-sm">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
