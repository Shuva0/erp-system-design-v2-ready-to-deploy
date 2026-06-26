const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/timelogs', require('./timelog.routes'));
router.use('/users', require('./user.routes'));
router.use('/services', require('./service.routes'));
router.use('/projects', require('./project.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
