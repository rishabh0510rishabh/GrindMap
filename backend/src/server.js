import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { scrapeLeetCode } from './services/scraping/leetcode.scraper.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { auditLogger, securityAudit } from './middlewares/audit.middleware.js';
import { injectionProtection } from './middlewares/injection.middleware.js';
import { xssProtection } from './middlewares/xss.middleware.js';
import { monitoringMiddleware } from './middlewares/monitoring.middleware.js';
import { memoryMiddleware } from './middlewares/memory.middleware.js';
import { cpuProtection, heavyOperationProtection } from './middlewares/cpuProtection.middleware.js';
import { responseSizeLimit, compressionBombProtection, healthSizeLimit, auditSizeLimit, securitySizeLimit, scrapingSizeLimit } from './middlewares/responseLimit.middleware.js';
import { validateContentType, healthBodyLimit, auditBodyLimit, securityBodyLimit, scrapingBodyLimit, validateJSONStructure } from './middlewares/bodyLimit.middleware.js';
import { maliciousPayloadDetection, requestSizeTracker, parseTimeLimit } from './middlewares/requestParsing.middleware.js';
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
import { memoryMonitor } from './services/memoryMonitor.service.js';
import { cpuMonitor } from './services/cpuMonitor.service.js';
import { bandwidthMonitor } from './services/bandwidthMonitor.service.js';
import { processLimiter } from './utils/processLimiter.js';
import { cacheManager } from './utils/cacheManager.js';
import { gracefulShutdown } from './utils/shutdown.util.js';
import { authBypassProtection, validateToken } from './middlewares/auth.middleware.js';
import { fileUploadSecurity, validateFileExtensions, detectEncodedFiles } from './middlewares/fileUpload.middleware.js';
import { apiVersionSecurity, deprecationWarning, validateApiEndpoint, versionRateLimit } from './middlewares/apiVersion.middleware.js';
import { csrfProtection, csrfTokenEndpoint } from './middlewares/csrf.middleware.js';

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
app.use(securityHeaders);
app.use(generalLimiter);
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

// CSRF token endpoint
app.get('/api/csrf-token', csrfTokenEndpoint);

app.get('/api/leetcode/:username', 
  scrapingBodyLimit,
  scrapingSizeLimit,
  scrapingTimeout,
  heavyOperationProtection,
  scrapingLimiter, 
  csrfProtection,
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
  csrfProtection,
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
  csrfProtection,
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

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
