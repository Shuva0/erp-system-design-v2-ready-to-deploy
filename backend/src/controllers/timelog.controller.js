const asyncHandler = require('../utils/asyncHandler');
const timeLogService = require('../services/timelog.service');

// POST /api/v1/timelogs/start   body: { taskId }
const startTimer = asyncHandler(async (req, res) => {
  const timeLog = await timeLogService.startTimer(req.user._id, req.body.taskId);
  res.status(201).json({ success: true, timeLog });
});

// POST /api/v1/timelogs/:id/pause
const pauseTimer = asyncHandler(async (req, res) => {
  const timeLog = await timeLogService.pauseTimer(req.params.id, req.user._id);
  res.json({ success: true, timeLog });
});

// POST /api/v1/timelogs/:id/resume
const resumeTimer = asyncHandler(async (req, res) => {
  const timeLog = await timeLogService.resumeTimer(req.params.id, req.user._id);
  res.json({ success: true, timeLog });
});

// POST /api/v1/timelogs/:id/stop
const stopTimer = asyncHandler(async (req, res) => {
  const timeLog = await timeLogService.stopTimer(req.params.id, req.user._id);
  res.json({ success: true, timeLog });
});

// GET /api/v1/timelogs/active
const getActiveTimer = asyncHandler(async (req, res) => {
  const timeLog = await timeLogService.getActiveTimer(req.user._id);
  res.json({ success: true, timeLog }); // null if nothing running
});

// GET /api/v1/timelogs/me/summary?from=2026-06-01&to=2026-06-30
const getMySummary = asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setDate(new Date().getDate() - 7));
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const summary = await timeLogService.getUserSummary(req.user._id, from, to);
  res.json({ success: true, summary });
});

module.exports = { startTimer, pauseTimer, resumeTimer, stopTimer, getActiveTimer, getMySummary };
