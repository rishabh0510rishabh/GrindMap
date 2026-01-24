import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.js';

// Authentication bypass protection
export const authBypassProtection = (req, res, next) => {
  const suspiciousPatterns = [
    /admin/i,
    /root/i,
    /bypass/i,
    /\.\.\/\.\.\//,
    /null/i,
    /undefined/i,
    /'or'1'='1'/i,
    /union\s+select/i
  ];

  const checkValue = (value) => {
    if (!value) return false;
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };

  // Check headers
  const authHeader = req.headers.authorization;
  if (authHeader && checkValue(authHeader)) {
    return next(new AppError('Suspicious authentication attempt detected', 401));
  }

  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (checkValue(key) || checkValue(value)) {
      return next(new AppError('Suspicious query parameter detected', 400));
    }
  } else {
    throw new AppError("Not authorized, no token", 401, ERROR_CODES.INVALID_TOKEN);
  }

  // Check body parameters
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (checkValue(key) || (typeof value === 'string' && checkValue(value))) {
          return true;
        }
        if (typeof value === 'object' && value !== null && checkObject(value)) {
          return true;
        }
      }
      return false;
    };

    if (checkObject(req.body)) {
      return next(new AppError('Suspicious request body detected', 400));
    }
  }

  next();
};

// JWT token validation
export const validateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return next();
  }

  try {
    // Basic token format validation
    if (token.length < 10 || token.length > 2048) {
      return next(new AppError('Invalid token format', 401));
    }

    // Check for suspicious token patterns
    const suspiciousTokenPatterns = [
      /^null$/i,
      /^undefined$/i,
      /^admin$/i,
      /^test$/i,
      /^debug$/i
    ];

    if (suspiciousTokenPatterns.some(pattern => pattern.test(token))) {
      return next(new AppError('Suspicious token detected', 401));
    }

    req.token = token;
    next();
  } catch (error) {
    next(new AppError('Token validation failed', 401));
  }
};
