const Service = require('../models/Service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/services
const getServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, services });
});

// POST /api/v1/services   body: { name, description }
const createService = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const existing = await Service.findOne({ name });
  if (existing) {
    throw new ApiError(400, 'A service with this name already exists.');
  }

  const service = await Service.create({ name, description, createdBy: req.user._id });
  res.status(201).json({ success: true, service });
});

// PATCH /api/v1/services/:id
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    throw new ApiError(404, 'Service not found.');
  }

  const { name, description } = req.body;
  if (name) service.name = name;
  if (description !== undefined) service.description = description;

  await service.save();
  res.json({ success: true, service });
});

// DELETE /api/v1/services/:id  (soft delete - keeps historical data intact)
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    throw new ApiError(404, 'Service not found.');
  }

  service.isActive = false;
  await service.save();
  res.json({ success: true, message: 'Service deactivated.' });
});

module.exports = { getServices, createService, updateService, deleteService };
