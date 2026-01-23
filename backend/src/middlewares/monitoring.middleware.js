import MetricsCollector from '../utils/metricsCollector.js';
import Logger from '../utils/logger.js';

// Enhanced performance monitoring middleware
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const startHrTime = process.hrtime.bigint();
  
  // Track request start
  MetricsCollector.increment('http.requests.started', 1, {
    method: req.method,
    path: req.route?.path || req.path
  });
  
  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const hrDuration = Number(process.hrtime.bigint() - startHrTime) / 1000000; // Convert to ms
    
    // Record HTTP metrics
    MetricsCollector.recordHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration,
      res.get('content-length') || 0
    );
    
    // Record detailed timing
    MetricsCollector.timing('http.request', duration, {
      method: req.method,
      status: res.statusCode,
      path: req.route?.path || req.path
    });
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      Logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Database operation monitoring
export const dbMonitoring = (operation) => {
  return async (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const start = Date.now();
      let success = true;
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        const duration = Date.now() - start;
        MetricsCollector.recordDbOperation(operation, duration, success);
      }
    };
    
    return descriptor;
  };
};

// Cache operation monitoring
export const cacheMonitoring = (req, res, next) => {
  // Override cache methods if they exist
  if (req.cache) {
    const originalGet = req.cache.get;
    const originalSet = req.cache.set;
    
    req.cache.get = function(key) {
      const result = originalGet.call(this, key);
      MetricsCollector.recordCacheOperation('get', !!result);
      return result;
    };
    
    req.cache.set = function(key, value, ttl) {
      MetricsCollector.recordCacheOperation('set');
      return originalSet.call(this, key, value, ttl);
    };
  }
  
  next();
};

// Memory monitoring middleware
export const memoryMonitoring = (req, res, next) => {
  const memBefore = process.memoryUsage();
  
  res.on('finish', () => {
    const memAfter = process.memoryUsage();
    const memDiff = memAfter.heapUsed - memBefore.heapUsed;
    
    if (memDiff > 10 * 1024 * 1024) { // 10MB increase
      Logger.warn('High memory allocation detected', {
        path: req.path,
        method: req.method,
        memoryIncrease: memDiff,
        heapUsed: memAfter.heapUsed
      });
    }
    
    MetricsCollector.gauge('memory.request_allocation', memDiff, {
      path: req.route?.path || req.path,
      method: req.method
    });
  });
  
  next();
};

// Error tracking middleware
export const errorTracking = (err, req, res, next) => {
  // Record error metrics
  MetricsCollector.increment('errors.total', 1, {
    type: err.name || 'UnknownError',
    path: req.route?.path || req.path,
    method: req.method,
    statusCode: err.statusCode || 500
  });
  
  // Log error details
  Logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    correlationId: req.correlationId
  });
  
  next(err);
};

// Rate limit monitoring
export const rateLimitMonitoring = (req, res, next) => {
  const originalStatus = res.status;
  
  res.status = function(code) {
    if (code === 429) {
      MetricsCollector.increment('rate_limit.hits', 1, {
        path: req.route?.path || req.path,
        ip: req.ip
      });
    }
    return originalStatus.call(this, code);
  };
  
  next();
};

// User activity monitoring
export const userActivityMonitoring = (req, res, next) => {
  if (req.user) {
    MetricsCollector.increment('user.requests', 1, {
      userId: req.user.id,
      tier: req.user.tier || 'free'
    });
    
    // Track unique active users
    MetricsCollector.gauge(`user.last_seen.${req.user.id}`, Date.now());
  }
  
  next();
};