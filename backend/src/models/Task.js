const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    deadline: { type: Date },

    // Employee-authored note explaining progress, blockers, or details for
    // this specific task. The assigned employee can add and edit it; admins
    // and managers can read it.
    employeeNote: { type: String, default: '' },
    noteUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
