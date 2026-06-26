import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, updateUserRole, assignDepartment, deactivateUser } from '../../api/users.api';
import { getServices } from '../../api/services.api';
import DashboardLayout from '../../components/layout/DashboardLayout';

const ROLES = ['admin', 'manager', 'employee'];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLoading(true);
    Promise.all([getUsers(), getServices()])
      .then(([usersRes, servicesRes]) => {
        setUsers(usersRes.data.users);
        setServices(servicesRes.data.services);
      })
      .finally(() => setLoading(false));
  }

  async function handleRoleChange(id, role) {
    await updateUserRole(id, role);
    loadAll();
  }

  async function handleDepartmentChange(id, serviceId) {
    if (!serviceId) return;
    await assignDepartment(id, serviceId);
    loadAll();
  }

  async function handleDeactivate(id) {
    if (!confirm('Deactivate this user? They will no longer be able to log in.')) return;
    await deactivateUser(id);
    loadAll();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500">Manage roles, departments, and access. Only admins can deactivate accounts or reassign departments.</p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <p className="p-4 text-sm text-gray-400">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <Link to={`/admin/users/${u._id}`} className="hover:text-indigo-600 hover:underline">
                        {u.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.service?._id || ''}
                        onChange={(e) => handleDepartmentChange(u._id, e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeactivate(u._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Deactivate
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
