const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  completeTaskAction,
  deleteTask,
} = require('../controllers/task.controller');

router.get('/', protect, getTasks);
router.get('/:id', protect, getTask);
router.post('/', protect, authorize('admin', 'manager'), createTask);
router.patch('/:id', protect, updateTask); // ownership/role logic handled in controller
router.patch('/:id/complete', protect, completeTaskAction); // employee's only path to finishing a task
router.delete('/:id', protect, authorize('admin', 'manager'), deleteTask);

module.exports = router;
