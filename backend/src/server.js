import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import DatabasePoolMonitor from './utils/databasePoolMonitor.js';
import dbManager from './utils/databaseManager.js';
import { corsOptions } from './config/cors.js';
import passport from 'passport';
import configurePassport from './config/passport.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';
import { securityHeaders as helmetHeaders, additionalSecurityHeaders } from './middlewares/security.headers.middleware.js';
import { sanitizeInput, sanitizeMongoQuery, preventParameterPollution } from './middlewares/sanitization.middleware.js';
import { enhancedSecurityHeaders } from './middlewares/enhancedSecurity.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { sanitizeInput as validationSanitize } from './middlewares/validation.middleware.js';
import { advancedRateLimit } from './middlewares/antiBypassRateLimit.middleware.js';
import { correlationId } from './middlewares/correlationId.middleware.js';
import { performanceMetrics } from './middlewares/performance.middleware.js';
import {
  distributedRateLimit,
  botDetection,
  geoSecurityCheck,
  securityAudit,
  abuseDetection
} from './middlewares/advancedSecurity.middleware.js';
import { autoRefresh } from './middlewares/jwtManager.middleware.js';
import { globalErrorBoundary } from './middlewares/errorBoundary.middleware.js';
import DistributedSessionManager from './utils/distributedSessionManager.js';
import WebSocketManager from './utils/websocketManager.js';
import BatchProcessingService from './services/batchProcessing.service.js';
import CacheWarmingService from './utils/cacheWarmingService.js';
import RobustJobQueue from './utils/robustJobQueue.js';
import CronScheduler from './services/cronScheduler.service.js';
import ReliableJobHandlers from './services/reliableJobHandlers.service.js';
import HealthMonitor from './utils/healthMonitor.js';
import AlertManager from './utils/alertManager.js';
import { performanceMonitoring, errorTracking, memoryMonitoring } from './middlewares/monitoring.middleware.js';
import RequestManager from './utils/requestManager.js';
import PuppeteerManager from './utils/puppeteerManager.js';

// Import routes
import scrapeRoutes from './routes/scrape.routes.js';
import authRoutes from './routes/auth.routes.js';
import cacheRoutes from './routes/cache.routes.js';
import advancedCacheRoutes from './routes/advancedCache.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import securityRoutes from './routes/security.routes.js';
import healthRoutes from './routes/health.routes.js';
import { secureLogger, secureErrorHandler } from './middlewares/secureLogging.middleware.js';
import { validateEnvironment } from './config/environment.js';
import { connectionManager } from './utils/connectionManager.js';
import { memoryMonitor } from './services/memoryMonitor.service.js';
import { cpuMonitor } from './services/cpuMonitor.service.js';
import { bandwidthMonitor } from './services/bandwidthMonitor.service.js';
import { processLimiter } from './utils/processLimiter.js';
import { cacheManager } from './utils/cacheManager.js';
import { gracefulShutdown } from './utils/shutdown.util.js';
import { authBypassProtection, validateToken } from './middlewares/auth.middleware.js';
import { fileUploadSecurity, validateFileExtensions, detectEncodedFiles } from './middlewares/fileUpload.middleware.js';
import { apiVersionSecurity, deprecationWarning, validateApiEndpoint, versionRateLimit } from './middlewares/apiVersion.middleware.js';

// Set default NODE_ENV if not provided
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Validate environment on startup
validateEnvironment();

// Start memory monitoring
memoryMonitor.start();

// Start CPU monitoring
cpuMonitor.start();

// Start bandwidth monitoring
bandwidthMonitor.start();

// Set process resource limits
processLimiter.setLimits();

// Setup memory event handlers
memoryMonitor.on('warning', ({ usage, ratio }) => {
  console.warn(`⚠️ Memory warning: ${Math.round(ratio * 100)}% usage`);
});

memoryMonitor.on('critical', ({ usage, ratio }) => {
  console.error(`🚨 Memory critical: ${Math.round(ratio * 100)}% usage`);
  cacheManager.cleanup(); // Clean expired cache entries
});

memoryMonitor.on('emergency', ({ usage, ratio }) => {
  console.error(`💥 Memory emergency: ${Math.round(ratio * 100)}% usage`);
  cacheManager.clearAll(); // Clear all caches
});

// Setup CPU event handlers
cpuMonitor.on('warning', ({ cpuPercent }) => {
  console.warn(`⚠️ CPU warning: ${cpuPercent.toFixed(1)}% usage`);
});

cpuMonitor.on('critical', ({ cpuPercent }) => {
  console.error(`🚨 CPU critical: ${cpuPercent.toFixed(1)}% usage`);
  // Trigger garbage collection to free up resources
  if (global.gc) global.gc();
});

cpuMonitor.on('emergency', ({ cpuPercent }) => {
  console.error(`💥 CPU emergency: ${cpuPercent.toFixed(1)}% usage`);
  // Emergency cleanup
  cacheManager.clearAll();
  if (global.gc) {
    global.gc();
    global.gc(); // Double GC in emergency
  }
});

const app = express();
const PORT = process.env.PORT || 5001;

