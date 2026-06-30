const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const {
  getOverview,
  getProductivity,
  getUserActivity,
  getUserActivityPdf,
} = require('../controllers/report.controller');

router.get('/overview', protect, authorize('admin', 'manager'), getOverview);
router.get('/productivity', protect, authorize('admin', 'manager'), getProductivity);
router.get('/user-activity', protect, authorize('admin', 'manager'), getUserActivity);
router.get('/user-activity/pdf', protect, authorize('admin', 'manager'), getUserActivityPdf);

module.exports = router;
