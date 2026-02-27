"""
Clean and enrich the scraped data:
1. Filter to UK-only contestants
2. Create accurate UK season data with winners
3. Map site season IDs to actual UK series numbers
"""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Site season ID -> UK Series mapping (from taskmaster.info/show.php?id=1)
UK_SEASONS = {
    # site_season_id: { series_number, year, winner_name, episode_count }
    1:  {"series": 1,  "year": 2015, "winner": "Josh Widdicombe",   "episodes": 6},
    2:  {"series": 2,  "year": 2016, "winner": "Jon Richardson",     "episodes": 5},
    3:  {"series": 3,  "year": 2016, "winner": "Rob Beckett",        "episodes": 5},
    4:  {"series": 4,  "year": 2017, "winner": "Noel Fielding",      "episodes": 8},
    5:  {"series": 5,  "year": 2017, "winner": "Bob Mortimer",       "episodes": 8},
    7:  {"series": 6,  "year": 2018, "winner": "Liza Tarbuck",       "episodes": 10},
    8:  {"series": 7,  "year": 2018, "winner": "Kerry Godliman",     "episodes": 10},
    9:  {"series": 8,  "year": 2019, "winner": "Lou Sanders",        "episodes": 10},
    10: {"series": 9,  "year": 2019, "winner": "Ed Gamble",          "episodes": 10},
    11: {"series": 10, "year": 2020, "winner": "Richard Herring",    "episodes": 10},
    32: {"series": 11, "year": 2021, "winner": "Sarah Kendall",      "episodes": 10},
    38: {"series": 12, "year": 2021, "winner": "Morgana Robinson",   "episodes": 10},
    48: {"series": 13, "year": 2022, "winner": "Sophie Duker",       "episodes": 10},
    55: {"series": 14, "year": 2022, "winner": "Dara",               "episodes": 10},
    56: {"series": 15, "year": 2023, "winner": "Mae Martin",         "episodes": 10},
    73: {"series": 16, "year": 2023, "winner": "Sam Campbell",       "episodes": 10},
    74: {"series": 17, "year": 2024, "winner": "John Robins",        "episodes": 10},
    75: {"series": 18, "year": 2024, "winner": "Jack Dee",           "episodes": 10},
    76: {"series": 19, "year": 2025, "winner": "Rosie Ramsey",       "episodes": 10},
    77: {"series": 20, "year": 2025, "winner": "Maisie Adam",        "episodes": 10},
}

# Non-UK contestant IDs to exclude (hosts + international shows)
NON_UK_IDS = {
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124,  # Norwegian
    143, 144, 145, 146, 147,  # Danish
}


