import fs from "fs";
import path from "path";
import { Contestant, Season, Analysis } from "../types";

const DATA_DIR = path.join(__dirname, "..", "..", "..", "data");

let contestants: Contestant[] = [];
let seasons: Season[] = [];
let analysis: Analysis | null = null;

export function loadData(): void {
  contestants = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "contestants.json"), "utf-8")
  );
  seasons = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "seasons.json"), "utf-8")
  );
  analysis = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, "analysis.json"), "utf-8")
  );
  console.log(
    `Loaded ${contestants.length} contestants, ${seasons.length} seasons`
  );
}

export function getContestants(): Contestant[] {
  return contestants;
}

export function getContestant(id: number): Contestant | undefined {
  return contestants.find((c) => c.id === id);
}

export function getSeasons(): Season[] {
  return seasons;
}

export function getSeason(num: number): Season | undefined {
  return seasons.find((s) => s.seriesNumber === num);
}

export function getAnalysis(): Analysis | null {
  return analysis;
}

export function getDataSummary(): string {
  const winnerNames = seasons.map((s) => `S${s.seriesNumber}: ${s.winner.name}`).join(", ");

  const topContestants = [...contestants]
    .filter((c) => c.episodes >= 5)
    .sort((a, b) => b.pointsPerTask - a.pointsPerTask)
    .slice(0, 10)
    .map((c) => `${c.name} (PpT: ${c.pointsPerTask}, S${c.seasonIds.join(",")})`)
    .join("; ");

  const a = analysis!;
  return `
TASKMASTER UK DATA SUMMARY
===========================
Total UK Contestants: ${a.totalContestants}
Total Seasons Covered: ${a.totalSeasons}
Season Winners: ${winnerNames}

WINNER VS NON-WINNER STATS:
Winners (${a.winners.count}): Avg PpT=${a.winners.avgPointsPerTask}, Avg PpE=${a.winners.avgPointsPerEpisode}, Ep Win%=${a.winners.avgEpisodeWinPct}%
  Prize Tasks: ${a.winners.byTaskType.prize}, Filmed: ${a.winners.byTaskType.filmed}, Live: ${a.winners.byTaskType.live}
  Creative: ${a.winners.byActivity.creative}, Mental: ${a.winners.byActivity.mental}, Physical: ${a.winners.byActivity.physical}, Social: ${a.winners.byActivity.social}
Non-Winners (${a.nonWinners.count}): Avg PpT=${a.nonWinners.avgPointsPerTask}, Avg PpE=${a.nonWinners.avgPointsPerEpisode}, Ep Win%=${a.nonWinners.avgEpisodeWinPct}%
  Prize Tasks: ${a.nonWinners.byTaskType.prize}, Filmed: ${a.nonWinners.byTaskType.filmed}, Live: ${a.nonWinners.byTaskType.live}
  Creative: ${a.nonWinners.byActivity.creative}, Mental: ${a.nonWinners.byActivity.mental}, Physical: ${a.nonWinners.byActivity.physical}, Social: ${a.nonWinners.byActivity.social}

TOP 10 BY POINTS PER TASK:
${topContestants}

FULL CONTESTANT DATA:
${contestants.filter(c => c.episodes >= 5).map(c => {
  const bd = c.taskBreakdown;
  return `${c.name} (S${c.seasonIds.join(",")}): PpT=${c.pointsPerTask}, PpE=${c.pointsPerEpisode}, EpWin%=${c.episodeWinPct}%, SeasonWins=${c.seasonWins}, ` +
    `Prize=${bd.setting?.prize?.ppt || 0}, Filmed=${bd.setting?.filmed?.ppt || 0}, Live=${bd.setting?.live?.ppt || 0}, ` +
    `Creative=${bd.activity?.creative?.ppt || 0}, Mental=${bd.activity?.mental?.ppt || 0}, Physical=${bd.activity?.physical?.ppt || 0}, Social=${bd.activity?.social?.ppt || 0}, ` +
    `Objective=${bd.judgement?.objective?.ppt || 0}, Subjective=${bd.judgement?.subjective?.ppt || 0}`;
}).join("\n")}
`.trim();
}
