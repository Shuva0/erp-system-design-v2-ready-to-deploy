const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: String, default: '' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'on_hold', 'completed'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
