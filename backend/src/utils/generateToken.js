const jwt = require('jsonwebtoken');

/**
 * Signs a JWT containing the user's id and role.
 * Keeping the payload small (just id + role) means the token stays
 * lightweight, and the middleware can look up fresh user data from the DB
 * when it needs more than that.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = generateToken;
