/**
 * Custom error class so we can throw errors with an HTTP status code attached,
 * and have one centralized place (error.middleware.js) turn them into
 * consistent JSON responses.
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
