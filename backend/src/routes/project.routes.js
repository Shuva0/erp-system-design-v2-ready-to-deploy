const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.post('/', protect, authorize('admin', 'manager'), createProject);
router.patch('/:id', protect, authorize('admin', 'manager'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

module.exports = router;
