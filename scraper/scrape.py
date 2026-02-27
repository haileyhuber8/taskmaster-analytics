"""
Taskmaster UK Data Scraper
Scrapes contestant profiles and season data from taskmaster.info.
Outputs JSON files to ../data/
"""

import json
import os
import re
import sys
import time
from typing import Any

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://taskmaster.info"
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DELAY = 2.5  # seconds between requests
HOST_IDS = {19, 32}  # Greg Davies, Alex Horne

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://taskmaster.info/",
})


def fetch_page(path: str, retries: int = 3) -> BeautifulSoup:
    url = f"{BASE_URL}/{path}" if not path.startswith("http") else path
    print(f"  Fetching: {url}")
    for attempt in range(retries):
        try:
            resp = session.get(url, timeout=30)
            resp.raise_for_status()
            time.sleep(DELAY)
            return BeautifulSoup(resp.text, "html.parser")
        except Exception as e:
            wait = DELAY * (2 ** (attempt + 1))
            print(f"    Retry {attempt+1}/{retries} after {wait}s: {e}")
            time.sleep(wait)
    raise Exception(f"Failed to fetch {url} after {retries} retries")


def safe_int(val: str, default: int = 0) -> int:
    try:
        return int(re.sub(r"[^\d-]", "", val.strip()))
    except (ValueError, AttributeError):
        return default


def safe_float(val: str, default: float = 0.0) -> float:
    try:
        return float(val.strip().replace(",", "").replace("%", ""))
    except (ValueError, AttributeError):
        return default


def get_stat(soup: BeautifulSoup, label: str) -> str:
    """Get a top-level stat value by its label text."""
    label_div = soup.find("div", class_="statsLabel", string=re.compile(re.escape(label), re.I))
    if label_div:
        number_div = label_div.find_next_sibling("div", class_="statsNumber")
        if not number_div:
            parent = label_div.find_parent()
            if parent:
                number_div = parent.find("div", class_="statsNumber")
        if number_div:
            return number_div.get_text(strip=True)
    return ""


def parse_task_breakdown(soup: BeautifulSoup) -> dict:
    """Parse the task breakdown tables from a contestant's person page."""
    breakdown = {
        "format": {},
        "setting": {},
        "activity": {},
        "judgement": {}
    }

    # Map section headers to our category names
    section_map = {
        "Assignment Type": "format",
        "Task Format": "setting",
        "Activity Type": "activity",
        "Judgment Type": "judgement",
    }

    # Map row labels to our keys
    label_map = {
        "solo": "solo", "team": "team", "split": "split", "tie-break": "tiebreak",
        "prize": "prize", "filmed": "filmed", "homework": "homework", "live": "live",
        "creative": "creative", "mental": "mental", "physical": "physical", "social": "social",
        "objective": "objective", "subjective": "subjective", "combination": "combo",
    }

    sections = soup.find_all("div", class_="statsTasksSubSection")
    for section in sections:
        header = section.find("div", class_="statsTasksByCategoryHeader")
        if not header:
            continue
        header_text = header.get_text(strip=True)
        category = section_map.get(header_text)
        if not category:
            continue

        table = section.find("table", class_="peopleStatsTable")
        if not table:
            continue

        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 6:
                continue

            label_cell = cells[1]
            label_text = label_cell.get_text(strip=True).lower()
            key = label_map.get(label_text)
            if not key:
                continue

            attempted = safe_int(cells[2].get_text(strip=True))
            won = safe_int(cells[3].get_text(strip=True))
            win_pct = safe_float(cells[4].get_text(strip=True))
            ppt = safe_float(cells[5].get_text(strip=True))

            breakdown[category][key] = {
                "attempted": attempted,
                "won": won,
                "winPct": win_pct,
                "ppt": ppt
            }

    return breakdown


def scrape_contestant_profile(contestant_id: int) -> dict:
    """Scrape a full contestant profile from person.php."""
    soup = fetch_page(f"person.php?id={contestant_id}")
    profile: dict[str, Any] = {"id": contestant_id}

    # Extract stats
    profile["seasonWins"] = safe_int(get_stat(soup, "Season Wins"))
    profile["episodes"] = safe_int(get_stat(soup, "Episodes"))
    profile["episodeWins"] = safe_int(get_stat(soup, "Episode Wins"))
    profile["episodeWinPct"] = safe_float(get_stat(soup, "Episode Win %"))
    profile["basePoints"] = safe_int(get_stat(soup, "Base Points"))
    profile["bonusPoints"] = safe_int(get_stat(soup, "Bonus Points"))
    profile["pointsDeducted"] = safe_int(get_stat(soup, "Points Deducted"))
    profile["totalPoints"] = safe_int(get_stat(soup, "Total Points"))
    profile["pointsPerEpisode"] = safe_float(get_stat(soup, "Points per Episode"))
    profile["tasksAttempted"] = safe_int(get_stat(soup, "Tasks Attempted"))
    profile["tasksWon"] = safe_int(get_stat(soup, "Tasks Won"))
    profile["taskWinPct"] = safe_float(get_stat(soup, "Task Win %"))
    profile["pointsPerTask"] = safe_float(get_stat(soup, "Points per Task"))
    profile["dqs"] = safe_int(get_stat(soup, "DQs"))

    # Parse task breakdowns
    profile["taskBreakdown"] = parse_task_breakdown(soup)

    return profile


