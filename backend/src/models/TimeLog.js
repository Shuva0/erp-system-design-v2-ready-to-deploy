const mongoose = require('mongoose');

/**
 * A single work session for one task by one user.
 *
 * The legacy 7:00 PM auto cut-off has been removed entirely — sessions now
 * run until the employee stops/completes them. Employees can Pause and Resume
 * an active session as many times as needed; every pause/resume click is
 * recorded with its exact timestamp in `pauseLog`, and the time spent paused
 * is excluded from the billable `durationSeconds`.
 */
const pauseEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['pause', 'resume'], required: true },
    at: { type: Date, required: true },
  },
  { _id: false }
);

const timeLogSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }, // denormalized for fast reporting
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null }, // null while timer is running or paused
    durationSeconds: { type: Number, default: null }, // net working seconds (paused time excluded), set when stopped

    // Pause / Resume tracking
    status: { type: String, enum: ['running', 'paused', 'stopped'], default: 'running' },
    pauseLog: { type: [pauseEventSchema], default: [] }, // exact timestamp of every pause/resume click
    pausedSeconds: { type: Number, default: 0 }, // total seconds spent paused so far
    lastPausedAt: { type: Date, default: null }, // when the current pause began (null when running)

    note: { type: String, default: '' },
  },
  { timestamps: true }
);

timeLogSchema.index({ user: 1, startTime: -1 });
timeLogSchema.index({ service: 1, startTime: -1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
