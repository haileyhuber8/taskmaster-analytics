"""
Clean and enrich the scraped data:
1. Filter to UK-only contestants
2. Create accurate UK season data with winners
3. Map site season IDs to actual UK series numbers
"""

import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Site season ID -> UK Series mapping (based on contestant analysis)
# The site includes specials and international shows in its season IDs
UK_SEASONS = {
    # site_season_id: { series_number, year, winner_name, winner_id, episode_count }
    1: {"series": 1, "year": 2015, "winner": "Josh Widdicombe", "winnerId": 69, "episodes": 6},
    2: {"series": 2, "year": 2016, "winner": "Jon Richardson", "winnerId": 49, "episodes": 5},
    3: {"series": 3, "year": 2016, "winner": "Rob Beckett", "winnerId": 8, "episodes": 5},
    4: {"series": 4, "year": 2017, "winner": "Noel Fielding", "winnerId": 21, "episodes": 8},
    5: {"series": 5, "year": 2017, "winner": "Bob Mortimer", "winnerId": 42, "episodes": 8},
    # site S6 = Champion of Champions 1 (skip)
    7: {"series": 6, "year": 2018, "winner": "Liza Tarbuck", "winnerId": 59, "episodes": 10},
    8: {"series": 7, "year": 2018, "winner": "Kerry Godliman", "winnerId": 26, "episodes": 10},
    9: {"series": 8, "year": 2019, "winner": "Lou Sanders", "winnerId": 54, "episodes": 10},
    # site S10 = Champion of Champions 2 or New Year Treat (skip)
    11: {"series": 10, "year": 2020, "winner": "Richard Herring", "winnerId": 31, "episodes": 10},
}

# Non-UK contestant IDs to exclude (Norwegian/Danish shows)
NON_UK_IDS = {
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124,  # Norwegian
    143, 144, 145, 146, 147,  # Danish
}

# Known UK contestants with their actual series numbers
# For contestants from series 9-21 that we may have missed due to site structure
ADDITIONAL_UK_CONTESTANTS_SERIES = {
    # Series 9 (2019): Ed Gamble (winner), David Baddiel, Jo Brand, Katy Wix, Rose Matafeo
    # Series 10 (2020): Richard Herring (winner), Daisy May Cooper, Johnny Vegas, Katherine Parkinson, Mawaan Rizwan
    # Series 11 (2021): Sarah Kendall (winner), Charlotte Ritchie, Jamali Maddix, Lee Mack, Mike Wozniak
    # Series 12 (2021): Morgana Robinson (winner), Alan Davies, Desiree Burch, Guz Khan, Victoria Coren Mitchell
    # Series 13 (2022): Sophie Duker (winner), Ardal O'Hanlon, Bridget Christie, Chris Ramsey, Judi Love
    # Series 14 (2022): Dara Ó Briain (winner), Fern Brady, John Kearns, Munya Chawawa, Sarah Millican
    # Series 15 (2023): Mae Martin (winner), Frankie Boyle, Ivo Graham, Jenny Eclair, Kiell Smith-Bynoe
    # Series 16 (2023): Sam Campbell (winner), Julian Clary, Lucy Beaumont, Sue Perkins, Susan Wokoma
    # Series 17 (2024): John Robins (winner), Joanne McNally, Nick Mohammed, Rachael Stirling, Steve Pemberton
    # Series 18 (2024): Jack Dee (winner), Andy Zaltzman, Babatunde Aléshé, Emma Sidi, Rosie Jones
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

        season_entry = {
            "seriesNumber": info["series"],
            "year": info["year"],
            "episodes": info["episodes"],
            "contestants": contestants_in_season,
            "winner": {
                "id": info["winnerId"],
                "name": info["winner"]
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
