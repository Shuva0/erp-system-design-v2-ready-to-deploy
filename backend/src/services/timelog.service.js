const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

const SHIFT_END_HOUR = 19; // 7:00 PM, in the server's local time

/**
 * Returns today's 7pm cutoff as a Date object, anchored to the same
 * calendar day as the given reference date (defaults to now).
 */
function getShiftEndForDate(referenceDate = new Date()) {
  const cutoff = new Date(referenceDate);
  cutoff.setHours(SHIFT_END_HOUR, 0, 0, 0);
  return cutoff;
}

/**
 * Auto-closes any timer that's still running past the 7pm shift-end cutoff
 * for the day it was started on. Called defensively before any timer read
 * so stale "still running" timers never silently survive past shift end,
 * even if the employee just left their laptop open.
 */
async function autoCloseExpiredTimer(timeLog) {
  if (!timeLog || timeLog.endTime) return timeLog;

  const shiftEnd = getShiftEndForDate(timeLog.startTime);
  const now = new Date();

  if (now > shiftEnd) {
    timeLog.endTime = shiftEnd;
    timeLog.durationSeconds = Math.max(0, Math.round((shiftEnd - timeLog.startTime) / 1000));
    timeLog.autoStopped = true;
    await timeLog.save();
  }

  return timeLog;
}

/**
 * Starts a timer for a task. Enforces one running timer per user at a time —
 * this matters because without it, a user could start five timers and your
 * "hours worked" numbers become meaningless.
 */
async function startTimer(userId, taskId) {
  const existingRunning = await TimeLog.findOne({ user: userId, endTime: null });
  if (existingRunning) {
    await autoCloseExpiredTimer(existingRunning);
    // If it was auto-closed just now, the slot is free; otherwise it's a genuine duplicate.
    const stillRunning = await TimeLog.findOne({ user: userId, endTime: null });
    if (stillRunning) {
      throw new ApiError(400, 'You already have a running timer. Stop it before starting a new one.');
    }
  }

  const now = new Date();
  if (now.getHours() >= SHIFT_END_HOUR) {
    throw new ApiError(400, 'Your shift has ended for today (7:00 PM cutoff). You can resume tomorrow.');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }
  if (task.status === 'completed') {
    throw new ApiError(400, 'This task is already marked completed.');
  }

  const timeLog = await TimeLog.create({
    task: taskId,
    user: userId,
    service: task.service,
    startTime: now,
  });

  // Auto-move task to in_progress if it was still pending
  if (task.status === 'pending') {
    task.status = 'in_progress';
    await task.save();
  }

  return timeLog;
}

/**
 * Stops a running timer and calculates duration. If 7pm has already passed
 * since the timer started, the duration is capped at the 7pm cutoff rather
 * than counting time after shift end.
 */
async function stopTimer(timeLogId, userId) {
  const timeLog = await TimeLog.findById(timeLogId);

  if (!timeLog) {
    throw new ApiError(404, 'Time log not found.');
  }
  if (String(timeLog.user) !== String(userId)) {
    throw new ApiError(403, 'You can only stop your own timer.');
  }
  if (timeLog.endTime) {
    throw new ApiError(400, 'This timer was already stopped.');
  }

  const shiftEnd = getShiftEndForDate(timeLog.startTime);
  const now = new Date();
  const effectiveEnd = now > shiftEnd ? shiftEnd : now;

  timeLog.endTime = effectiveEnd;
  timeLog.durationSeconds = Math.max(0, Math.round((effectiveEnd - timeLog.startTime) / 1000));
  if (now > shiftEnd) timeLog.autoStopped = true;
  await timeLog.save();

  return timeLog;
}

/**
 * Marks a task completed and stops its active timer if one is running.
 * This is the "Complete" action — there is deliberately no "pause": a
 * task is either being actively timed, or it's done.
 */
async function completeTask(taskId, userId) {
  const activeLog = await TimeLog.findOne({ task: taskId, user: userId, endTime: null });
  if (activeLog) {
    await stopTimer(activeLog._id, userId);
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }
  if (String(task.assignedTo) !== String(userId)) {
    throw new ApiError(403, 'You can only complete your own task.');
  }

  task.status = 'completed';
  await task.save();
  return task;
}

/**
 * Returns the currently running timer for a user, if any. Auto-closes it
 * first if shift end has already passed, so the frontend never shows a
 * "still running" timer from yesterday or past 7pm today.
 */
async function getActiveTimer(userId) {
  const timeLog = await TimeLog.findOne({ user: userId, endTime: null }).populate('task', 'title');
  if (!timeLog) return null;

  await autoCloseExpiredTimer(timeLog);
  return timeLog.endTime ? null : timeLog;
}

/**
 * Daily/weekly summary for one user: total seconds worked, grouped by day.
 * Uses MongoDB's aggregation pipeline — this is the standard way to do
 * "group and sum" operations efficiently in MongoDB rather than pulling
 * all documents into Node and summing in JavaScript.
 */
async function getUserSummary(userId, fromDate, toDate) {
  const result = await TimeLog.aggregate([
    {
      $match: {
        user: userId,
        startTime: { $gte: fromDate, $lte: toDate },
        endTime: { $ne: null }, // only completed sessions
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
        totalSeconds: { $sum: '$durationSeconds' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totalSeconds = result.reduce((sum, day) => sum + day.totalSeconds, 0);

  return {
    byDay: result, // [{ _id: '2026-06-20', totalSeconds: 14400 }, ...]
    totalSeconds,
    totalHours: (totalSeconds / 3600).toFixed(2),
  };
}

/**
 * Per-task time breakdown for a single user: every task assigned to them,
 * with first start time, last end time, total duration, and current status.
 * This is what powers the admin's "drill into one user" view.
 */
async function getUserTaskBreakdown(userId) {
  const logs = await TimeLog.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$task',
        startDate: { $min: '$startTime' },
        endDate: { $max: '$endTime' },
        totalSeconds: { $sum: { $ifNull: ['$durationSeconds', 0] } },
        sessionCount: { $sum: 1 },
      },
    },
    { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'task' } },
    { $unwind: '$task' },
    {
      $project: {
        taskId: '$_id',
        title: '$task.title',
        status: '$task.status',
        startDate: 1,
        endDate: 1,
        sessionCount: 1,
        totalSeconds: 1,
        totalHours: { $divide: ['$totalSeconds', 3600] },
      },
    },
    { $sort: { startDate: -1 } },
  ]);

  return logs;
}

module.exports = {
  startTimer,
  stopTimer,
  completeTask,
  getActiveTimer,
  getUserSummary,
  getUserTaskBreakdown,
  getShiftEndForDate,
};