app.use(auditLogger);
app.use(securityAudit);
app.use(requestSizeTracker);
app.use(cpuProtection);
app.use(memoryMiddleware);
app.use(maliciousPayloadDetection);
app.use(compressionBombProtection);
app.use(responseSizeLimit()); // Default 500KB response limit
app.use(validateContentType());
app.use(timeoutMiddleware()); // Default 30s timeout
app.use(monitoringMiddleware);
app.use(ipFilter);
app.use(ddosProtection);
app.use(burstProtection);
app.use(adaptiveRateLimit);
app.use(injectionProtection);
app.use(xssProtection);
app.use(authBypassProtection);
app.use(validateToken);
app.use(fileUploadSecurity);
app.use(validateFileExtensions);
app.use(detectEncodedFiles);
app.use(apiVersionSecurity);
app.use(deprecationWarning);
app.use(validateApiEndpoint);
app.use(versionRateLimit);
app.use(secureLogger);
app.use(requestLogger);
app.use(securityMonitor);

// Monitoring middleware
app.use(performanceMonitoring);
app.use(memoryMonitoring);

// Advanced security middleware
if (!IS_TEST) {
  app.use(distributedRateLimit);
  app.use(botDetection);
  app.use(geoSecurityCheck);
  app.use(securityAudit);
  app.use(abuseDetection);
}
app.use(autoRefresh);

// Request timeout handling
app.use(apiTimeout);

// API response compression
app.use(apiCompression);

// Anti-bypass rate limiting
app.use(advancedRateLimit);

// CORS configuration
app.use(cors(corsOptions));
app.use(parseTimeLimit()); // 1 second JSON parse limit
app.use(express.json({ limit: '10mb' }));
app.use(validateJSONStructure);
app.use(sanitizeInput);

// Health check routes (no rate limiting for load balancers)
app.use('/health', healthBodyLimit, healthSizeLimit, healthTimeout, healthRoutes);

// Audit routes
app.use('/api/audit', auditBodyLimit, auditSizeLimit, auditTimeout, strictRateLimit, auditRoutes);

// Security management routes
app.use('/api/security', securityBodyLimit, securitySizeLimit, securityTimeout, strictRateLimit, securityRoutes);

app.get('/api/leetcode/:username', 
  scrapingBodyLimit,
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  scrapingLimiter, 
  validateUsername, 
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    
    const data = await backpressureManager.process(() =>
      withTrace(req.traceId, "leetcode.scrape", () =>
        scrapeLeetCode(username)
      )
    );//done
    
    res.json({
      success: true,
      data,
      traceId: req.traceId
    });
  })
);

app.get('/api/codeforces/:username',
  scrapingBodyLimit,
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  validateUsername,
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const raw = await backpressureManager.process(() =>
      withTrace(req.traceId, "codeforces.scrape", () =>
        fetchCodeforcesStats(username)
      )
    );
    const normalized = normalizeCodeforces({ ...raw, username });
    res.json({ success: true, data: normalized, traceId: req.traceId });
  })
);

app.get('/api/codechef/:username',
  scrapingBodyLimit,
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  validateUsername,
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    const raw = await backpressureManager.process(() =>
      withTrace(req.traceId, "codechef.scrape", () =>
        fetchCodeChefStats(username)
      )
    );
    const normalized = normalizeCodeChef({ ...raw, username });
    res.json({ success: true, data: normalized, traceId: req.traceId });
  })
);

app.use(notFound);
app.use(secureErrorHandler);
app.use(errorHandler);

// Start server function
const startServer = async () => {
  try {
    // Initialize services after database connection
    BatchProcessingService.startScheduler();
    CacheWarmingService.startDefaultSchedules();

    // Register job handlers
    JobQueue.registerHandler('scraping', JobHandlers.handleScraping);
    JobQueue.registerHandler('cache_warmup', JobHandlers.handleCacheWarmup);
    JobQueue.registerHandler('analytics', JobHandlers.handleAnalytics);
    JobQueue.registerHandler('notification', JobHandlers.handleNotification);
    JobQueue.registerHandler('cleanup', JobHandlers.handleCleanup);
    JobQueue.registerHandler('export', JobHandlers.handleExport);

    // Start job processing
    JobQueue.startProcessing({ concurrency: 3, types: [] });

    CronScheduler.start();
    HealthMonitor.startMonitoring(30000);

    server.listen(PORT, () => {
      Logger.info('Server started', {
        port: PORT,
        environment: NODE_ENV,
        healthCheck: `http://localhost:${PORT}/health`,
        websocket: `ws://localhost:${PORT}/ws`,
        features: ['distributed-rate-limiting', 'distributed-sessions', 'real-time-updates'],
      });
    });
  } catch (error) {
    console.error('Failed to connect to database FATAL:', error);
    process.exit(1);
  }
};

/**
 * ✅ CHANGE #6 (WRAPPED)
 * Do NOT start listening server during tests.
 */
if (!IS_TEST) {
  startServer();
}

// Setup connection management
const connManager = connectionManager(server);

// Track bandwidth usage
server.on('request', (req, res) => {
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const size = chunk ? Buffer.byteLength(chunk, encoding) : 0;
    bandwidthMonitor.trackUsage(req.ip || req.socket.remoteAddress, size);
    return originalEnd.call(this, chunk, encoding);
  };
});

gracefulShutdown(server, connManager);
