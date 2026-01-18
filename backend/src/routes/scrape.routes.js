import express from 'express';
import ScrapeController from '../controllers/scrape.controller.js';
import { validateUsername } from '../middlewares/validation.middleware.js';
import { scrapingLimiter } from '../middlewares/rateLimiter.middleware.js';
import { platformCache, userCache } from '../middlewares/cache.middleware.js';
import { auditLogger } from '../middlewares/audit.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/scrape/leetcode/:username
 * @desc    Get LeetCode user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/leetcode/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_LEETCODE_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getLeetCodeStats
);

/**
 * @route   GET /api/scrape/codeforces/:username
 * @desc    Get Codeforces user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/codeforces/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_CODEFORCES_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getCodeforcesStats
);

/**
 * @route   GET /api/scrape/codechef/:username
 * @desc    Get CodeChef user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/codechef/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_CODECHEF_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getCodeChefStats
);

/**
 * @route   GET /api/scrape/atcoder/:username
 * @desc    Get AtCoder user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/atcoder/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_ATCODER_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getAtCoderStats
);

/**
 * @route   GET /api/scrape/github/:username
 * @desc    Get GitHub user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/github/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_GITHUB_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getGitHubStats
);

/**
 * @route   GET /api/scrape/skillrack/:username
 * @desc    Get SkillRack user statistics
 * @access  Public (rate limited + cached + audited)
 */
router.get(
  '/skillrack/:username',
  scrapingLimiter,
  validateUsername,
  auditLogger('FETCH_SKILLRACK_STATS'),
  platformCache, // 15 minutes cache
  ScrapeController.getSkillRackStats
);

/**
 * @route   GET /api/scrape/platforms
 * @desc    Get list of supported platforms
 * @access  Public (cached)
 */
router.get(
  '/platforms', 
  platformCache, // 15 minutes cache
  ScrapeController.getSupportedPlatforms
);

export default router;