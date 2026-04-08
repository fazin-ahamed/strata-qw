'use client';

import { usePersonalDashboard } from '@/lib/hooks';
import { Commitment, Task, Message, SmartFollowUp } from '@/types';

function CommitmentCard({ commitment, onFulfill }: { commitment: Commitment; onFulfill: (id: string) => void }) {
  const statusColors = {
    pending: 'bg-yellow-100 border-yellow-500',
    completed: 'bg-green-100 border-green-500',
    overdue: 'bg-red-100 border-red-500',
  };

  return (
    <div className={`border-l-4 p-3 mb-2 rounded ${statusColors[commitment.status]}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{commitment.description}</p>
          <p className="text-sm text-gray-600 mt-1">
            Due: {new Date(commitment.dueDate).toLocaleDateString()}
            {commitment.fulfillmentProbability !== undefined && (
              <span className="ml-2">
                • Fulfillment probability: {(commitment.fulfillmentProbability * 100).toFixed(0)}%
              </span>
            )}
          </p>
        </div>
        {commitment.status === 'pending' && (
          <button
            onClick={() => onFulfill(commitment.id)}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            ✓ Fulfill
          </button>
        )}
      </div>
    </div>
  );
}

function TaskItem({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  };

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
      <button
        onClick={() => onComplete(task.id)}
        className="w-5 h-5 border-2 border-gray-300 rounded hover:border-green-500"
      />
      <div className="flex-1">
        <p className={task.completed ? 'line-through text-gray-500' : ''}>{task.title}</p>
        {task.dueDate && (
          <p className="text-xs text-gray-500">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
      <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
        {task.priority.toUpperCase()}
      </span>
    </div>
  );
}

function MessageCard({ message, onReply }: { message: Message; onReply: (id: string, content: string) => void }) {
  return (
    <div className="border p-3 rounded mb-2 bg-white">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-medium">{message.sender}</span>
          <span className="text-xs text-gray-500 ml-2">
            {new Date(message.timestamp).toLocaleString()}
          </span>
        </div>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {message.channel}
        </span>
      </div>
      <p className="text-gray-700 mb-2">{message.content}</p>
      {message.suggestedReply && (
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <p className="text-xs text-gray-500 mb-1">Suggested reply:</p>
          <p className="text-sm italic">{message.suggestedReply}</p>
          <button
            onClick={() => onReply(message.id, message.suggestedReply!)}
            className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send Reply
          </button>
        </div>
      )}
    </div>
  );
}

function FollowUpCard({ followUp, onSend }: { followUp: SmartFollowUp; onSend: (id: string) => void }) {
  return (
    <div className="border p-3 rounded mb-2 bg-blue-50 border-blue-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">Follow up with {followUp.contactName}</p>
          <p className="text-sm text-gray-600 mt-1">{followUp.topic}</p>
          <p className="text-xs text-gray-500 mt-1">
            Suggested time: {new Date(followUp.suggestedTime).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Confidence: {(followUp.confidence * 100).toFixed(0)}%</p>
        </div>
        <button
          onClick={() => onSend(followUp.id)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
      <div className="mt-2 p-2 bg-white rounded">
        <p className="text-xs text-gray-500 mb-1">Draft:</p>
        <p className="text-sm">{followUp.draftMessage}</p>
      </div>
    </div>
  );
}

export default function PersonalDashboard() {
  const {
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
  } = usePersonalDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading your personal dashboard...</div>
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}!</h1>

      {/* Daily Briefing Summary */}
      {briefing && (
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
          <h2 className="text-xl font-semibold mb-2">Today's Briefing</h2>
          <p className="text-lg">{briefing.summary}</p>
          <div className="mt-4 flex gap-6">
            <div>
              <span className="text-2xl font-bold">{briefing.topPriorities.length}</span>
              <span className="ml-2">Priority Tasks</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{briefing.upcomingEvents.length}</span>
              <span className="ml-2">Events Today</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{briefing.pendingCommitments.length}</span>
              <span className="ml-2">Pending Commitments</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Commitments */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Commitments</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {commitments.length === 0 ? (
              <p className="text-green-600">✓ All commitments fulfilled!</p>
            ) : (
              commitments.map((commitment) => (
                <CommitmentCard
                  key={commitment.id}
                  commitment={commitment}
                  onFulfill={fulfillCommitment}
                />
              ))
            )}
          </div>
        </div>

        {/* Top Tasks */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Priority Tasks</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {tasks.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task} onComplete={completeTask} />
            ))}
            {tasks.length === 0 && <p className="text-gray-500">No pending tasks</p>}
          </div>
        </div>

        {/* Inbox Requiring Reply */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Needs Your Reply</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {inbox.slice(0, 3).map((message) => (
              <MessageCard key={message.id} message={message} onReply={sendReply} />
            ))}
            {inbox.length === 0 && <p className="text-green-600">✓ Inbox clear!</p>}
          </div>
        </div>

        {/* Smart Follow-ups */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Smart Follow-ups</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {followUps.slice(0, 3).map((followUp) => (
              <FollowUpCard key={followUp.id} followUp={followUp} onSend={sendFollowUp} />
            ))}
            {followUps.length === 0 && <p className="text-gray-500">No follow-ups suggested</p>}
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      {financialInsights.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Financial Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {financialInsights.map((insight) => (
              <div key={insight.id} className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">{insight.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                {insight.amount && (
                  <p className="text-lg font-bold mt-2">${insight.amount.toFixed(2)}</p>
                )}
                {insight.recommendation && (
                  <p className="text-sm text-blue-600 mt-2">💡 {insight.recommendation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
