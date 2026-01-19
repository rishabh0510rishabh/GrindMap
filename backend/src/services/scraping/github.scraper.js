import ApiClient from '../../utils/apiClient.js';

// Create GitHub API client with circuit breaker
const githubClient = ApiClient.createGitHubClient();

export async function scrapeGitHub(username) {
  try {
    const response = await githubClient.get(`/users/${username}/events/public`, {
      cacheTTL: 300, // 5 minutes cache
      cacheKey: `github:${username}`
    });
    
    const events = response.data;
    const today = new Date();

    // Count events in the last 7 days (simple activity metric)
    const recentActivity = events.filter(event => {
      const eventDate = new Date(event.created_at);
      const diffDays = (today - eventDate) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    return {
      platform: "GITHUB",
      username,
      data: {
        totalEvents: events.length,
        recentActivityCount: recentActivity.length,
        message: "retrieved",
        status: "success"
      },
      fromCache: response.fromCache,
      fromFallback: response.fromFallback
    };
  } catch (err) {
    return {
      platform: "GITHUB",
      username,
      data: {
        status: "fail",
        message: err.message
      }
    };
  }
}