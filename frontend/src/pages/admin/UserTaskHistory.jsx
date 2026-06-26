import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserTaskHistory } from '../../api/users.api';
import DashboardLayout from '../../components/layout/DashboardLayout';

/**
 * Admin-only drill-down: every task ever assigned to this specific user,
 * with start date, end date, total time taken, and current status.
 * This is the "admin can preview every user's task list specifically" view.
 */
export default function UserTaskHistory() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUserTaskHistory(id)
      .then((res) => {
        setUser(res.data.user);
        setTaskHistory(res.data.taskHistory);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load this user.'))
      .finally(() => setLoading(false));
  }, [id]);

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  const statusStyles = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-green-50 text-green-700',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-gray-500">Loading...</div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-8 text-red-600">{error}</div>
      </DashboardLayout>
    );
  }

  const totalHours = taskHistory.reduce((sum, t) => sum + t.totalHours, 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <Link to="/admin/users" className="text-sm text-indigo-600 hover:underline">
            ← Back to Team Members
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-gray-500">
            {user.email} · {user.service?.name || 'No department'} · <span className="capitalize">{user.role}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Tasks" value={taskHistory.length} />
          <StatCard
            label="Completed"
            value={taskHistory.filter((t) => t.status === 'completed').length}
          />
          <StatCard label="Total Hours Logged" value={`${totalHours.toFixed(1)} hrs`} />
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {taskHistory.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No tasks recorded for this user yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Start Date</th>
                  <th className="px-4 py-3">End Date</th>
                  <th className="px-4 py-3">Total Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {taskHistory.map((t) => (
                  <tr key={t.taskId}>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[t.status]}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(t.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(t.endDate)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.totalHours.toFixed(2)} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
