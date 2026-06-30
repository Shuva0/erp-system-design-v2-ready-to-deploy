import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductivity } from '../../api/reports.api';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function ReportsPage() {
  const [productivity, setProductivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getProductivity()
      .then((res) => setProductivity(res.data.productivity))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productivity Report</h1>
          <p className="text-gray-500">Hours logged vs. tasks completed — last 7 days</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">Loading...</p>
          ) : productivity.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No activity recorded in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Hours Logged</th>
                  <th className="px-4 py-3">Tasks Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productivity.map((p) => (
                  <tr key={p.userId}>
                    <td className="px-4 py-3 font-medium">
                      <button
                        onClick={() => navigate(`/admin/activity?userId=${p.userId}`)}
                        className="text-indigo-600 hover:underline"
                        title="View all-time activity"
                      >
                        {p.userName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.totalHours} hrs</td>
                    <td className="px-4 py-3 text-gray-700">{p.completedTasks}</td>
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
