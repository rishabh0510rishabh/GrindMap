import { puppeteerPool } from '../../utils/puppeteerPool.js';
import CircuitBreaker from '../../utils/circuitBreaker.js';
import RetryManager from '../../utils/retryManager.js';
import ScraperValidator from '../../utils/scraperValidator.js';
import Logger from '../../utils/logger.js';
import redis from '../../config/redis.js';

// Create circuit breaker for CodeChef scraping
const codechefCircuitBreaker = new CircuitBreaker({
  name: 'CodeChef',
  failureThreshold: 3,
  resetTimeout: 120000 // 2 minutes for puppeteer
});

const retryManager = new RetryManager({
  maxRetries: 2,
  baseDelay: 2000,
  maxDelay: 10000
});

export async function fetchCodeChefStats(username) {
  const validatedUsername = ScraperValidator.validateUsername(username, 'CODECHEF');
  const cacheKey = `codechef:${validatedUsername}`;
  
  // Check cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      Logger.debug(`Cache hit for CodeChef user ${validatedUsername}`);
      return { ...JSON.parse(cached), fromCache: true };
    }
  } catch (error) {
    Logger.warn('Cache read error for CodeChef', { error: error.message });
  }
  
  const scrapeData = async () => {
    let page;
    let browser;
    
    try {
      browser = await puppeteerPool.getBrowser();
      page = await puppeteerPool.createPage(browser);
      
      await page.goto(`https://www.codechef.com/users/${validatedUsername}`, {
        waitUntil: 'networkidle2',
        timeout: 20000
      });
      
      // Check if user exists
      const userExists = await page.evaluate(() => {
        return !document.querySelector('.error-message, .not-found');
      });
      
      if (!userExists) {
        throw new Error('User not found');
      }
      
      const stats = await Promise.race([
        page.evaluate(() => {
          const ratingElement = document.querySelector('.rating-number');
          const problemsElement = document.querySelector('.problems-solved');
          
          return {
            rating: ratingElement ? parseInt(ratingElement.textContent) || 0 : 0,
            problemsSolved: problemsElement ? parseInt(problemsElement.textContent) || 0 : 0
          };
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Page evaluation timeout')), 15000)
        )
      ]);
      
      return ScraperValidator.sanitizeResponse(stats);
    } finally {
      if (page) {
        await puppeteerPool.closePage(page);
      }
    }
  };
  
  try {
    const data = await codechefCircuitBreaker.execute(async () => {
      return await retryManager.execute(scrapeData, {
        platform: 'CodeChef',
        username: validatedUsername
      });
    });
    
    const result = {
      platform: 'CODECHEF',
      username: validatedUsername,
      data
    };
    
    // Cache successful result
    try {
      await redis.set(cacheKey, JSON.stringify(result), 600); // 10 minutes
      // Also store as fallback with longer TTL
      await redis.set(`fallback:${cacheKey}`, JSON.stringify(result), 3600); // 1 hour
    } catch (error) {
      Logger.warn('Cache write error for CodeChef', { error: error.message });
    }
    
    return result;
  } catch (error) {
    Logger.error('CodeChef scraping failed', { 
      username: validatedUsername, 
      error: error.message,
      circuitBreakerState: codechefCircuitBreaker.getState()
    });
    
    // Try to return fallback data
    try {
      const fallback = await redis.get(`fallback:${cacheKey}`);
      if (fallback) {
        Logger.info(`Returning fallback data for CodeChef user ${validatedUsername}`);
        return { ...JSON.parse(fallback), fromFallback: true };
      }
    } catch (fallbackError) {
      Logger.warn('Fallback data read error', { error: fallbackError.message });
    }
    
    throw new Error(`Failed to fetch CodeChef data: ${error.message}`);
  }
}