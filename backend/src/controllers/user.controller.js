const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const timeLogService = require('../services/timelog.service');

// GET /api/v1/users   (admin: everyone; manager: everyone except admins)
const getUsers = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  // Managers can see the full team to assign tasks across departments, but
  // never see admin accounts — that tier is reserved for admins only.
  if (req.user.role === 'manager') {
    filter.role = { $ne: 'admin' };
  }

  const users = await User.find(filter).select('-password').populate('service', 'name');
  res.json({ success: true, users });
});

// GET /api/v1/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('service', 'name');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  res.json({ success: true, user });
});

// POST /api/v1/users   (admin creates a user directly, e.g. an employee account)
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, service } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(400, 'An account with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'employee',
    service,
    authProvider: 'local',
  });

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// PATCH /api/v1/users/:id   (self can update name/avatar; admin can update anything)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const isSelf = String(user._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isSelf && !isAdmin) {
    throw new ApiError(403, 'You are not allowed to update this user.');
  }

  const { name, avatarUrl, service } = req.body;
  if (name) user.name = name;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  // Only an admin may reassign someone's department
  if (isAdmin && service) user.service = service;

  await user.save();
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
});

// PATCH /api/v1/users/:id/role   (admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'manager', 'employee'].includes(role)) {
    throw new ApiError(400, 'Invalid role.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.role = role;
  await user.save();
  res.json({ success: true, user: { id: user._id, role: user.role } });
});

// PATCH /api/v1/users/:id/department   (admin only — assigns/reassigns a user's department)
const assignDepartment = asyncHandler(async (req, res) => {
  const { service } = req.body;
  if (!service) {
    throw new ApiError(400, 'A service/department id is required.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.service = service;
  await user.save();

  const populated = await User.findById(user._id).select('-password').populate('service', 'name');
  res.json({ success: true, user: populated });
});

// GET /api/v1/users/:id/task-history   (admin only — full drill-down: every task,
// start date, end date, total time taken, for this specific user)
const getUserTaskHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').populate('service', 'name');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const taskHistory = await timeLogService.getUserTaskBreakdown(user._id);
  res.json({ success: true, user, taskHistory });
});

// DELETE /api/v1/users/:id   (soft delete / deactivate)
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  user.isActive = false;
  await user.save();
  res.json({ success: true, message: 'User deactivated.' });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  assignDepartment,
  getUserTaskHistory,
  deactivateUser,
};
