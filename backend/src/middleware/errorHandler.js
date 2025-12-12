/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Supabase/Postgre errors
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL constraint violations
    if (err.code === '23505') {
      status = 409;
      code = 'DUPLICATE_ERROR';
      message = 'Resource already exists';
    } else if (err.code === '23503') {
      status = 400;
      code = 'FOREIGN_KEY_ERROR';
      message = 'Referenced resource does not exist';
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Send error response
  res.status(status).json({
    error: {
      code,
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      status: 404,
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
