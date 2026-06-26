# Database Schema — MongoDB Collections

## 1. users
```js
{
  _id: ObjectId,
  name: String,
  email: String,              // unique, indexed
  password: String,           // hashed with bcrypt, null if Google-only
  googleId: String,           // null if email/password user
  authProvider: String,       // "local" | "google"
  role: String,                // "admin" | "manager" | "employee"
  service: ObjectId,          // ref -> services collection
  isActive: Boolean,           // default true; soft-disable instead of deleting
  avatarUrl: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 2. services  (Design, Motion Graphics, Development, Marketing...)
```js
{
  _id: ObjectId,
  name: String,                // unique, e.g. "Motion Graphics"
  description: String,
  isActive: Boolean,
  createdBy: ObjectId,         // ref -> users
  createdAt: Date,
  updatedAt: Date
}
```

## 3. projects
```js
{
  _id: ObjectId,
  name: String,
  client: String,              // simple string for now; could be its own collection later
  service: ObjectId,           // ref -> services
  manager: ObjectId,           // ref -> users
  status: String,               // "active" | "on_hold" | "completed"
  startDate: Date,
  deadline: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 4. tasks
```js
{
  _id: ObjectId,
  title: String,
  description: String,
  project: ObjectId,           // ref -> projects
  service: ObjectId,           // ref -> services (usually same as project's, but allows cross-service tasks)
  assignedTo: ObjectId,        // ref -> users
  assignedBy: ObjectId,        // ref -> users (manager/admin)
  priority: String,             // "low" | "medium" | "high"
  status: String,                // "pending" | "in_progress" | "completed"
  deadline: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 5. timelogs   (the core of the time-tracking system)
```js
{
  _id: ObjectId,
  task: ObjectId,               // ref -> tasks
  user: ObjectId,                // ref -> users
  service: ObjectId,             // denormalized copy from task, for fast reporting queries
  startTime: Date,
  endTime: Date,                 // null while timer is running
  durationSeconds: Number,       // calculated on stop; null while running
  note: String,                  // optional "what I worked on" note
  createdAt: Date
}
```

**Why denormalize `service` onto timelogs?** Reports constantly ask "total hours per service this week." Without the copy, every report query needs a join (`$lookup`) through tasks → projects → services. With it, you aggregate directly on timelogs. This is a deliberate MongoDB modeling choice — duplicate a little data to avoid expensive joins on your hottest query path.

## Relationships Summary
```
users ──belongs to──> services
users ──manages──────> projects (if role=manager)
projects ──belongs to──> services
tasks ──belongs to──> projects
tasks ──assigned to──> users
timelogs ──belongs to──> tasks AND users
```

## Indexes to create (important for performance as data grows)
```js
db.users.createIndex({ email: 1 }, { unique: true })
db.timelogs.createIndex({ user: 1, startTime: -1 })
db.timelogs.createIndex({ service: 1, startTime: -1 })
db.timelogs.createIndex({ task: 1 })
db.tasks.createIndex({ assignedTo: 1, status: 1 })
db.tasks.createIndex({ project: 1 })
```
