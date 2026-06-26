import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = {
  admin: [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/tasks', label: 'Tasks' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/services', label: 'Departments' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  manager: [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/tasks', label: 'Tasks' },
    { to: '/admin/services', label: 'Departments' },
    { to: '/admin/reports', label: 'Reports' },
  ],
  employee: [{ to: '/dashboard', label: 'My Dashboard' }],
};

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = NAV_ITEMS[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 shrink-0 border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <Link to="/" className="font-bold text-gray-900 hover:text-indigo-600">
            ERP System
          </Link>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                location.pathname === item.to
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-56 border-t border-gray-200 p-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
