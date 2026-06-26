const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  startTimer,
  stopTimer,
  getActiveTimer,
  getMySummary,
} = require('../controllers/timelog.controller');

// All time-tracking actions require login; no role restriction needed here
// since every role (even managers/admins) might log their own time.
router.post('/start', protect, startTimer);
router.post('/:id/stop', protect, stopTimer);
router.get('/active', protect, getActiveTimer);
router.get('/me/summary', protect, getMySummary);

module.exports = router;
