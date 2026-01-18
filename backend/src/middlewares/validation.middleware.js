import { body, param, validationResult } from 'express-validator';
import xss from 'xss';
import { AppError } from '../utils/appError.js';

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize params
  Object.keys(req.params).forEach(key => {
    if (typeof req.params[key] === 'string') {
      req.params[key] = xss(req.params[key].trim());
    }
  });

  // Sanitize query
  Object.keys(req.query).forEach(key => {
    if (typeof req.query[key] === 'string') {
      req.query[key] = xss(req.query[key].trim());
    }
  });

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim());
      }
    });
  }

  next();
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    throw new AppError(errorMessages.join(', '), 400);
  }
  next();
};

// Username validation rules
const validateUsername = [
  param('username')
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be 1-50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores')
    .escape(),
  handleValidationErrors
];

export { sanitizeInput, validateUsername, handleValidationErrors };