def main():
    with open(os.path.join(DATA_DIR, "contestants.json"), "r", encoding="utf-8") as f:
        contestants = json.load(f)

    with open(os.path.join(DATA_DIR, "seasons.json"), "r", encoding="utf-8") as f:
        raw_seasons = json.load(f)

    # Filter out non-UK contestants
    uk_contestants = [c for c in contestants if c["id"] not in NON_UK_IDS]
    print(f"Filtered {len(contestants)} -> {len(uk_contestants)} UK contestants")

    # Fix season IDs on contestant profiles
    site_to_series = {}
    for site_id, info in UK_SEASONS.items():
        site_to_series[site_id] = info["series"]

    for c in uk_contestants:
        old_seasons = c.get("seasonIds", [])
        c["seasonIds"] = [site_to_series.get(s, s) for s in old_seasons]

    # Build clean UK seasons data
    uk_seasons = []
    for site_id, info in sorted(UK_SEASONS.items()):
        season_data = next((s for s in raw_seasons if s["id"] == site_id), None)
        contestants_in_season = []
        winner_id = None
        if season_data:
            for sc in season_data.get("contestants", []):
                contestant = next((c for c in uk_contestants if c["id"] == sc["id"]), None)
                if contestant:
                    contestants_in_season.append({
                        "id": sc["id"],
                        "name": sc["name"],
                        "totalPoints": contestant.get("totalPoints", 0),
                        "pointsPerTask": contestant.get("pointsPerTask", 0),
                        "episodeWinPct": contestant.get("episodeWinPct", 0),
                    })
                # Match winner by name (partial match for names like "Dara")
                if info["winner"].lower() in sc["name"].lower():
                    winner_id = sc["id"]

        if winner_id is None and contestants_in_season:
            # Fallback: pick contestant with most total points
            winner_id = max(contestants_in_season, key=lambda c: c["totalPoints"])["id"]
            winner_name = next(c["name"] for c in contestants_in_season if c["id"] == winner_id)
            print(f"  Warning: Winner '{info['winner']}' not matched for Series {info['series']}, using top scorer: {winner_name}")

        winner_name = info["winner"]
        if winner_id:
            matched = next((c["name"] for c in contestants_in_season if c["id"] == winner_id), winner_name)
            winner_name = matched

        season_entry = {
            "seriesNumber": info["series"],
            "year": info["year"],
            "episodes": info["episodes"],
            "contestants": contestants_in_season,
            "winner": {
                "id": winner_id or 0,
                "name": winner_name
            }
        }
        uk_seasons.append(season_entry)

    # Rebuild analysis with clean data
    analysis = build_analysis(uk_contestants, uk_seasons)

    # Save cleaned data
    with open(os.path.join(DATA_DIR, "contestants.json"), "w", encoding="utf-8") as f:
        json.dump(uk_contestants, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(uk_contestants)} UK contestants")

    with open(os.path.join(DATA_DIR, "seasons.json"), "w", encoding="utf-8") as f:
        json.dump(uk_seasons, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(uk_seasons)} UK seasons")

    with open(os.path.join(DATA_DIR, "analysis.json"), "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print("Saved analysis.json")


def build_analysis(contestants, seasons):
    valid = [c for c in contestants if "error" not in c and c.get("episodes", 0) >= 5]
    winners = [c for c in valid if c.get("seasonWins", 0) > 0]
    non_winners = [c for c in valid if c.get("seasonWins", 0) == 0]

    def avg(group, key):
        vals = [c.get(key, 0) for c in group if c.get(key, 0) != 0]
        return round(sum(vals) / len(vals), 2) if vals else 0

    def avg_bd(group, cat, key, metric="ppt"):
        vals = []
        for c in group:
            bd = c.get("taskBreakdown", {}).get(cat, {}).get(key, {})
            if bd and metric in bd and bd[metric] > 0:
                vals.append(bd[metric])
        return round(sum(vals) / len(vals), 2) if vals else 0

    def stats(group):
        return {
            "count": len(group),
            "avgPointsPerTask": avg(group, "pointsPerTask"),
            "avgPointsPerEpisode": avg(group, "pointsPerEpisode"),
            "avgEpisodeWinPct": avg(group, "episodeWinPct"),
            "avgTaskWinPct": avg(group, "taskWinPct"),
            "byTaskType": {
                "prize": avg_bd(group, "setting", "prize"),
                "filmed": avg_bd(group, "setting", "filmed"),
                "live": avg_bd(group, "setting", "live"),
            },
            "byActivity": {
                "creative": avg_bd(group, "activity", "creative"),
                "mental": avg_bd(group, "activity", "mental"),
                "physical": avg_bd(group, "activity", "physical"),
                "social": avg_bd(group, "activity", "social"),
            },
            "byJudgement": {
                "objective": avg_bd(group, "judgement", "objective"),
                "subjective": avg_bd(group, "judgement", "subjective"),
                "combo": avg_bd(group, "judgement", "combo"),
            },
        }

    return {
        "totalContestants": len(valid),
        "totalSeasons": len(seasons),
        "winners": stats(winners),
        "nonWinners": stats(non_winners),
        "seasonWinners": [
            {
                "season": s["seriesNumber"],
                "name": s["winner"]["name"],
                "id": s["winner"]["id"],
            }
            for s in seasons
        ],
        "keyInsights": [
            "Comparing season winners vs non-winners across all task categories",
            "Task type performance correlations with series victory",
            "Episode win percentage patterns for champions",
        ],
    }


if __name__ == "__main__":
    main()
