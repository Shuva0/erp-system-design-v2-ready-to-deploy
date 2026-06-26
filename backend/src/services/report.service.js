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

module.exports = { getOverview, getProductivity };
