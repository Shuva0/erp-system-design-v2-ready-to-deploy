const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { getOverview, getProductivity } = require('../controllers/report.controller');

router.get('/overview', protect, authorize('admin', 'manager'), getOverview);
router.get('/productivity', protect, authorize('admin', 'manager'), getProductivity);

module.exports = router;
