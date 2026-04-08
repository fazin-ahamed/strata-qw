'use client';

import React, { useState } from 'react';

interface Commitment {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  source: 'email' | 'meeting' | 'manual';
}

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export function DailyBriefing() {
  const [date] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  const [commitments] = useState<Commitment[]>([
    { id: '1', title: 'Send Q4 report to board', dueDate: 'Today, 5 PM', status: 'pending', source: 'email' },
    { id: '2', title: 'Review hiring pipeline', dueDate: 'Today, 2 PM', status: 'pending', source: 'meeting' },
    { id: '3', title: 'Approve budget proposal', dueDate: 'Yesterday', status: 'overdue', source: 'email' },
  ]);

  const [tasks] = useState<Task[]>([
    { id: '1', title: 'Prepare presentation for investor meeting', priority: 'high', completed: false },
    { id: '2', title: 'Update project timeline in Jira', priority: 'medium', completed: false },
    { id: '3', title: 'Respond to customer feedback', priority: 'high', completed: true },
    { id: '4', title: 'Schedule team retrospective', priority: 'low', completed: false },
  ]);

  const [calendar] = useState([
    { time: '9:00 AM', title: 'Team Standup', duration: '30 min' },
    { time: '10:30 AM', title: 'Product Review', duration: '1 hr' },
    { time: '2:00 PM', title: 'Hiring Pipeline Review', duration: '45 min' },
    { time: '4:00 PM', title: 'Investor Call', duration: '1 hr' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Briefing</h1>
        <p className="text-gray-600">{date}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Meetings Today</p>
          <p className="text-2xl font-semibold text-gray-900">{calendar.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending Tasks</p>
          <p className="text-2xl font-semibold text-gray-900">
            {tasks.filter(t => !t.completed).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Commitments</p>
          <p className="text-2xl font-semibold text-gray-900">{commitments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-semibold text-red-600">
            {commitments.filter(c => c.status === 'overdue').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
          <div className="space-y-3">
            {calendar.map((event, idx) => (
              <div key={idx} className="flex items-start space-x-4 p-3 bg-gray-50 rounded">
                <div className="w-20 text-sm font-medium text-gray-700">{event.time}</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority Tasks</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center space-x-3 p-3 rounded border ${
                  task.completed ? 'bg-gray-50 opacity-60' : 'bg-white'
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  readOnly
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1">
                  <p className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    task.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commitments Tracking */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Commitments</h2>
        <div className="space-y-3">
          {commitments.map((commitment) => (
            <div
              key={commitment.id}
              className={`flex items-center justify-between p-4 rounded border ${
                commitment.status === 'overdue'
                  ? 'bg-red-50 border-red-200'
                  : commitment.status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    commitment.status === 'overdue'
                      ? 'bg-red-500'
                      : commitment.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  }`}
                />
                <div>
                  <p className="font-medium text-gray-900">{commitment.title}</p>
                  <p className="text-sm text-gray-600">
                    Due: {commitment.dueDate} • From: {commitment.source}
                  </p>
                </div>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {commitment.status === 'overdue' ? 'Mark Complete' : 'Update'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Insights</h2>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600">💡</span>
            <p className="text-sm text-gray-700">
              You have 3 high-priority tasks but only 2 hours of focused time available. 
              Consider delegating "Update project timeline" or rescheduling the 2 PM meeting.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-600">📊</span>
            <p className="text-sm text-gray-700">
              Based on your calendar patterns, you're most productive between 9-11 AM. 
              Your deep work block is currently underutilized this week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
