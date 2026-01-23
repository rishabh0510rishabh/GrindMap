import express from 'express';
import { getSystemHealth, checkDependencies, getDetailedMetrics } from '../services/health.service.js';

const router = express.Router();

// Basic health check for load balancers
router.get('/', async (req, res) => {
  try {
    const health = getSystemHealth();
    const dependencies = await checkDependencies();
    
    const hasUnhealthy = dependencies.some(dep => dep.status === 'unhealthy');
    const status = hasUnhealthy ? 'unhealthy' : 'healthy';
    
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      ...health,
      dependencies
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed metrics for monitoring systems
router.get('/metrics', (req, res) => {
  try {
    const metrics = getDetailedMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness probe for Kubernetes
router.get('/ready', async (req, res) => {
  try {
    const dependencies = await checkDependencies();
    const ready = dependencies.every(dep => dep.status !== 'unhealthy');
    
    res.status(ready ? 200 : 503).json({
      ready,
      dependencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe for Kubernetes
router.get('/live', (req, res) => {
  res.json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;