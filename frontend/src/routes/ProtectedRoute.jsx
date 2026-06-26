import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Blocks access entirely if not logged in.
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// Blocks access if logged in but wrong role.
// Usage: <RoleRoute allowedRoles={['admin', 'manager']}><AdminDashboard /></RoleRoute>
export function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return children;
}
