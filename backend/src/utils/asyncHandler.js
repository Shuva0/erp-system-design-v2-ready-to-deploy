/**
 * Wraps an async controller function so any thrown error (or rejected promise)
 * is automatically passed to next(), which forwards it to error.middleware.js.
 * Without this, every controller would need its own try/catch block.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
