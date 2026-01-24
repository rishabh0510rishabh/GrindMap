import { body, param, validationResult } from 'express-validator';
import xss from 'xss';
import { escapeString } from '../utils/dbSanitizer.js';
import { AppError, ERROR_CODES } from '../utils/appError.js';
import { HTTP_STATUS, VALIDATION } from '../constants/app.constants.js';
import { asyncMiddleware } from '../utils/asyncWrapper.js';

const sanitizeValue = (value) => escapeString(xss(value.trim()));

// Reuse the same sanitizer logic for params, query, and body payloads
const sanitizeObject = (source) => {
  if (!source || typeof source !== 'object') {
    return;
  }

  Object.keys(source).forEach((key) => {
    if (typeof source[key] === 'string') {
      source[key] = sanitizeValue(source[key]);
    }
  });
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  try {
    sanitizeObject(req.params);
    sanitizeObject(req.query);
    sanitizeObject(req.body);

    next();
  } catch (error) {
    throw new AppError('Input sanitization failed', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
};

/**
 * Validation error handler middleware
 * Converts express-validator errors to standardized format
 */
const handleValidationErrors = asyncMiddleware(async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      throw new AppError(
        errorMessages.join(', '), 
        HTTP_STATUS.BAD_REQUEST, 
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Username validation rules for platform endpoints
 * Ensures username meets platform requirements
 */
const validateUsername = [
  param('username')
    .isLength({ 
      min: VALIDATION.USERNAME_MIN_LENGTH, 
      max: VALIDATION.USERNAME_MAX_LENGTH 
    })
    .withMessage(`Username must be ${VALIDATION.USERNAME_MIN_LENGTH}-${VALIDATION.USERNAME_MAX_LENGTH} characters`)
    .matches(VALIDATION.USERNAME_PATTERN)
    .withMessage('Username can only contain letters, numbers, hyphens, and underscores')
    .escape(),
  handleValidationErrors
];

/**
 * Email validation rules for authentication
 */
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .escape(),
  handleValidationErrors
];

/**
 * Password validation rules for authentication
 */
const validatePassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

export { 
  sanitizeInput, 
  validateUsername, 
  validateEmail, 
  validatePassword, 
  handleValidationErrors 
};
