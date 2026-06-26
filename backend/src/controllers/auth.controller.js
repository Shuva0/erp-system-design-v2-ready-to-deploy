const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

// POST /api/v1/auth/register
// In practice, you'll likely lock this down so only admins can create users
// (see user.controller.js createUser), but a public register endpoint is
// useful for the very first admin account or open sign-up flows.
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, service } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(400, 'An account with this email already exists.');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'employee',
    service,
    authProvider: 'local',
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // .select('+password') because the schema excludes password by default
  const user = await User.findOne({ email }).select('+password');

  if (!user || user.authProvider !== 'local') {
    throw new ApiError(401, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated.');
  }

  const token = generateToken(user);

  res.json({
    success: true,
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  // req.user was already attached by the `protect` middleware
  res.json({ success: true, user: req.user });
});

// GET /api/v1/auth/google/callback  (called after passport.authenticate('google') succeeds)
const googleCallback = asyncHandler(async (req, res) => {
  // req.user is set by Passport after successful Google auth
  const token = generateToken(req.user);

  // Redirect back to frontend with the token (frontend reads it from the URL)
  res.redirect(`${process.env.FRONTEND_URL}/oauth-success?token=${token}`);
});

module.exports = { register, login, getMe, googleCallback };
