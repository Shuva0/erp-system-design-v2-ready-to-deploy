import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import TaskTimer from '../../components/timer/TaskTimer';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    return Promise.all([
      axiosClient.get('/tasks', { params: { assignedTo: 'me' } }),
      axiosClient.get('/timelogs/me/summary'),
    ]).then(([tasksRes, summaryRes]) => {
      setTasks(tasksRes.data.tasks);
      setSummary(summaryRes.data.summary);
    });
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  // Re-fetch tasks + hour summary whenever a task is marked complete, so the
  // stats cards and the task's "Completed" badge reflect reality immediately.
  function handleTaskCompleted() {
    loadData();
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-gray-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}</h1>
          <p className="text-gray-500">Here's what's on your plate today.</p>
        </div>

        {/* Weekly summary cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <SummaryCard label="This Week's Hours" value={`${summary?.totalHours || 0} hrs`} />
          <SummaryCard label="Active Tasks" value={tasks.filter((t) => t.status !== 'completed').length} />
          <SummaryCard label="Completed Tasks" value={tasks.filter((t) => t.status === 'completed').length} />
        </div>

        {/* Task list with timers */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">My Tasks</h2>
          <div className="space-y-3">
            {tasks.length === 0 && <p className="text-gray-400">No tasks assigned yet.</p>}
            {tasks.map((task) => (
              <TaskTimer key={task._id} task={task} onCompleted={handleTaskCompleted} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
