const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const timeLogService = require('../services/timelog.service');

// GET /api/v1/tasks
// Supports ?assignedTo=me (employee's own tasks), or admin/manager filters.
const getTasks = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.assignedTo === 'me') {
    filter.assignedTo = req.user._id;
  } else if (req.query.assignedTo) {
    filter.assignedTo = req.query.assignedTo;
  } else if (req.user.role === 'employee') {
    // Employees never see other people's tasks unless explicitly viewing their own
    filter.assignedTo = req.user._id;
  }

  if (req.query.service) filter.service = req.query.service;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.project) filter.project = req.query.project;

  const tasks = await Task.find(filter)
    .populate('service', 'name')
    .populate('project', 'name')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, tasks });
});

// GET /api/v1/tasks/:id
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('service', 'name')
    .populate('project', 'name')
    .populate('assignedTo', 'name email');

  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  res.json({ success: true, task });
});

// POST /api/v1/tasks   (admin/manager assign a task)
const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, service, assignedTo, priority, deadline } = req.body;

  const task = await Task.create({
    title,
    description,
    project,
    service,
    assignedTo,
    assignedBy: req.user._id,
    priority,
    deadline,
  });

  res.status(201).json({ success: true, task });
});

// PATCH /api/v1/tasks/:id
// Employees may only update the `status` field on their own task.
// Admin/manager may update everything.
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  const isOwner = String(task.assignedTo) === String(req.user._id);
  const isManagerOrAdmin = ['admin', 'manager'].includes(req.user.role);

  if (!isOwner && !isManagerOrAdmin) {
    throw new ApiError(403, 'You are not allowed to update this task.');
  }

  if (isManagerOrAdmin) {
    const { title, description, priority, status, deadline, assignedTo } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (deadline) task.deadline = deadline;
    if (assignedTo) task.assignedTo = assignedTo;
  } else {
    // Employees cannot freely change status here — there is intentionally no
    // "pause" or arbitrary status edit for an employee. The only employee-driven
    // transitions are: starting a timer (pending -> in_progress, via timelog.service)
    // and marking complete (via the dedicated completeTask action below).
    throw new ApiError(403, 'Use the "Complete" action to finish a task, or start a timer to begin it.');
  }

  await task.save();
  res.json({ success: true, task });
});

// PATCH /api/v1/tasks/:id/complete
// The ONLY way an employee finishes a task. Stops any running timer for it
// (capped at the 7pm shift-end cutoff if applicable) and marks it completed.
const completeTaskAction = asyncHandler(async (req, res) => {
  const task = await timeLogService.completeTask(req.params.id, req.user._id);
  res.json({ success: true, task });
});

// DELETE /api/v1/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }
  await task.deleteOne();
  res.json({ success: true, message: 'Task deleted.' });
});

module.exports = { getTasks, getTask, createTask, updateTask, completeTaskAction, deleteTask };
