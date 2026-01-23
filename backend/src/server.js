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
import { secureLogger, secureErrorHandler } from './middlewares/secureLogging.middleware.js';
import { validateEnvironment } from './config/environment.js';
import { gracefulShutdown } from './utils/shutdown.util.js';

// Set default NODE_ENV if not provided
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Validate environment on startup
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(auditLogger);
app.use(securityAudit);
app.use(ipFilter);
app.use(ddosProtection);
app.use(burstProtection);
app.use(adaptiveRateLimit);
app.use(injectionProtection);
app.use(xssProtection);
app.use(secureLogger);
app.use(requestLogger);
app.use(securityMonitor);
app.use(securityHeaders);
app.use(generalLimiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(sanitizeInput);

// Audit routes
app.use('/api/audit', strictRateLimit, auditRoutes);

// Security management routes
app.use('/api/security', strictRateLimit, securityRoutes);

app.get('/api/leetcode/:username', 
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

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

gracefulShutdown(server);
