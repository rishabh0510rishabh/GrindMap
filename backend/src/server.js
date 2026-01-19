import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import connectDB from './config/db.js';
import { corsOptions } from './config/cors.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import { securityHeaders } from './middlewares/security.middleware.js';
import { requestLogger, securityMonitor } from './middlewares/logging.middleware.js';
import { sanitizeInput } from './middlewares/validation.middleware.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import { correlationId } from './middlewares/correlationId.middleware.js';
import { performanceMetrics } from './middlewares/performance.middleware.js';
import { distributedRateLimit, botDetection, geoSecurityCheck, securityAudit, abuseDetection } from './middlewares/advancedSecurity.middleware.js';
import { autoRefresh } from './middlewares/jwtManager.middleware.js';
import { globalErrorBoundary } from './middlewares/errorBoundary.middleware.js';
import DistributedSessionManager from './utils/distributedSessionManager.js';
import WebSocketManager from './utils/websocketManager.js';
import BatchProcessingService from './services/batchProcessing.service.js';

// Import routes
import scrapeRoutes from './routes/scrape.routes.js';
import authRoutes from './routes/auth.routes.js';
import cacheRoutes from './routes/cache.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import securityRoutes from './routes/security.routes.js';

// Import constants
import { HTTP_STATUS, ENVIRONMENTS } from './constants/app.constants.js';
import Logger from './utils/logger.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;

// Initialize global error boundary
globalErrorBoundary();

// Connect to database
connectDB();

// Initialize WebSocket server
WebSocketManager.initialize(server);

// Start batch processing scheduler
BatchProcessingService.startScheduler();

// Request tracking and monitoring (first)
app.use(correlationId);
app.use(performanceMetrics);

// Distributed session management
app.use(DistributedSessionManager.middleware());

// Security middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(securityMonitor);

// Advanced security middleware
app.use(distributedRateLimit);
app.use(botDetection);
app.use(geoSecurityCheck);
app.use(securityAudit);
app.use(abuseDetection);
app.use(autoRefresh);

// Distributed rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

// Passport Middleware
app.use(passport.initialize());
configurePassport();

// Health check endpoint
app.get('/health', (req, res) => {
  Logger.info('Health check accessed', { correlationId: req.correlationId });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    correlationId: req.correlationId,
    sessionActive: !!req.session,
    websocketClients: WebSocketManager.getClientsCount()
  });
});

// API routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/security', securityRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'GrindMap API v1.0',
    documentation: '/api/docs',
    endpoints: {
      scraping: '/api/scrape',
      authentication: '/api/auth',
      cache: '/api/cache',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
      websocket: '/ws',
      health: '/health',
    },
    correlationId: req.correlationId
  });
});

// 404 handler for undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Global error handlers for unhandled promises and exceptions
process.on('unhandledRejection', (err) => {
  Logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  Logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    Logger.info('Process terminated');
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      Logger.info('Server started', {
        port: PORT,
        environment: NODE_ENV,
        healthCheck: `http://localhost:${PORT}/health`,
        websocket: `ws://localhost:${PORT}/ws`,
        features: ['distributed-rate-limiting', 'distributed-sessions', 'real-time-updates']
      });
    });
  } catch (error) {
    Logger.error('Failed to connect to database', error);
    process.exit(1);
  }
};

startServer();

export default app;