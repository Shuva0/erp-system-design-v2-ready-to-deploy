const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const {
  getServices,
  createService,
  updateService,
  deleteService,
} = require('../controllers/service.controller');

router.get('/', protect, getServices); // everyone logged in can see the list (needed for dropdowns)
router.post('/', protect, authorize('admin', 'manager'), createService);
router.patch('/:id', protect, authorize('admin', 'manager'), updateService);
router.delete('/:id', protect, authorize('admin'), deleteService); // delete is admin-only by design

module.exports = router;
