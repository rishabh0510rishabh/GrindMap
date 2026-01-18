import { scrapeLeetCode } from './scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from './scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from './scraping/codechef.scraper.js';
import { fetchAtCoderStats } from './scraping/atcoder.scraper.js';
import { scrapeGitHub } from './scraping/github.scraper.js';
import { fetchSkillRackStats } from './scraping/skillrack.scraper.js';
import { normalizeCodeforces } from './normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from './normalization/codechef.normalizer.js';
import { PLATFORMS, MESSAGES } from '../constants/app.constants.js';
import { AppError, ERROR_CODES } from '../utils/appError.js';
import redis from '../config/redis.js';
import config from '../config/env.js';
import DataChangeEmitter from '../utils/dataChangeEmitter.js';

/**
 * Platform scraping service - handles all platform data fetching
 * NO DIRECT SERVICE DEPENDENCIES - uses DI container
 */
class PlatformService {
  constructor(container = null) {
    this.container = container;
  }

  /**
   * Fetch user data from LeetCode with caching and real-time updates
   */
  async fetchLeetCodeData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.LEETCODE}:${username}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const data = await scrapeLeetCode(username);
      const result = {
        platform: PLATFORMS.LEETCODE,
        username,
        ...data,
      };
      
      // Cache for configured TTL (15 minutes)
      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);
      
      // Emit real-time update
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.LEETCODE, username, result, userId);
      }
      
      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: LeetCode`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from Codeforces with caching and real-time updates
   */
  async fetchCodeforcesData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.CODEFORCES}:${username}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const rawData = await fetchCodeforcesStats(username);
      const normalizedData = normalizeCodeforces({ ...rawData, username });
      
      const result = {
        platform: PLATFORMS.CODEFORCES,
        username,
        ...normalizedData,
      };
      
      // Cache for configured TTL (15 minutes)
      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);
      
      // Emit real-time update
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.CODEFORCES, username, result, userId);
      }
      
      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: Codeforces`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from CodeChef with caching and real-time updates
   */
  async fetchCodeChefData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.CODECHEF}:${username}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const rawData = await fetchCodeChefStats(username);
      const normalizedData = normalizeCodeChef({ ...rawData, username });
      
      const result = {
        platform: PLATFORMS.CODECHEF,
        username,
        ...normalizedData,
      };
      
      // Cache for configured TTL (15 minutes)
      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);
      
      // Emit real-time update
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.CODECHEF, username, result, userId);
      }
      
      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: CodeChef`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from AtCoder with caching and real-time updates
   */
  async fetchAtCoderData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.ATCODER}:${username}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const data = await fetchAtCoderStats(username);
      const result = {
        platform: PLATFORMS.ATCODER,
        username,
        ...data,
      };
      
      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);
      
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.ATCODER, username, result, userId);
      }
      
      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: AtCoder`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from GitHub with caching and real-time updates
   */
  async fetchGitHubData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.GITHUB}:${username}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const data = await scrapeGitHub(username);
      const result = {
        platform: PLATFORMS.GITHUB,
        username,
        ...data,
      };
      
      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);
      
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.GITHUB, username, result, userId);
      }
      
      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: GitHub`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Fetch user data from SkillRack with caching and real-time updates
   */
  async fetchSkillRackData(username, userId = null) {
    const cacheKey = `platform:${PLATFORMS.SKILLRACK}:${username}`;
    
    const cached = await redis.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, fromCache: true };
    }

    try {
      const data = await fetchSkillRackStats(username);
      const result = {
        platform: PLATFORMS.SKILLRACK,
        username,
        ...data,
      };
      
      await redis.set(cacheKey, JSON.stringify(result), config.CACHE_PLATFORM_TTL);
      
      if (userId) {
        DataChangeEmitter.emitPlatformUpdate(PLATFORMS.SKILLRACK, username, result, userId);
      }
      
      return result;
    } catch (error) {
      throw new AppError(
        `${MESSAGES.SCRAPING_FAILED}: SkillRack`,
        500,
        ERROR_CODES.SCRAPING_ERROR
      );
    }
  }

  /**
   * Get supported platforms list
   */
  getSupportedPlatforms() {
    return Object.values(PLATFORMS);
  }

  /**
   * Invalidate cache for user
   */
  async invalidateUserCache(username) {
    const platforms = Object.values(PLATFORMS);
    const promises = platforms.map(platform => {
      const cacheKey = `platform:${platform}:${username}`;
      return redis.del(cacheKey);
    });
    
    await Promise.all(promises);
  }

  /**
   * Get activity service (lazy loaded)
   */
  getActivityService() {
    return this.container?.get('activityService');
  }
}

export default PlatformService;