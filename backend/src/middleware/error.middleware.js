/**
 * Centralized error handler. Any error thrown with asyncHandler/next(err)
 * ends up here. Keeps every controller free of repeated res.status().json()
 * error-formatting code.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
