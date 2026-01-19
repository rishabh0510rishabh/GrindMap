import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import Logger from './logger.js';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    Logger.info('WebSocket server initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const correlationId = req.headers['x-correlation-id'];
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, message, correlationId);
      } catch (error) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid JSON' 
        }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      Logger.error('WebSocket error', { error: error.message, correlationId });
    });
  }

  /**
   * Handle WebSocket messages
   */
  handleMessage(ws, message, correlationId) {
    const { type, token, data } = message;

    switch (type) {
      case 'auth':
        this.authenticateClient(ws, token, correlationId);
        break;
      case 'subscribe':
        this.subscribeToUpdates(ws, data, correlationId);
        break;
      case 'subscribe_notifications':
        this.subscribeToNotifications(ws, correlationId);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }

  /**
   * Authenticate WebSocket client
   */
  authenticateClient(ws, token, correlationId) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      ws.userId = decoded.id;
      ws.authenticated = true;

      // Add to clients map
      if (!this.clients.has(decoded.id)) {
        this.clients.set(decoded.id, new Set());
      }
      this.clients.get(decoded.id).add(ws);

      ws.send(JSON.stringify({ 
        type: 'auth_success',
        message: 'Authenticated successfully' 
      }));

      Logger.info('WebSocket client authenticated', { 
        userId: decoded.id, 
        correlationId 
      });
    } catch (error) {
      ws.send(JSON.stringify({ 
        type: 'auth_error', 
        message: 'Invalid token' 
      }));
    }
  }

  /**
   * Subscribe client to platform updates
   */
  subscribeToUpdates(ws, data, correlationId) {
    if (!ws.authenticated) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not authenticated' 
      }));
      return;
    }

    const { platforms, username } = data;
    ws.subscriptions = { platforms, username };

    ws.send(JSON.stringify({ 
      type: 'subscription_success',
      message: `Subscribed to ${platforms.join(', ')} for ${username}` 
    }));

    Logger.info('Client subscribed to updates', { 
      userId: ws.userId, 
      platforms, 
      username, 
      correlationId 
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(ws) {
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId).delete(ws);
      if (this.clients.get(ws.userId).size === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  /**
   * Broadcast platform data update to subscribed clients
   */
  broadcastPlatformUpdate(platform, username, data) {
    const message = JSON.stringify({
      type: 'platform_update',
      platform,
      username,
      data,
      timestamp: new Date().toISOString()
    });

    for (const [userId, connections] of this.clients) {
      for (const ws of connections) {
        if (ws.subscriptions && 
            ws.subscriptions.platforms.includes(platform) &&
            ws.subscriptions.username === username) {
          ws.send(message);
        }
      }
    }

    Logger.info('Platform update broadcasted', { platform, username });
  }

  /**
   * Subscribe client to notifications
   */
  subscribeToNotifications(ws, correlationId) {
    if (!ws.authenticated) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Not authenticated' 
      }));
      return;
    }

    ws.notificationsEnabled = true;

    ws.send(JSON.stringify({ 
      type: 'notification_subscription_success',
      message: 'Subscribed to notifications' 
    }));

    Logger.info('Client subscribed to notifications', { 
      userId: ws.userId, 
      correlationId 
    });
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId, notification) {
    const connections = this.clients.get(userId);
    if (connections) {
      const message = JSON.stringify({
        type: 'notification',
        ...notification,
        timestamp: new Date().toISOString()
      });
      
      for (const ws of connections) {
        if (ws.notificationsEnabled) {
          ws.send(message);
        }
      }
    }
  }

  /**
   * Get connected clients count
   */
  getClientsCount() {
    let total = 0;
    for (const connections of this.clients.values()) {
      total += connections.size;
    }
    return total;
  }
}

export default new WebSocketManager();