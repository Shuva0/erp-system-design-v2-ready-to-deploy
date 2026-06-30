const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getActiveTimer,
  getMySummary,
} = require('../controllers/timelog.controller');

// All time-tracking actions require login; no role restriction needed here
// since every role might log their own time.
router.post('/start', protect, startTimer);
router.post('/:id/pause', protect, pauseTimer);
router.post('/:id/resume', protect, resumeTimer);
router.post('/:id/stop', protect, stopTimer);
router.get('/active', protect, getActiveTimer);
router.get('/me/summary', protect, getMySummary);

module.exports = router;
