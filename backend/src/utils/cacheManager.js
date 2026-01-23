import Redis from 'ioredis';

class CacheManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.initRedis();
  }

  initRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Redis connected');
      });

      this.redis.on('error', (err) => {
        this.isConnected = false;
        console.warn('⚠️ Redis unavailable, using fallback');
      });
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, caching disabled');
    }
  }

  async get(key) {
    if (!this.isConnected || !this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  async set(key, data, ttlSeconds = 300) {
    if (!this.isConnected || !this.redis) return;
    
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      // Fail silently
    }
  }

  async del(key) {
    if (!this.isConnected || !this.redis) return;
    
    try {
      await this.redis.del(key);
    } catch (error) {
      // Fail silently
    }
  }

  generateKey(platform, username) {
    return `platform:${platform}:${username}`;
  }
}

export default new CacheManager();