import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';

import Home from './pages/home/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import UserTaskHistory from './pages/admin/UserTaskHistory';
import ManageServices from './pages/admin/ManageServices';
import ManageTasks from './pages/tasks/ManageTasks';
import ReportsPage from './pages/reports/ReportsPage';
import UserActivityReport from './pages/reports/UserActivityReport';

function Unauthorized() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access denied</h1>
        <p className="mt-2 text-gray-500">You don't have permission to view this page.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Employee */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin / Manager - shared views */}
          <Route
            path="/admin"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/tasks"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <ManageTasks />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <ManageServices />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <ReportsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <RoleRoute allowedRoles={['admin', 'manager']}>
                <UserActivityReport />
              </RoleRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <ManageUsers />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users/:id"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <UserTaskHistory />
              </RoleRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
