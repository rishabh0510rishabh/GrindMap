import { puppeteerPool } from '../../utils/puppeteerPool.js';
import Logger from '../../utils/logger.js';

export async function fetchCodeChefStats(username) {
  let page;
  let browser;
  
  try {
    browser = await puppeteerPool.getBrowser();
    page = await puppeteerPool.createPage(browser);
    
    await page.goto(`https://www.codechef.com/users/${username}`, {
      waitUntil: 'networkidle2',
      timeout: 20000
    });
    
    const stats = await Promise.race([
      page.evaluate(() => {
        const ratingElement = document.querySelector('.rating-number');
        const problemsElement = document.querySelector('.problems-solved');
        
        return {
          rating: ratingElement ? parseInt(ratingElement.textContent) : 0,
          problemsSolved: problemsElement ? parseInt(problemsElement.textContent) : 0
        };
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Evaluation timeout')), 15000)
      )
    ]);
    
    return {
      platform: 'CODECHEF',
      username,
      data: stats
    };
  } catch (error) {
    Logger.error('CodeChef scraping failed', { username, error: error.message });
    throw new Error('Failed to fetch CodeChef data');
  } finally {
    if (page) {
      await puppeteerPool.closePage(page);
    }
  }
}