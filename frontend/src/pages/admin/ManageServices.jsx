import { useState, useEffect } from 'react';
import { getServices, createService, deleteService } from '../../api/services.api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function ManageServices() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  function loadServices() {
    getServices()
      .then((res) => setServices(res.data.services))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await createService({ name, description });
      setName('');
      setDescription('');
      loadServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this department? Existing projects/tasks will keep their history.')) return;
    await deleteService(id);
    loadServices();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services / Departments</h1>
          <p className="text-gray-500">
            Design, Motion Graphics, Development, Marketing, etc.
            {!isAdmin && ' Managers can create departments; only admins can delete them.'}
          </p>
        </div>

        <form onSubmit={handleCreate} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Service name (e.g. Motion Graphics)"
            required
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            Add
          </button>
        </form>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">Loading...</p>
          ) : services.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No services yet. Add your first one above.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {services.map((s) => (
                <li key={s._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    {s.description && <p className="text-sm text-gray-500">{s.description}</p>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
