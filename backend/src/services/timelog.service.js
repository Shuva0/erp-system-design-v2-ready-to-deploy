const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');

/**
 * Time-tracking service.
 *
 * The previous 7:00 PM automatic shift-end cut-off has been removed completely.
 * Sessions now stay open until the employee stops or completes them. Employees
 * may Pause and Resume an active session freely; paused time is excluded from
 * the recorded duration, and every pause/resume click is timestamped.
 */

/** Closes the currently-open pause interval (if any) and adds it to pausedSeconds. */
function settleOpenPause(timeLog, at) {
  if (timeLog.status === 'paused' && timeLog.lastPausedAt) {
    const extra = Math.max(0, Math.round((at - timeLog.lastPausedAt) / 1000));
    timeLog.pausedSeconds = (timeLog.pausedSeconds || 0) + extra;
    timeLog.lastPausedAt = null;
  }
}

/**
 * Starts a timer for a task. Enforces one open (running or paused) timer per
 * user at a time, so "hours worked" numbers stay meaningful.
 */
async function startTimer(userId, taskId) {
  const existingOpen = await TimeLog.findOne({ user: userId, endTime: null });
  if (existingOpen) {
    throw new ApiError(400, 'You already have an active timer. Stop it before starting a new one.');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }
  if (task.status === 'completed') {
    throw new ApiError(400, 'This task is already marked completed.');
  }

  const now = new Date();
  const timeLog = await TimeLog.create({
    task: taskId,
    user: userId,
    service: task.service,
    startTime: now,
    status: 'running',
  });

  // Auto-move task to in_progress if it was still pending
  if (task.status === 'pending') {
    task.status = 'in_progress';
    await task.save();
  }

  return timeLog;
}

/**
 * Pauses a running timer. Records the exact pause timestamp.
 */
async function pauseTimer(timeLogId, userId) {
  const timeLog = await TimeLog.findById(timeLogId);
  if (!timeLog) throw new ApiError(404, 'Time log not found.');
  if (String(timeLog.user) !== String(userId)) throw new ApiError(403, 'You can only pause your own timer.');
  if (timeLog.endTime) throw new ApiError(400, 'This timer has already been stopped.');
  if (timeLog.status === 'paused') throw new ApiError(400, 'This timer is already paused.');

  const now = new Date();
  timeLog.status = 'paused';
  timeLog.lastPausedAt = now;
  timeLog.pauseLog.push({ type: 'pause', at: now });
  await timeLog.save();
  return timeLog;
}

/**
 * Resumes a paused timer. Records the exact resume timestamp and folds the
 * just-finished pause interval into pausedSeconds.
 */
async function resumeTimer(timeLogId, userId) {
  const timeLog = await TimeLog.findById(timeLogId);
  if (!timeLog) throw new ApiError(404, 'Time log not found.');
  if (String(timeLog.user) !== String(userId)) throw new ApiError(403, 'You can only resume your own timer.');
  if (timeLog.endTime) throw new ApiError(400, 'This timer has already been stopped.');
  if (timeLog.status !== 'paused') throw new ApiError(400, 'This timer is not paused.');

  const now = new Date();
  settleOpenPause(timeLog, now);
  timeLog.status = 'running';
  timeLog.pauseLog.push({ type: 'resume', at: now });
  await timeLog.save();
  return timeLog;
}

/**
 * Stops a running/paused timer and calculates net duration (excluding any
 * time spent paused).
 */
async function stopTimer(timeLogId, userId) {
  const timeLog = await TimeLog.findById(timeLogId);
  if (!timeLog) throw new ApiError(404, 'Time log not found.');
  if (String(timeLog.user) !== String(userId)) throw new ApiError(403, 'You can only stop your own timer.');
  if (timeLog.endTime) throw new ApiError(400, 'This timer was already stopped.');

  const now = new Date();
  settleOpenPause(timeLog, now); // close any open pause before finalizing

  const grossSeconds = Math.max(0, Math.round((now - timeLog.startTime) / 1000));
  timeLog.endTime = now;
  timeLog.durationSeconds = Math.max(0, grossSeconds - (timeLog.pausedSeconds || 0));
  timeLog.status = 'stopped';
  await timeLog.save();
  return timeLog;
}

/**
 * Marks a task completed and stops its active timer if one is running/paused.
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
 * Returns the currently open (running or paused) timer for a user, if any.
 */
async function getActiveTimer(userId) {
  const timeLog = await TimeLog.findOne({ user: userId, endTime: null }).populate('task', 'title');
  return timeLog || null;
}

/**
 * Daily/weekly summary for one user: total net seconds worked, grouped by day.
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
    byDay: result,
    totalSeconds,
    totalHours: (totalSeconds / 3600).toFixed(2),
  };
}

/**
 * Per-task time breakdown for a single user, including pause/resume counts.
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
        pauseCount: {
          $sum: {
            $size: {
              $filter: {
                input: { $ifNull: ['$pauseLog', []] },
                as: 'e',
                cond: { $eq: ['$$e.type', 'pause'] },
              },
            },
          },
        },
        resumeCount: {
          $sum: {
            $size: {
              $filter: {
                input: { $ifNull: ['$pauseLog', []] },
                as: 'e',
                cond: { $eq: ['$$e.type', 'resume'] },
              },
            },
          },
        },
      },
    },
    { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'task' } },
    { $unwind: '$task' },
    {
      $project: {
        taskId: '$_id',
        title: '$task.title',
        status: '$task.status',
        employeeNote: '$task.employeeNote',
        startDate: 1,
        endDate: 1,
        sessionCount: 1,
        pauseCount: 1,
        resumeCount: 1,
        totalSeconds: 1,
        totalHours: { $divide: ['$totalSeconds', 3600] },
      },
    },
    { $sort: { startDate: -1 } },
  ]);

  return logs;
}

/**
 * Per-user, per-day pause/resume activity with the exact timestamps of every
 * click. Powers the admin/manager "view full pause/resume logs for the day"
 * requirement on the employee profile and on completed tasks.
 */
async function getUserDailyActivity(userId, fromDate, toDate) {
  const match = { user: userId };
  if (fromDate || toDate) {
    match.startTime = {};
    if (fromDate) match.startTime.$gte = fromDate;
    if (toDate) match.startTime.$lte = toDate;
  }

  const logs = await TimeLog.find(match).populate('task', 'title').sort({ startTime: 1 });

  const byDay = {};
  for (const log of logs) {
    for (const ev of log.pauseLog || []) {
      const day = new Date(ev.at).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, pauseCount: 0, resumeCount: 0, events: [] };
      if (ev.type === 'pause') byDay[day].pauseCount += 1;
      if (ev.type === 'resume') byDay[day].resumeCount += 1;
      byDay[day].events.push({
        type: ev.type,
        at: ev.at,
        task: log.task?.title || 'Task',
        taskId: log.task?._id,
      });
    }
  }

  return Object.values(byDay)
    .map((d) => {
      d.events.sort((a, b) => new Date(a.at) - new Date(b.at));
      return d;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

module.exports = {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  completeTask,
  getActiveTimer,
  getUserSummary,
  getUserTaskBreakdown,
  getUserDailyActivity,
};
