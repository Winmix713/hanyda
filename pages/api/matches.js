import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const { query } = req;

    const filterMatches = (matches, params) => {
        return matches.filter((match) => {
            for (const key in params) {
                const value = params[key];
                switch (key) {
                    case 'team':
                        if (match.home_team.toLowerCase() !== value.toLowerCase() && match.away_team.toLowerCase() !== value.toLowerCase()) return false;
                    case 'date':
                        if (new Date(match.date) < new Date(value)) return false;
                    case 'both_teams_scored':
                        if ((match.score.home > 0 && match.score.away > 0) !== (value === 'true')) return false;
                    default:
                        if (!match[key] || match[key].toLowerCase() !== value.toLowerCase()) return false;
                }
            }
            return true;
        });
    };

    try {
        const jsonFile = path.join(process.cwd(), 'combined_matches.json');
        if (!fs.existsSync(jsonFile)) throw new Error('JSON file not found');
        
        const jsonData = fs.readFileSync(jsonFile, 'utf-8');
        const data = JSON.parse(jsonData);
        const matches = data.matches || [];
        
        const filteredMatches = filterMatches(matches, query);
        filteredMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.status(200).json(filteredMatches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}