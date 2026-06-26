const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }, // denormalized for fast reporting
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null }, // null while timer is running
    durationSeconds: { type: Number, default: null }, // calculated when stopped
    autoStopped: { type: Boolean, default: false }, // true if the 7pm shift-end cutoff closed this timer, not the user
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

timeLogSchema.index({ user: 1, startTime: -1 });
timeLogSchema.index({ service: 1, startTime: -1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);
