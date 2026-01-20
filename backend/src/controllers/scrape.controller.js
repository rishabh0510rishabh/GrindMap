import ServiceRegistry from '../services/serviceRegistry.js';
import { sendSuccess, sendError } from '../utils/response.helper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { MESSAGES } from '../constants/app.constants.js';
import InputValidator from '../utils/inputValidator.js';
import ScraperErrorHandler from '../utils/scraperErrorHandler.js';
import Logger from '../utils/logger.js';

/**
 * Controller for handling platform scraping requests
 * Uses service registry to avoid circular dependencies
 */
class ScrapeController {
  /**
   * Get LeetCode user statistics with real-time updates
   */
  getLeetCodeStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    
    try {
      // Validate username before processing
      const validatedUsername = InputValidator.validateUsername(username, 'LEETCODE');
      
      const platformService = ServiceRegistry.getPlatformService();
      const data = await platformService.fetchLeetCodeData(validatedUsername, userId);
      
      sendSuccess(res, data, `LeetCode data fetched for ${validatedUsername}`);
    } catch (error) {
      Logger.error('LeetCode controller error', {
        username,
        userId,
        error: error.message
      });
      
      // Send standardized error response
      const statusCode = error.statusCode || 500;
      sendError(res, error.message, statusCode, error.code);
    }
  });

  /**
   * Get Codeforces user statistics with real-time updates
   */
  getCodeforcesStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    
    try {
      const validatedUsername = InputValidator.validateUsername(username, 'CODEFORCES');
      
      const platformService = ServiceRegistry.getPlatformService();
      const data = await platformService.fetchCodeforcesData(validatedUsername, userId);
      
      sendSuccess(res, data, `Codeforces data fetched for ${validatedUsername}`);
    } catch (error) {
      Logger.error('Codeforces controller error', {
        username,
        userId,
        error: error.message
      });
      
      const statusCode = error.statusCode || 500;
      sendError(res, error.message, statusCode, error.code);
    }
  });

  /**
   * Get CodeChef user statistics with real-time updates
   */
  getCodeChefStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    
    try {
      const validatedUsername = InputValidator.validateUsername(username, 'CODECHEF');
      
      const platformService = ServiceRegistry.getPlatformService();
      const data = await platformService.fetchCodeChefData(validatedUsername, userId);
      
      sendSuccess(res, data, `CodeChef data fetched for ${validatedUsername}`);
    } catch (error) {
      Logger.error('CodeChef controller error', {
        username,
        userId,
        error: error.message
      });
      
      const statusCode = error.statusCode || 500;
      sendError(res, error.message, statusCode, error.code);
    }
  });

  /**
   * Get AtCoder user statistics with real-time updates
   */
  getAtCoderStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    
    try {
      const validatedUsername = InputValidator.validateUsername(username, 'ATCODER');
      
      const platformService = ServiceRegistry.getPlatformService();
      const data = await platformService.fetchAtCoderData(validatedUsername, userId);
      
      sendSuccess(res, data, `AtCoder data fetched for ${validatedUsername}`);
    } catch (error) {
      Logger.error('AtCoder controller error', {
        username,
        userId,
        error: error.message
      });
      
      const statusCode = error.statusCode || 500;
      sendError(res, error.message, statusCode, error.code);
    }
  });

  /**
   * Get GitHub user statistics with real-time updates
   */
  getGitHubStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    
    try {
      const validatedUsername = InputValidator.validateUsername(username, 'GITHUB');
      
      const platformService = ServiceRegistry.getPlatformService();
      const data = await platformService.fetchGitHubData(validatedUsername, userId);
      
      sendSuccess(res, data, `GitHub data fetched for ${validatedUsername}`);
    } catch (error) {
      Logger.error('GitHub controller error', {
        username,
        userId,
        error: error.message
      });
      
      const statusCode = error.statusCode || 500;
      sendError(res, error.message, statusCode, error.code);
    }
  });

  /**
   * Get SkillRack user statistics with real-time updates
   */
  getSkillRackStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    
    try {
      const validatedUsername = InputValidator.validateUsername(username, 'SKILLRACK');
      
      const platformService = ServiceRegistry.getPlatformService();
      const data = await platformService.fetchSkillRackData(validatedUsername, userId);
      
      sendSuccess(res, data, `SkillRack data fetched for ${validatedUsername}`);
    } catch (error) {
      Logger.error('SkillRack controller error', {
        username,
        userId,
        error: error.message
      });
      
      const statusCode = error.statusCode || 500;
      sendError(res, error.message, statusCode, error.code);
    }
  });

  /**
   * Get list of supported platforms
   */
  getSupportedPlatforms = asyncHandler(async (req, res) => {
    try {
      const platformService = ServiceRegistry.getPlatformService();
      const platforms = platformService.getSupportedPlatforms();
      
      sendSuccess(res, { platforms }, 'Supported platforms retrieved');
    } catch (error) {
      Logger.error('Get platforms error', { error: error.message });
      sendError(res, 'Failed to retrieve supported platforms', 500);
    }
  });
}

export default new ScrapeController();