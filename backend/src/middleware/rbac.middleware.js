const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware.
 * Usage: router.post('/services', protect, authorize('admin'), createService)
 *
 * Pass one or more allowed roles. Must run AFTER `protect`, since it relies
 * on req.user being set.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action.`);
    }

    next();
  };
};

module.exports = { authorize };
