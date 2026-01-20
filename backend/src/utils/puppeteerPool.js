import puppeteer from 'puppeteer';
import Logger from './logger.js';

class PuppeteerPool {
  constructor() {
    this.browsers = new Map();
    this.maxBrowsers = 2;
    this.pageTimeout = 30000;
    this.browserTimeout = 300000;
  }

  async getBrowser() {
    await this.cleanupExpiredBrowsers();
    
    for (const [browser, info] of this.browsers) {
      if (info.pages < 5 && browser.isConnected()) {
        info.lastUsed = Date.now();
        info.pages++;
        return browser;
      }
    }
    
    if (this.browsers.size < this.maxBrowsers) {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
        timeout: 10000
      });
      
      this.browsers.set(browser, {
        created: Date.now(),
        lastUsed: Date.now(),
        pages: 1
      });
      
      return browser;
    }
    
    throw new Error('Browser pool exhausted');
  }

  async createPage(browser) {
    const page = await browser.newPage();
    await page.setDefaultTimeout(this.pageTimeout);
    
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    return page;
  }

  async closePage(page) {
    try {
      if (page && !page.isClosed()) {
        await page.close();
        
        for (const [browser, info] of this.browsers) {
          if (page.browser() === browser) {
            info.pages = Math.max(0, info.pages - 1);
            break;
          }
        }
      }
    } catch (error) {
      Logger.error('Error closing page', { error: error.message });
    }
  }

  async cleanupExpiredBrowsers() {
    const now = Date.now();
    const toClose = [];
    
    for (const [browser, info] of this.browsers) {
      if (now - info.lastUsed > this.browserTimeout || info.pages === 0) {
        toClose.push(browser);
      }
    }
    
    for (const browser of toClose) {
      await this.closeBrowser(browser);
    }
  }

  async closeBrowser(browser) {
    try {
      if (browser && browser.isConnected()) {
        await browser.close();
      }
      this.browsers.delete(browser);
    } catch (error) {
      Logger.error('Error closing browser', { error: error.message });
    }
  }

  async closeAll() {
    const closePromises = Array.from(this.browsers.keys()).map(browser => 
      this.closeBrowser(browser)
    );
    
    await Promise.allSettled(closePromises);
    this.browsers.clear();
  }
}

export const puppeteerPool = new PuppeteerPool();

process.on('SIGINT', async () => {
  await puppeteerPool.closeAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await puppeteerPool.closeAll();
  process.exit(0);
});

setInterval(() => {
  puppeteerPool.cleanupExpiredBrowsers();
}, 60000);