import ServiceRegistry from '../services/serviceRegistry.js';
import { sendSuccess } from '../utils/response.helper.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { MESSAGES } from '../constants/app.constants.js';

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
    const userId = req.user?.id; // Get user ID if authenticated
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchLeetCodeData(username, userId);
    
    sendSuccess(res, data, `LeetCode data fetched for ${username}`);
  });

  /**
   * Get Codeforces user statistics with real-time updates
   */
  getCodeforcesStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id; // Get user ID if authenticated
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchCodeforcesData(username, userId);
    
    sendSuccess(res, data, `Codeforces data fetched for ${username}`);
  });

  /**
   * Get CodeChef user statistics with real-time updates
   */
  getCodeChefStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id; // Get user ID if authenticated
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchCodeChefData(username, userId);
    
    sendSuccess(res, data, `CodeChef data fetched for ${username}`);
  });

  /**
   * Get AtCoder user statistics with real-time updates
   */
  getAtCoderStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchAtCoderData(username, userId);
    
    sendSuccess(res, data, `AtCoder data fetched for ${username}`);
  });

  /**
   * Get GitHub user statistics with real-time updates
   */
  getGitHubStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchGitHubData(username, userId);
    
    sendSuccess(res, data, `GitHub data fetched for ${username}`);
  });

  /**
   * Get SkillRack user statistics with real-time updates
   */
  getSkillRackStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const userId = req.user?.id;
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchSkillRackData(username, userId);
    
    sendSuccess(res, data, `SkillRack data fetched for ${username}`);
  });

  /**
   * Get list of supported platforms
   */
  getSupportedPlatforms = asyncHandler(async (req, res) => {
    const platformService = ServiceRegistry.getPlatformService();
    const platforms = platformService.getSupportedPlatforms();
    
    sendSuccess(res, { platforms }, 'Supported platforms retrieved');
  });
}

export default new ScrapeController();