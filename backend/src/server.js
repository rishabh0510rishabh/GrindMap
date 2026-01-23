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
import { enhancedSecurityHeaders } from './middlewares/enhancedSecurity.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { auditLogger, securityAudit } from './middlewares/audit.middleware.js';
import { injectionProtection } from './middlewares/injection.middleware.js';
import { xssProtection } from './middlewares/xss.middleware.js';
import { monitoringMiddleware } from './middlewares/monitoring.middleware.js';
import { timeoutMiddleware, scrapingTimeout, healthTimeout, auditTimeout, securityTimeout } from './middlewares/timeout.middleware.js';
import { adaptiveRateLimit, strictRateLimit, burstProtection, ddosProtection } from './middlewares/ddos.middleware.js';
import { ipFilter } from './utils/ipManager.js';
import { sanitizeInput, validateUsername } from './middlewares/validation.middleware.js';
import { generalLimiter, scrapingLimiter } from './middlewares/rateLimiter.middleware.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { AppError } from './utils/appError.js';
import { fetchCodeforcesStats } from './services/scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from './services/scraping/codechef.scraper.js';
import { normalizeCodeforces } from './services/normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from './services/normalization/codechef.normalizer.js';
import { backpressureManager } from './utils/backpressure.util.js';
import { withTrace } from './utils/serviceTracer.util.js';
import auditRoutes from './routes/audit.routes.js';
import securityRoutes from './routes/security.routes.js';
import healthRoutes from './routes/health.routes.js';
import { secureLogger, secureErrorHandler } from './middlewares/secureLogging.middleware.js';
import { validateEnvironment } from './config/environment.js';
import { connectionManager } from './utils/connectionManager.js';
import { gracefulShutdown } from './utils/shutdown.util.js';

// Set default NODE_ENV if not provided
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Validate environment on startup
validateEnvironment();

const app = express();
const server = createServer(app);
const PORT = config.port;
const NODE_ENV = config.nodeEnv;

/**
 * ✅ CHANGE #1 (ADDED)
 * Detect Jest/test environment so we can skip runtime heavy operations.
 */
const IS_TEST = NODE_ENV === 'test';

// Initialize global error boundary
globalErrorBoundary();

/**
 * ✅ CHANGE #2 (WRAPPED)
 * Connect to DB only when NOT testing.
 */
if (!IS_TEST) {
  connectDB();
}

/**
 * ✅ CHANGE #3 (WRAPPED)
 * Initialize WebSocket server only when NOT testing.
 */
if (!IS_TEST) {
  WebSocketManager.initialize(server);
}

app.use(auditLogger);
app.use(securityAudit);
app.use(timeoutMiddleware()); // Default 30s timeout
app.use(monitoringMiddleware);
app.use(ipFilter);
app.use(ddosProtection);
app.use(burstProtection);
app.use(adaptiveRateLimit);
app.use(injectionProtection);
app.use(xssProtection);
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Health check routes (no rate limiting for load balancers)
app.use('/health', healthTimeout, healthRoutes);

// Audit routes
app.use('/api/audit', auditTimeout, strictRateLimit, auditRoutes);

// Security management routes
app.use('/api/security', securityTimeout, strictRateLimit, securityRoutes);

app.get('/api/leetcode/:username', 
  scrapingTimeout,
  scrapingLimiter, 
  validateUsername, 
  asyncHandler(async (req, res) => {
    const { username } = req.params;
    
    if (!username || username.trim() === '') {
      throw new AppError('Username is required', 400);
    }
    
    const data = await backpressureManager.process(() =>
      withTrace(req.traceId, "leetcode.scrape", () =>
        scrapeLeetCode(username)
      )
    );
    
    res.json({
      success: true,
      data,
      traceId: req.traceId
    });
  })
);

app.get('/api/codeforces/:username',
  scrapingTimeout,
  validateUsername,
  asyncHandler(async (req, res) => {
    const username = req.params.username;
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
  scrapingTimeout,
  validateUsername,
  asyncHandler(async (req, res) => {
    const username = req.params.username;
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

gracefulShutdown(server, connManager);
