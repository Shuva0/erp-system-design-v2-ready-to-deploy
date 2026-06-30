import { useState, useEffect } from 'react';
import { getTasks, createTask, deleteTask } from '../../api/tasks.api';
import { getUsers } from '../../api/users.api';
import { getServices } from '../../api/services.api';
import DashboardLayout from '../../components/layout/DashboardLayout';

/**
 * Admin/Manager task board: create a task, assign it to any employee or
 * manager, and see the full list with live status. Per the workflow rules,
 * there's no "pause" concept here either — tasks move from pending to
 * in_progress (when the employee starts their timer) to completed (when the
 * employee marks it done), and that's it.
 */
export default function ManageTasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    service: '',
    assignedTo: '',
    priority: 'medium',
    deadline: '',
  });

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([getTasks(), getUsers(), getServices()])
      .then(([tasksRes, usersRes, servicesRes]) => {
        setTasks(tasksRes.data.tasks);
        setUsers(usersRes.data.users);
        setServices(servicesRes.data.services);
      })
      .finally(() => setLoading(false));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createTask(form);
      setForm({ title: '', description: '', service: '', assignedTo: '', priority: 'medium', deadline: '' });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    await deleteTask(id);
    loadAll();
  }

  const statusStyles = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-green-50 text-green-700',
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500">Create and assign work to any team member, in any department.</p>
        </div>

        {/* Create task form */}
        <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task title"
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <select
              name="assignedTo"
              value={form.assignedTo}
              onChange={handleChange}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Assign to...</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Department...</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <input
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={handleChange}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Assign Task
          </button>
        </form>

        {/* Task list */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No tasks created yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                    <td className="px-4 py-3 text-gray-600">{t.assignedTo?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{t.service?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyles[t.status]}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-gray-600">
                      {t.employeeNote ? (
                        <div>
                          <p className="whitespace-pre-wrap break-words">{t.employeeNote}</p>
                          {t.noteUpdatedAt && (
                            <p className="mt-1 text-xs text-gray-400">
                              Updated {new Date(t.noteUpdatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(t._id)} className="text-red-500 hover:text-red-700">
                        Delete
                      </button>
                    </td>
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
