const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/report.service');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { buildUserActivityPdf } = require('../services/reportPdf.service');

function parseDateRange(req) {
  const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setDate(new Date().getDate() - 7));
  const to = req.query.to ? new Date(req.query.to) : new Date();
  return { from, to };
}

// Optional range: returns null bounds when nothing supplied (=> all data)
function parseOptionalRange(req) {
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  return { from, to };
}

// GET /api/v1/reports/overview?from=&to=&service=
const getOverview = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req);
  const overview = await reportService.getOverview(from, to, req.query.service);
  res.json({ success: true, overview });
});

// GET /api/v1/reports/productivity?from=&to=
const getProductivity = asyncHandler(async (req, res) => {
  const { from, to } = parseDateRange(req);
  const productivity = await reportService.getProductivity(from, to);
  res.json({ success: true, productivity });
});

// GET /api/v1/reports/user-activity?userId=&from=&to=
// Defaults to ALL data when no range is provided.
const getUserActivity = asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  if (!userId) throw new ApiError(400, 'A userId query parameter is required.');

  const user = await User.findById(userId).select('name email role').populate('service', 'name');
  if (!user) throw new ApiError(404, 'User not found.');

  const { from, to } = parseOptionalRange(req);
  const activity = await reportService.getUserActivity(userId, from, to);

  res.json({ success: true, user, activity });
});

// GET /api/v1/reports/user-activity/pdf?userId=&from=&to=
const getUserActivityPdf = asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  if (!userId) throw new ApiError(400, 'A userId query parameter is required.');

  const user = await User.findById(userId).select('name email role').populate('service', 'name');
  if (!user) throw new ApiError(404, 'User not found.');

  const { from, to } = parseOptionalRange(req);
  const activity = await reportService.getUserActivity(userId, from, to);

  const safeName = (user.name || 'user').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="activity-${safeName}.pdf"`);

  buildUserActivityPdf(res, { user, activity, from, to });
});

module.exports = { getOverview, getProductivity, getUserActivity, getUserActivityPdf };
