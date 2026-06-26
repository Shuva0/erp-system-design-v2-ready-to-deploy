import { useState, useEffect } from 'react';
import { getOverview } from '../../api/reports.api';
import { getUsers } from '../../api/users.api';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getOverview(), getUsers()])
      .then(([overviewRes, usersRes]) => {
        setOverview(overviewRes.data.overview);
        setUserCount(usersRes.data.users.length);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-gray-500">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  const totalHoursThisWeek = overview?.byService?.reduce((sum, s) => sum + s.totalHours, 0) || 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
          <p className="text-gray-500">Last 7 days at a glance</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Hours (7d)" value={totalHoursThisWeek.toFixed(1)} />
          <StatCard label="Active Team Members" value={userCount} />
          <StatCard label="Departments Tracked" value={overview?.byService?.length || 0} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Hours by Service</h2>
          {overview?.byService?.length > 0 ? (
            <div className="space-y-3">
              {overview.byService.map((s) => {
                const max = Math.max(...overview.byService.map((x) => x.totalHours), 1);
                const widthPct = (s.totalHours / max) * 100;
                return (
                  <div key={s.serviceName}>
                    <div className="mb-1 flex justify-between text-xs text-gray-500">
                      <span>{s.serviceName}</span>
                      <span>{s.totalHours.toFixed(1)} hrs</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2.5 rounded-full bg-indigo-600"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No time logged yet this week.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Hours by Team Member</h2>
          {overview?.byUser?.length > 0 ? (
            <div className="space-y-2">
              {overview.byUser.map((u) => (
                <div key={u.userName} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{u.userName}</span>
                  <span className="font-medium text-gray-900">{u.totalHours.toFixed(1)} hrs</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No time logged yet this week.</p>
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
