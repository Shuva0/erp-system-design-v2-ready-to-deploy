# Folder Structure

## Backend (Node.js + Express)
```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   ├── passport.js           # Google OAuth strategy setup
│   │   └── env.js                # centralized env variable access
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── TimeLog.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── service.controller.js
│   │   ├── project.controller.js
│   │   ├── task.controller.js
│   │   ├── timelog.controller.js
│   │   └── report.controller.js
│   ├── services/                  # business logic, separate from controllers
│   │   ├── auth.service.js
│   │   ├── timelog.service.js
│   │   └── report.service.js
│   ├── middleware/
│   │   ├── auth.middleware.js     # verifies JWT
│   │   ├── rbac.middleware.js     # checks role permissions
│   │   ├── error.middleware.js    # centralized error handler
│   │   └── validate.middleware.js # request body validation
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── service.routes.js
│   │   ├── project.routes.js
│   │   ├── task.routes.js
│   │   ├── timelog.routes.js
│   │   ├── report.routes.js
│   │   └── index.js               # combines all routes
│   ├── utils/
│   │   ├── ApiError.js             # custom error class
│   │   ├── asyncHandler.js         # wraps async controllers, catches errors
│   │   └── generateToken.js        # JWT signing helper
│   ├── app.js                      # Express app setup (middleware, routes)
│   └── server.js                   # entry point, starts the server
├── .env
├── .env.example
├── package.json
└── seed.js                         # script to create first admin user
```

## Frontend (React + Tailwind)
```
frontend/
├── src/
│   ├── api/
│   │   ├── axiosClient.js          # axios instance with JWT interceptor
│   │   ├── auth.api.js
│   │   ├── tasks.api.js
│   │   ├── timelogs.api.js
│   │   └── reports.api.js
│   ├── context/
│   │   └── AuthContext.jsx          # global auth state (Context API)
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Table.jsx
│   │   │   └── Loader.jsx
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── timer/
│   │   │   └── TaskTimer.jsx
│   │   └── tasks/
│   │       ├── TaskList.jsx
│   │       └── TaskCard.jsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── employee/
│   │   │   └── EmployeeDashboard.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageUsers.jsx
│   │   │   └── ManageServices.jsx
│   │   └── reports/
│   │       └── ReportsPage.jsx
│   ├── routes/
│   │   ├── ProtectedRoute.jsx       # redirects if not authenticated
│   │   └── RoleRoute.jsx            # redirects if wrong role
│   ├── hooks/
│   │   └── useAuth.js
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── .env
└── package.json
```

**Why this structure scales:** every new feature (e.g., "invoicing" later) gets its own model, controller, service, and routes file, following the same pattern. You never have to restructure — you just add files that match the existing shape.
