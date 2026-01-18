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
import DistributedSessionManager from './utils/distributedSessionManager.js';
import WebSocketManager from './utils/websocketManager.js';

// Import routes
import scrapeRoutes from './routes/scrape.routes.js';
import authRoutes from './routes/auth.routes.js';
import cacheRoutes from './routes/cache.routes.js';

// Import constants
import { HTTP_STATUS, ENVIRONMENTS } from './constants/app.constants.js';
import Logger from './utils/logger.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5002;
const NODE_ENV = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;

// Connect to database
connectDB();

// Initialize WebSocket server
WebSocketManager.initialize(server);

// Request tracking and monitoring (first)
app.use(correlationId);
app.use(performanceMetrics);

// Distributed session management
app.use(DistributedSessionManager.middleware());

// Security middleware
app.use(securityHeaders);
app.use(requestLogger);
app.use(securityMonitor);

// Distributed rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Input sanitization
app.use(sanitizeInput);

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
server.listen(PORT, () => {
  Logger.info('Server started', {
    port: PORT,
    environment: NODE_ENV,
    healthCheck: `http://localhost:${PORT}/health`,
    websocket: `ws://localhost:${PORT}/ws`,
    features: ['distributed-rate-limiting', 'distributed-sessions', 'real-time-updates']
  });
});

export default app;