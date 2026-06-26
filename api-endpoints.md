# API Endpoints

Base URL: `/api/v1`

## Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /auth/register | Public | Create account (admin creates employees/managers; first admin via seed script) |
| POST | /auth/login | Public | Email/password login, returns JWT |
| GET | /auth/google | Public | Redirect to Google OAuth |
| GET | /auth/google/callback | Public | Google OAuth callback, returns JWT |
| GET | /auth/me | Authenticated | Get current logged-in user's profile |
| POST | /auth/logout | Authenticated | Clear refresh token (if using refresh tokens) |

## Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /users | Admin, Manager | List all users (managers see only their service) |
| GET | /users/:id | Admin, Manager, Self | Get one user |
| POST | /users | Admin | Create user (alternative to self-registration) |
| PATCH | /users/:id | Admin, Self (limited fields) | Update user |
| PATCH | /users/:id/role | Admin | Change role |
| DELETE | /users/:id | Admin | Deactivate user (soft delete) |

## Services
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /services | Authenticated | List all active services |
| POST | /services | Admin | Create a service |
| PATCH | /services/:id | Admin | Edit a service |
| DELETE | /services/:id | Admin | Deactivate a service |

## Projects
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /projects | Admin, Manager, Employee (assigned only) | List projects |
| GET | /projects/:id | Admin, Manager, Employee (if assigned) | Get one project |
| POST | /projects | Admin, Manager | Create project |
| PATCH | /projects/:id | Admin, Manager | Update project |
| DELETE | /projects/:id | Admin | Delete project |

## Tasks
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /tasks | Admin, Manager, Employee (own only) | List tasks (filterable by project, service, status, user) |
| GET | /tasks/:id | Admin, Manager, Employee (if assigned) | Get one task |
| POST | /tasks | Admin, Manager | Create + assign task |
| PATCH | /tasks/:id | Admin, Manager, Employee (status field only) | Update task |
| DELETE | /tasks/:id | Admin, Manager | Delete task |

## Time Tracking
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /timelogs/start | Employee | Start a timer on a task (body: `taskId`) |
| POST | /timelogs/:id/stop | Employee (owner only) | Stop the running timer |
| GET | /timelogs/active | Employee | Get currently-running timer for logged-in user |
| GET | /timelogs | Admin, Manager, Employee (own) | List time logs, filterable by user/service/date range |
| GET | /timelogs/me/summary | Employee | Daily/weekly summary for self |

## Reports & Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | /reports/overview | Admin, Manager | Total hours per service, per user (date range filter) |
| GET | /reports/productivity | Admin, Manager | Time spent vs tasks completed, per user |
| GET | /reports/weekly | Admin, Manager | Weekly aggregate report |
| GET | /reports/project/:id | Admin, Manager | Output/hours for one project |

## Query Parameters (filtering pattern used across list endpoints)
```
GET /tasks?service=<id>&status=in_progress&user=<id>
GET /timelogs?user=<id>&service=<id>&from=2026-06-01&to=2026-06-30
GET /reports/overview?from=2026-06-01&to=2026-06-30&service=<id>
```
