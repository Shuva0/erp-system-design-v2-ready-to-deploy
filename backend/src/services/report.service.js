const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const mongoose = require('mongoose');

/**
 * Total hours grouped by service and by user, within a date range.
 * Two separate aggregations because grouping by both at once would need a
 * compound _id, which is harder for the frontend to chart directly.
 */
async function getOverview(fromDate, toDate, serviceFilter) {
  const matchStage = {
    startTime: { $gte: fromDate, $lte: toDate },
    endTime: { $ne: null },
  };
  if (serviceFilter) matchStage.service = new mongoose.Types.ObjectId(serviceFilter);

  const byService = await TimeLog.aggregate([
    { $match: matchStage },
    { $group: { _id: '$service', totalSeconds: { $sum: '$durationSeconds' } } },
    { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
    { $unwind: '$service' },
    { $project: { serviceName: '$service.name', totalSeconds: 1, totalHours: { $divide: ['$totalSeconds', 3600] } } },
    { $sort: { totalSeconds: -1 } },
  ]);

  const byUser = await TimeLog.aggregate([
    { $match: matchStage },
    { $group: { _id: '$user', totalSeconds: { $sum: '$durationSeconds' } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        userName: '$user.name',
        totalSeconds: 1,
        totalHours: { $divide: ['$totalSeconds', 3600] },
      },
    },
    { $sort: { totalSeconds: -1 } },
  ]);

  return { byService, byUser };
}

/**
 * Productivity: for each user, total hours logged vs. tasks completed in
 * the same window. Two aggregations joined in JS by user id, since they're
 * on different collections (TimeLog vs Task) and a $lookup across both
 * with separate date-range filters gets messy fast.
 */
async function getProductivity(fromDate, toDate) {
  const hoursPerUser = await TimeLog.aggregate([
    { $match: { startTime: { $gte: fromDate, $lte: toDate }, endTime: { $ne: null } } },
    { $group: { _id: '$user', totalSeconds: { $sum: '$durationSeconds' } } },
  ]);

  const completedPerUser = await Task.aggregate([
    { $match: { status: 'completed', updatedAt: { $gte: fromDate, $lte: toDate } } },
    { $group: { _id: '$assignedTo', completedCount: { $sum: 1 } } },
  ]);

  const hoursMap = new Map(hoursPerUser.map((h) => [String(h._id), h.totalSeconds]));
  const completedMap = new Map(completedPerUser.map((c) => [String(c._id), c.completedCount]));

  const userIds = new Set([...hoursMap.keys(), ...completedMap.keys()]);

  const User = require('../models/User');
  const users = await User.find({ _id: { $in: [...userIds] } }).select('name');
  const nameMap = new Map(users.map((u) => [String(u._id), u.name]));

  return [...userIds].map((id) => ({
    userId: id,
    userName: nameMap.get(id) || 'Unknown',
    totalHours: ((hoursMap.get(id) || 0) / 3600).toFixed(2),
    completedTasks: completedMap.get(id) || 0,
  }));
}


/**
 * Full activity report for a single user within an (optional) date range.
 * Defaults to ALL data when no range is supplied. Includes: tasks worked on
 * with time taken per task, pause/resume counts, and the detailed timestamped
 * activity log of every session and pause/resume click.
 */
async function getUserActivity(userId, fromDate, toDate) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const range = {};
  if (fromDate) range.$gte = fromDate;
  if (toDate) range.$lte = toDate;
  const hasRange = Object.keys(range).length > 0;

  const logMatch = { user: uid };
  if (hasRange) logMatch.startTime = range;

  const logs = await TimeLog.find(logMatch)
    .populate('task', 'title status')
    .sort({ startTime: 1 });

  // Per-task aggregation
  const taskMap = new Map();
  let totalSeconds = 0;
  let pauseCount = 0;
  let resumeCount = 0;
  const sessions = [];

  for (const log of logs) {
    const taskId = log.task?._id ? String(log.task._id) : 'unknown';
    const title = log.task?.title || 'Task';
    const status = log.task?.status || 'unknown';
    const dur = log.durationSeconds || 0;
    totalSeconds += dur;

    const logPause = (log.pauseLog || []).filter((e) => e.type === 'pause').length;
    const logResume = (log.pauseLog || []).filter((e) => e.type === 'resume').length;
    pauseCount += logPause;
    resumeCount += logResume;

    if (!taskMap.has(taskId)) {
      taskMap.set(taskId, {
        taskId,
        title,
        status,
        totalSeconds: 0,
        pauseCount: 0,
        resumeCount: 0,
        sessionCount: 0,
      });
    }
    const t = taskMap.get(taskId);
    t.totalSeconds += dur;
    t.pauseCount += logPause;
    t.resumeCount += logResume;
    t.sessionCount += 1;

    sessions.push({
      taskTitle: title,
      startTime: log.startTime,
      endTime: log.endTime,
      durationSeconds: dur,
      status: log.status,
      pauseEvents: (log.pauseLog || []).map((e) => ({ type: e.type, at: e.at })),
    });
  }

  // Completed tasks count within range (by completion/update time)
  const completedMatch = { assignedTo: uid, status: 'completed' };
  if (hasRange) completedMatch.updatedAt = range;
  const completedTasks = await Task.find(completedMatch).select('title updatedAt');

  const tasks = [...taskMap.values()].map((t) => ({
    ...t,
    totalHours: (t.totalSeconds / 3600).toFixed(2),
  }));

  return {
    range: {
      from: fromDate ? fromDate.toISOString() : null,
      to: toDate ? toDate.toISOString() : null,
    },
    totals: {
      totalSeconds,
      totalHours: (totalSeconds / 3600).toFixed(2),
      pauseCount,
      resumeCount,
      completedCount: completedTasks.length,
      taskCount: tasks.length,
    },
    completedTasks: completedTasks.map((t) => ({
      title: t.title,
      completedAt: t.updatedAt,
    })),
    tasks,
    sessions,
  };
}

module.exports = { getOverview, getProductivity, getUserActivity };
