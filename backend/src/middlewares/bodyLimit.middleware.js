import { AppError } from '../utils/appError.js';

const BODY_SIZE_LIMITS = {
  health: 0,           // No body for health checks
  audit: 1024,         // 1KB for audit queries
  security: 2 * 1024,  // 2KB for security operations
  api: 100 * 1024,     // 100KB for general API
  upload: 10 * 1024 * 1024 // 10MB for file uploads
};

export const bodySize = (maxSize) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }
    
    let bodySize = 0;
    const originalOn = req.on;
    
    req.on = function(event, listener) {
      if (event === 'data') {
        const originalListener = listener;
        const wrappedListener = (chunk) => {
          bodySize += chunk.length;
          
          if (bodySize > maxSize) {
            console.warn(`🚨 Request body too large: ${bodySize} bytes > ${maxSize} bytes`);
            
            const error = new AppError(`Request body too large. Limit: ${Math.round(maxSize / 1024)}KB`, 413);
            return next(error);
          }
          
          return originalListener(chunk);
        };
        
        return originalOn.call(this, event, wrappedListener);
      }
      
      return originalOn.call(this, event, listener);
    };
    
    next();
  };
};

export const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next();
    }
    
    const contentType = req.get('Content-Type');
    
    if (!contentType) {
      return next(new AppError('Content-Type header required', 400));
    }
    
    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );
    
    if (!isAllowed) {
      console.warn(`🚫 Invalid content type: ${contentType}`);
      return next(new AppError(`Invalid content type. Allowed: ${allowedTypes.join(', ')}`, 415));
    }
    
    next();
  };
};

// Specific body size limiters
export const healthBodyLimit = bodySize(BODY_SIZE_LIMITS.health);
export const auditBodyLimit = bodySize(BODY_SIZE_LIMITS.audit);
export const securityBodyLimit = bodySize(BODY_SIZE_LIMITS.security);
export const apiBodyLimit = bodySize(BODY_SIZE_LIMITS.api);
export const uploadBodyLimit = bodySize(BODY_SIZE_LIMITS.upload);