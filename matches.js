import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { query } = req;

  // Function to filter matches based on parameters
  const filterMatches = (matches, params) => {
    return matches.filter((match) => {
      for (const key in params) {
        const value = params[key];
        switch (key) {
          case 'team':
            if (
              match.home_team.toLowerCase() !== value.toLowerCase() &&
              match.away_team.toLowerCase() !== value.toLowerCase()
            ) {
              return false;
            }
            break;
          case 'date':
            const matchDate = new Date(match.date);
            const paramDate = new Date(value);
            if (matchDate < paramDate) {
              return false;
            }
            break;
          case 'both_teams_scored':
            const bothScored = match.score.home > 0 && match.score.away > 0;
            if (bothScored !== (value === 'true')) {
              return false;
            }
            break;
          default:
            if (
              !match[key] ||
              match[key].toLowerCase() !== value.toLowerCase()
            ) {
              return false;
            }
        }
      }
      return true;
    });
  };

  try {
    // Read and parse JSON file
    const jsonFile = path.join(process.cwd(), 'combined_matches.json');
    if (!fs.existsSync(jsonFile)) {
      throw new Error('JSON file not found');
    }
    const jsonData = fs.readFileSync(jsonFile, 'utf-8');
    const data = JSON.parse(jsonData);
    const matches = data.matches || [];

    // Filter matches based on parameters
    const filteredMatches = filterMatches(matches, query);

    // Sort matches by date (newest first)
    filteredMatches.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Output filtered results
    res.status(200).json(filteredMatches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}