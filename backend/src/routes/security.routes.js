import express from 'express';
import { JWTManager } from '../middlewares/jwtManager.middleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    const newTokens = await JWTManager.rotateTokens(refreshToken);
    
    res.json({
      success: true,
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken
    });
  } catch (error) {
    Logger.error('Token refresh failed', { error: error.message });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Security status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    security: {
      rateLimiting: 'active',
      botDetection: 'active',
      geoBlocking: 'active',
      auditLogging: 'active',
      jwtRotation: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// Logout endpoint (revoke refresh token)
router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      await JWTManager.revokeRefreshToken(userId);
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    Logger.error('Logout failed', { error: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;