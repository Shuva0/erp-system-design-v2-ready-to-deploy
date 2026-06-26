const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/report.service');

function parseDateRange(req) {
  const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setDate(new Date().getDate() - 7));
  const to = req.query.to ? new Date(req.query.to) : new Date();
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

module.exports = { getOverview, getProductivity };
