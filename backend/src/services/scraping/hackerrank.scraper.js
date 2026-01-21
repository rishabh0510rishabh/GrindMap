import { puppeteerPool } from '../../utils/puppeteerPool.js';

export async function scrapeHackerRank(username) {
  console.log(`[HackerRank Scraper] Starting scrape for username: "${username}"`);

  const browser = await puppeteerPool.getBrowser();
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const profileUrl = `https://www.hackerrank.com/profile/${username}`;
    console.log(`[HackerRank Scraper] Navigating to: ${profileUrl}`);

    const response = await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log(`[HackerRank Scraper] Response Status: ${response.status()}`);

    if (response.status() === 404) {
      throw new Error('User not found');
    }

    const pageTitle = await page.title();
    console.log(`[HackerRank Scraper] Page Title: ${pageTitle}`);

    if (pageTitle.toLowerCase().includes('page not found')) {
      throw new Error('User not found');
    }

    // Wait for page to stabilize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract badge information using ElementHandles
    const scrapedBadges = [];
    try {
      const badgeElements = await page.$$('.hacker-badge');
      console.log(`[HackerRank Scraper] Found ${badgeElements.length} badge elements`);

      for (const badgeEl of badgeElements) {
        try {
          // Get badge text content
          const text = await badgeEl.evaluate(el => el.innerText);
          const name = text.split('\n')[0].trim() || 'Badge';

          // Extract star count based on level class (gold=5 stars, silver=3 stars, bronze=1 star)
          const stars = await badgeEl.evaluate(el => {
            if (el.querySelector('.level-gold') || el.classList.contains('level-gold')) return 5;
            if (el.querySelector('.level-silver') || el.classList.contains('level-silver'))
              return 3;
            if (el.querySelector('.level-bronze') || el.classList.contains('level-bronze'))
              return 1;
            // Fallback: count actual star elements
            const starElements = el.querySelectorAll('.star, [class*="star"]');
            return starElements.length > 0 ? starElements.length : 3;
          });

          // Determine icon based on badge name
          let icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/problem-solving-gold.svg';
          const lowerName = name.toLowerCase();

          if (lowerName.includes('30 days') || lowerName.includes('days of code')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/30-days-of-code-gold.svg';
          } else if (lowerName.includes('10 days') || lowerName.includes('statistics')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/10-days-of-statistics-gold.svg';
          } else if (lowerName.includes('java')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/java-gold.svg';
          } else if (lowerName.includes('python')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/python-gold.svg';
          } else if (lowerName.includes('c++') || lowerName.includes('cpp')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/cpp-gold.svg';
          } else if (lowerName.includes('sql')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/sql-gold.svg';
          } else if (lowerName.includes('problem solving')) {
            icon = 'https://hrcdn.net/s3_pub/hr-assets/badges/problem-solving-gold.svg';
          }

          scrapedBadges.push({ name, stars, icon });
          console.log(`[HackerRank Scraper] Badge: "${name}" (${stars} stars)`);
        } catch (e) {
          console.log('[HackerRank Scraper] Could not extract badge info:', e.message);
        }
      }
    } catch (e) {
      console.log('[HackerRank Scraper] Could not find badges:', e.message);
    }

    // Fetch submission history by navigating to API endpoint
    let submissionHistory = {};
    let problemsSolved = 0;
    try {
      const historyUrl = `https://www.hackerrank.com/rest/hackers/${username}/submission_histories`;
      const historyResponse = await page.goto(historyUrl, {
        waitUntil: 'networkidle0',
        timeout: 15000,
      });
      const historyText = await historyResponse.text();
      submissionHistory = JSON.parse(historyText);

      // Calculate total solved
      problemsSolved = Object.values(submissionHistory).reduce(
        (acc, val) => acc + (parseInt(val, 10) || 0),
        0
      );
      console.log(
        `[HackerRank Scraper] Submission history: ${Object.keys(submissionHistory).length} days, ${problemsSolved} total solved`
      );
    } catch (e) {
      console.log('[HackerRank Scraper] Could not fetch submission history:', e.message);
    }

    const profileName = pageTitle.split(' - ')[0] || username;

    // Calculate total stars across all badges
    const totalStars = scrapedBadges.reduce((acc, badge) => acc + (badge.stars || 0), 0);

    console.log(
      `[HackerRank Scraper] Complete. Solved: ${problemsSolved}, Badges: ${scrapedBadges.length}, Total Stars: ${totalStars}`
    );

    return {
      platform: 'HACKERRANK',
      username,
      data: {
        name: profileName,
        username: username,
        avatar: '',
        country: '',
        school: '',
        badges: scrapedBadges,
        problemsSolved: problemsSolved,
        totalStars: totalStars,
        contestRating: 0,
        followers: 0,
        created_at: new Date().toISOString(),
        level: 0,
        submissionHistory: submissionHistory,
      },
    };
  } catch (err) {
    console.error('[HackerRank Scraper] ERROR:', err.message);

    if (err.message.includes('User not found')) {
      throw new Error('User not found');
    }
    throw new Error(`Failed to fetch HackerRank data: ${err.message}`);
  } finally {
    await puppeteerPool.closePage(page);
    console.log('[HackerRank Scraper] Page closed');
  }
}
