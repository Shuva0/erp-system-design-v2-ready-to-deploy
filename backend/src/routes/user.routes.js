const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updateUserRole,
  assignDepartment,
  getUserTaskHistory,
  deactivateUser,
} = require('../controllers/user.controller');

router.get('/', protect, authorize('admin', 'manager'), getUsers);
router.get('/:id', protect, getUser); // self-access checked inside controller logic if needed
router.get('/:id/task-history', protect, authorize('admin'), getUserTaskHistory);
router.post('/', protect, authorize('admin'), createUser);
router.patch('/:id', protect, updateUser); // self or admin, checked in controller
router.patch('/:id/role', protect, authorize('admin'), updateUserRole);
router.patch('/:id/department', protect, authorize('admin'), assignDepartment);
router.delete('/:id', protect, authorize('admin'), deactivateUser);

module.exports = router;
