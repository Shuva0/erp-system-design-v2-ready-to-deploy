import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getUsers } from '../../api/users.api';
import { getUserActivity, getUserActivityPdf } from '../../api/reports.api';
import DashboardLayout from '../../components/layout/DashboardLayout';

/**
 * Admin/Manager activity report. Pick a user, optionally filter by a date
 * range (day / month / custom). With no filter, ALL data is shown. Includes
 * tasks completed, time taken per task, pause/resume counts, and detailed
 * activity timestamps — plus a one-click PDF export of the same view.
 */
export default function UserActivityReport() {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    getUsers()
      .then((res) => setUsers(res.data.users))
      .catch(() => {});
  }, []);

  // When arriving from the Reports tab (?userId=...), preselect that user and
  // automatically load their all-time activity (no date filter).
  useEffect(() => {
    const presetUser = searchParams.get('userId');
    if (presetUser) {
      setUserId(presetUser);
      setFrom('');
      setTo('');
      loadReportFor(presetUser);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function loadReportFor(id) {
    setError('');
    setLoading(true);
    try {
      const res = await getUserActivity({ userId: id });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the report.');
    } finally {
      setLoading(false);
    }
  }

  function buildParams() {
    const params = { userId };
    if (from) params.from = from;
    if (to) params.to = to;
    return params;
  }

  async function loadReport() {
    if (!userId) {
      setError('Please select a user first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await getUserActivity(buildParams());
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the report.');
    } finally {
      setLoading(false);
    }
  }

  // Quick presets
  function applyPreset(preset) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (preset === 'today') {
      setFrom(fmt(now));
      setTo(fmt(now));
    } else if (preset === 'month') {
      setFrom(fmt(new Date(now.getFullYear(), now.getMonth(), 1)));
      setTo(fmt(now));
    } else if (preset === 'all') {
      setFrom('');
      setTo('');
    }
  }

  async function downloadPdf() {
    if (!userId) {
      setError('Please select a user first.');
      return;
    }
    try {
      const res = await getUserActivityPdf(buildParams());
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user-activity-report.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate the PDF.');
    }
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function fmtDuration(sec) {
    const s = Math.max(0, Math.round(sec || 0));
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${ss}`;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Activity Report</h1>
          <p className="text-gray-500">
            Filter a team member's activity and export it as a PDF. Leave dates empty to include all data.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select a team member...</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => applyPreset('today')} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">Today</button>
            <button onClick={() => applyPreset('month')} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">This Month</button>
            <button onClick={() => applyPreset('all')} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">All Time</button>
            <div className="flex-1" />
            <button onClick={loadReport} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              {loading ? 'Loading...' : 'View Report'}
            </button>
            <button onClick={downloadPdf} className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              Download PDF
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {data && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total Hours" value={`${data.activity.totals.totalHours} hrs`} />
              <StatCard label="Tasks Completed" value={data.activity.totals.completedCount} />
              <StatCard label="Pause Actions" value={data.activity.totals.pauseCount} />
              <StatCard label="Resume Actions" value={data.activity.totals.resumeCount} />
            </div>

            {/* Per-task time */}
            <Section title="Time Taken Per Task">
              {data.activity.tasks.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">No task activity in this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Pauses</th>
                      <th className="px-4 py-3">Resumes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.activity.tasks.map((t) => (
                      <tr key={t.taskId}>
                        <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                        <td className="px-4 py-3 text-gray-600">{t.status.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-gray-700">{t.totalHours} hrs</td>
                        <td className="px-4 py-3 text-gray-700">{t.pauseCount}</td>
                        <td className="px-4 py-3 text-gray-700">{t.resumeCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>

            {/* Detailed activity */}
            <Section title="Detailed Activity Timestamps">
              {data.activity.sessions.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">No sessions recorded in this period.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {data.activity.sessions.map((s, i) => (
                    <div key={i} className="p-4">
                      <p className="font-medium text-gray-900">
                        {s.taskTitle}{' '}
                        <span className="font-mono text-sm text-indigo-600">{fmtDuration(s.durationSeconds)}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Start: {fmtDate(s.startTime)} · End: {fmtDate(s.endTime)} · {s.status}
                      </p>
                      {s.pauseEvents.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {s.pauseEvents.map((e, j) => (
                            <li key={j} className="text-xs text-gray-600">
                              <span className={e.type === 'pause' ? 'text-amber-600' : 'text-indigo-600'}>
                                {e.type.toUpperCase()}
                              </span>{' '}
                              at {fmtDate(e.at)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">{children}</div>
    </div>
  );
}
