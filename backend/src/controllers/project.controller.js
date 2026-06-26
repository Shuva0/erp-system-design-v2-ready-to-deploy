const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/projects
// Admin/Manager see all (manager scoped to their service); employees see
// only projects tied to tasks assigned to them (handled via a $lookup-free
// approach: we just filter by service for managers, and let employees use
// the task list instead of browsing all projects directly).
const getProjects = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.user.role === 'manager') {
    filter.service = req.user.service;
  }
  if (req.query.service) filter.service = req.query.service;
  if (req.query.status) filter.status = req.query.status;

  const projects = await Project.find(filter)
    .populate('service', 'name')
    .populate('manager', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, projects });
});

// GET /api/v1/projects/:id
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('service', 'name')
    .populate('manager', 'name email');

  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }
  res.json({ success: true, project });
});

// POST /api/v1/projects
const createProject = asyncHandler(async (req, res) => {
  const { name, client, service, manager, deadline } = req.body;

  const project = await Project.create({
    name,
    client,
    service,
    manager: manager || req.user._id,
    deadline,
  });

  res.status(201).json({ success: true, project });
});

// PATCH /api/v1/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }

  const { name, client, status, deadline, manager } = req.body;
  if (name) project.name = name;
  if (client !== undefined) project.client = client;
  if (status) project.status = status;
  if (deadline) project.deadline = deadline;
  if (manager) project.manager = manager;

  await project.save();
  res.json({ success: true, project });
});

// DELETE /api/v1/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) {
    throw new ApiError(404, 'Project not found.');
  }
  await project.deleteOne();
  res.json({ success: true, message: 'Project deleted.' });
});

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject };
