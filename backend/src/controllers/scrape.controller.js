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
   * Get LeetCode user statistics
   */
  getLeetCodeStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchLeetCodeData(username);
    
    sendSuccess(res, data, `LeetCode data fetched for ${username}`);
  });

  /**
   * Get Codeforces user statistics
   */
  getCodeforcesStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchCodeforcesData(username);
    
    sendSuccess(res, data, `Codeforces data fetched for ${username}`);
  });

  /**
   * Get CodeChef user statistics
   */
  getCodeChefStats = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const platformService = ServiceRegistry.getPlatformService();
    const data = await platformService.fetchCodeChefData(username);
    
    sendSuccess(res, data, `CodeChef data fetched for ${username}`);
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