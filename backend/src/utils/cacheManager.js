class CacheManager {
  constructor() {
    this.caches = new Map();
    this.maxSize = 1000; // Max entries per cache
    this.maxAge = 30 * 60 * 1000; // 30 minutes default TTL
  }

  createCache(name, options = {}) {
    const cache = {
      data: new Map(),
      maxSize: options.maxSize || this.maxSize,
      maxAge: options.maxAge || this.maxAge,
      hits: 0,
      misses: 0,
      created: Date.now()
    };
    
    this.caches.set(name, cache);
    console.log(`📦 Cache '${name}' created (max: ${cache.maxSize}, ttl: ${cache.maxAge}ms)`);
    
    return cache;
  }

  get(cacheName, key) {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;
    
    const entry = cache.data.get(key);
    if (!entry) {
      cache.misses++;
      return null;
    }
    
    // Check expiration
    if (Date.now() - entry.timestamp > cache.maxAge) {
      cache.data.delete(key);
      cache.misses++;
      return null;
    }
    
    cache.hits++;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  set(cacheName, key, value) {
    let cache = this.caches.get(cacheName);
    if (!cache) {
      cache = this.createCache(cacheName);
    }
    
    // Check size limit
    if (cache.data.size >= cache.maxSize) {
      this.evictOldest(cache);
    }
    
    cache.data.set(key, {
      value,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  evictOldest(cache) {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of cache.data) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      cache.data.delete(oldestKey);
    }
  }

  cleanup() {
    let totalCleaned = 0;
    
    for (const [name, cache] of this.caches) {
      const before = cache.data.size;
      const now = Date.now();
      
      // Remove expired entries
      for (const [key, entry] of cache.data) {
        if (now - entry.timestamp > cache.maxAge) {
          cache.data.delete(key);
        }
      }
      
      const cleaned = before - cache.data.size;
      totalCleaned += cleaned;
      
      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired entries from cache '${name}'`);
      }
    }
    
    return totalCleaned;
  }

  clear(cacheName) {
    const cache = this.caches.get(cacheName);
    if (cache) {
      const size = cache.data.size;
      cache.data.clear();
      console.log(`🗑️ Cleared cache '${cacheName}' (${size} entries)`);
      return size;
    }
    return 0;
  }

  clearAll() {
    let totalCleared = 0;
    for (const [name] of this.caches) {
      totalCleared += this.clear(name);
    }
    return totalCleared;
  }

  getStats() {
    const stats = {};
    
    for (const [name, cache] of this.caches) {
      const hitRate = cache.hits + cache.misses > 0 
        ? ((cache.hits / (cache.hits + cache.misses)) * 100).toFixed(2)
        : '0.00';
      
      stats[name] = {
        size: cache.data.size,
        maxSize: cache.maxSize,
        hits: cache.hits,
        misses: cache.misses,
        hitRate: `${hitRate}%`,
        age: Date.now() - cache.created
      };
    }
    
    return stats;
  }
}

export const cacheManager = new CacheManager();
