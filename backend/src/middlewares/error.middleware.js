import { HTTP_STATUS, ENVIRONMENTS } from '../constants/app.constants.js';

/**
 * Enhanced error handler with security considerations
 * Prevents information leakage in production
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errorCode = 'SERVER_ERROR' } = err;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  if (err.code === 11000) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = 'DUPLICATE_FIELD';
    // Don't expose which field is duplicated in production
    message = process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION 
      ? 'Duplicate field value' 
      : `Duplicate field: ${Object.keys(err.keyValue).join(', ')}`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }

  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = 'INVALID_ID';
    message = 'Invalid resource ID';
  }

  // Security: Log error details but don't expose them
  console.error(`Error ${statusCode}: ${message}`);
  if (process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT) {
    console.error('Stack:', err.stack);
  }

  // Security: Never expose stack traces or internal details in production
  const response = {
    success: false,
    message: process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION && statusCode >= 500 
      ? 'Internal server error' 
      : message,
    errorCode,
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === ENVIRONMENTS.DEVELOPMENT && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 handler for undefined routes
 */
const notFound = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    errorCode: 'ROUTE_NOT_FOUND'
  });
};

export { errorHandler, notFound };
