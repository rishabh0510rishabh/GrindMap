export function normalizeCodeChef(data) {
  return {
    platform: 'codechef',
    username: data.username,
    rating: data.data.rating || 0,
    problem_fully_solved: data.data.problemsSolved || 0,
    global_rank: data.data.globalRank || null,
    country_rank: data.data.countryRank || null,
    total_stars: data.data.stars || 0
  };
}