def scrape_season(season_id: int) -> dict:
    """Scrape season page for contestant list and metadata."""
    soup = fetch_page(f"season.php?id={season_id}")
    season: dict[str, Any] = {"id": season_id, "seriesNumber": season_id}

    # Extract year from page text
    text = soup.get_text()
    year_match = re.search(r"(\d{4})", text)
    season["year"] = safe_int(year_match.group(1)) if year_match else 0

    # Episode count
    ep_stat = get_stat(soup, "Episodes")
    season["episodeCount"] = safe_int(ep_stat) if ep_stat else 0

    # Find contestants (class='contestant') vs hosts (class='host')
    season["contestants"] = []
    contestant_divs = soup.find_all("div", class_="contestant")
    # Some season pages use "contestantAlt" class instead
    if not contestant_divs:
        contestant_divs = soup.find_all("div", class_="contestantAlt")
    for div in contestant_divs:
        link = div.find("a", href=re.compile(r"person\.php\?id=\d+"))
        if link:
            match = re.search(r"id=(\d+)", link["href"])
            if match:
                cid = int(match.group(1))
                if cid in HOST_IDS:
                    continue
                name = div.find("p", class_="personName")
                name_text = name.get_text(strip=True) if name else link.get_text(strip=True)
                if cid not in {c["id"] for c in season["contestants"]}:
                    season["contestants"].append({"id": cid, "name": name_text})

    # Try to find winner from notes text
    season["winner"] = None
    notes_text = text
    win_match = re.search(r"(\w[\w\s'-]+?)\s+won\s+this\s+series", notes_text)
    if win_match:
        winner_name = win_match.group(1).strip()
        for c in season["contestants"]:
            if winner_name.lower() in c["name"].lower():
                season["winner"] = c
                break

    return season


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    print("=" * 60)
    print("TASKMASTER UK DATA SCRAPER")
    print("=" * 60)

    # Check for existing partial data to resume
    seasons_file = os.path.join(DATA_DIR, "seasons.json")
    contestants_file = os.path.join(DATA_DIR, "contestants.json")

    # All UK regular series site IDs (from taskmaster.info/show.php?id=1)
    UK_SEASON_IDS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 32, 38, 48, 55, 56, 73, 74, 75, 76, 77]

    # Step 1: Scrape all UK season pages to get contestant IDs
    print("\n[1/3] Scraping season pages...")
    seasons = []
    if os.path.exists(seasons_file):
        with open(seasons_file, "r", encoding="utf-8") as f:
            existing = json.load(f)
        existing_ids = {s["id"] for s in existing}
        if all(sid in existing_ids for sid in UK_SEASON_IDS) and all(s.get("contestants") for s in existing if s["id"] in set(UK_SEASON_IDS)):
            print(f"  Loaded {len(existing)} seasons from cache")
            seasons = existing

    if not seasons:
        all_contestant_ids = {}
        for sid in UK_SEASON_IDS:
            print(f"\n  Season (site id={sid}):")
            try:
                season = scrape_season(sid)
                seasons.append(season)
                for c in season["contestants"]:
                    if c["id"] not in HOST_IDS:
                        all_contestant_ids[c["id"]] = c["name"]
                print(f"    Contestants: {[c['name'] for c in season['contestants']]}")
                if season.get("winner"):
                    print(f"    Winner: {season['winner']['name']}")
            except Exception as e:
                print(f"    ERROR: {e}")
                seasons.append({"id": sid, "seriesNumber": sid, "contestants": [], "error": str(e)})
        # Save partial progress
        with open(seasons_file, "w", encoding="utf-8") as f:
            json.dump(seasons, f, indent=2, ensure_ascii=False)

    # Collect all contestant IDs from seasons
    all_contestant_ids = {}
    for s in seasons:
        for c in s.get("contestants", []):
            if c["id"] not in HOST_IDS:
                all_contestant_ids[c["id"]] = c["name"]
    print(f"\nTotal unique contestants: {len(all_contestant_ids)}")

    # Step 2: Scrape each contestant's profile
    print(f"\n[2/3] Scraping {len(all_contestant_ids)} contestant profiles...")
    # Load existing contestants to resume
    existing_contestants = {}
    if os.path.exists(contestants_file):
        with open(contestants_file, "r", encoding="utf-8") as f:
            for c in json.load(f):
                if "error" not in c and c.get("episodes", 0) > 0:
                    existing_contestants[c["id"]] = c

    contestants = []
    for i, (cid, name) in enumerate(sorted(all_contestant_ids.items())):
        if cid in existing_contestants:
            print(f"  [{i+1}/{len(all_contestant_ids)}] {name} (cached)")
            contestants.append(existing_contestants[cid])
            continue

        print(f"\n  [{i+1}/{len(all_contestant_ids)}] {name} (id={cid})")
        try:
            profile = scrape_contestant_profile(cid)
            profile["name"] = name
            profile["seasonIds"] = [s["seriesNumber"] for s in seasons
                                    if any(c["id"] == cid for c in s.get("contestants", []))]
            contestants.append(profile)
        except Exception as e:
            print(f"    ERROR: {e}")
            contestants.append({"id": cid, "name": name, "error": str(e), "seasonIds": []})

        # Save progress every 10 contestants
        if (i + 1) % 10 == 0:
            with open(contestants_file, "w", encoding="utf-8") as f:
                json.dump(contestants, f, indent=2, ensure_ascii=False)
            print(f"  [Progress saved: {len(contestants)} contestants]")

    # Step 3: Build analysis
    print("\n[3/3] Building analysis...")
    analysis = build_analysis(contestants, seasons)

    # Save data
    print("\nSaving data files...")
    with open(os.path.join(DATA_DIR, "contestants.json"), "w", encoding="utf-8") as f:
        json.dump(contestants, f, indent=2, ensure_ascii=False)
    print(f"  Saved contestants.json ({len(contestants)} contestants)")

    with open(os.path.join(DATA_DIR, "seasons.json"), "w", encoding="utf-8") as f:
        json.dump(seasons, f, indent=2, ensure_ascii=False)
    print(f"  Saved seasons.json ({len(seasons)} seasons)")

    with open(os.path.join(DATA_DIR, "analysis.json"), "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print(f"  Saved analysis.json")

    print("\n" + "=" * 60)
    print("SCRAPING COMPLETE!")
    print("=" * 60)


def build_analysis(contestants: list[dict], seasons: list[dict]) -> dict:
    """Build pre-computed analysis from contestant data."""
    valid = [c for c in contestants if "error" not in c and c.get("episodes", 0) >= 5]
    winners = [c for c in valid if c.get("seasonWins", 0) > 0]
    non_winners = [c for c in valid if c.get("seasonWins", 0) == 0]

    def avg(group, key, default=0):
        vals = [c.get(key, default) for c in group if c.get(key, default) != 0]
        return round(sum(vals) / len(vals), 2) if vals else 0

    def avg_breakdown(group, category, task_type, metric="ppt"):
        vals = []
        for c in group:
            bd = c.get("taskBreakdown", {}).get(category, {}).get(task_type, {})
            if bd and metric in bd:
                vals.append(bd[metric])
        return round(sum(vals) / len(vals), 2) if vals else 0

    def build_group_stats(group, label):
        return {
            "count": len(group),
            "avgPointsPerTask": avg(group, "pointsPerTask"),
            "avgPointsPerEpisode": avg(group, "pointsPerEpisode"),
            "avgEpisodeWinPct": avg(group, "episodeWinPct"),
            "avgTaskWinPct": avg(group, "taskWinPct"),
            "byTaskType": {
                "prize": avg_breakdown(group, "setting", "prize"),
                "filmed": avg_breakdown(group, "setting", "filmed"),
                "live": avg_breakdown(group, "setting", "live"),
                "homework": avg_breakdown(group, "setting", "homework"),
            },
            "byActivity": {
                "creative": avg_breakdown(group, "activity", "creative"),
                "mental": avg_breakdown(group, "activity", "mental"),
                "physical": avg_breakdown(group, "activity", "physical"),
                "social": avg_breakdown(group, "activity", "social"),
            },
            "byJudgement": {
                "objective": avg_breakdown(group, "judgement", "objective"),
                "subjective": avg_breakdown(group, "judgement", "subjective"),
                "combo": avg_breakdown(group, "judgement", "combo"),
            },
            "byFormat": {
                "solo": avg_breakdown(group, "format", "solo"),
                "team": avg_breakdown(group, "format", "team"),
            }
        }

    analysis = {
        "totalContestants": len(valid),
        "totalSeasons": len(seasons),
        "winners": build_group_stats(winners, "winners"),
        "nonWinners": build_group_stats(non_winners, "nonWinners"),
        "seasonWinners": [],
    }

    # Add per-season winner details
    for s in seasons:
        if s.get("winner"):
            winner_data = next((c for c in contestants if c["id"] == s["winner"]["id"]), None)
            if winner_data and "error" not in winner_data:
                analysis["seasonWinners"].append({
                    "season": s["seriesNumber"],
                    "name": s["winner"]["name"],
                    "id": s["winner"]["id"],
                    "totalPoints": winner_data.get("totalPoints", 0),
                    "pointsPerTask": winner_data.get("pointsPerTask", 0),
                    "episodeWinPct": winner_data.get("episodeWinPct", 0),
                })

    return analysis


if __name__ == "__main__":
    main()
