<?php
function filterMatches($matches, $params) {
    return array_filter($matches, function($match) use ($params) {
        foreach ($params as $key => $value) {
            switch ($key) {
                case 'team':
                    if (strcasecmp($match['home_team'], $value) !== 0 && strcasecmp($match['away_team'], $value) !== 0) return false;
                    break;
                case 'date':
                    $match_date = new DateTime($match['date']);
                    $param_date = new DateTime($value);
                    if ($match_date < $param_date) return false;
                    break;
                case 'both_teams_scored':
                    $both_scored = ($match['score']['home'] > 0 && $match['score']['away'] > 0);
                    if ($both_scored != filter_var($value, FILTER_VALIDATE_BOOLEAN)) return false;
                    break;
                default:
                    if (!isset($match[$key]) || strcasecmp($match[$key], $value) !== 0) return false;
            }
        }
        return true;
    });
}

try {
    $json_file = 'combined_matches.json';
    if (!file_exists($json_file)) throw new Exception("JSON file not found");
    
    $json_data = file_get_contents($json_file);
    if ($json_data === false) throw new Exception("Failed to read JSON file");

    $data = json_decode($json_data, true);
    if (json_last_error() !== JSON_ERROR_NONE) throw new Exception("Invalid JSON: " . json_last_error_msg());

    $matches = $data['matches'] ?? [];
    $params = array_filter(array_map('filter_var', $_GET, array_fill(0, count($_GET), FILTER_SANITIZE_STRING)));

    // Filter matches based on parameters
    $filtered_matches = filterMatches($matches, $params);
    
    // Sort matches by date (newest first)
    usort($filtered_matches, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });

    // Output filtered results
    echo json_encode(array_values($filtered_matches), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>