export interface TaskBreakdownEntry {
  attempted: number;
  won: number;
  winPct: number;
  ppt: number;
}

export interface TaskBreakdown {
  format: Record<string, TaskBreakdownEntry>;
  setting: Record<string, TaskBreakdownEntry>;
  activity: Record<string, TaskBreakdownEntry>;
  judgement: Record<string, TaskBreakdownEntry>;
}

export interface Contestant {
  id: number;
  name: string;
  seasonIds: number[];
  seasonWins: number;
  episodes: number;
  episodeWins: number;
  episodeWinPct: number;
  basePoints: number;
  bonusPoints: number;
  pointsDeducted: number;
  totalPoints: number;
  pointsPerEpisode: number;
  tasksAttempted: number;
  tasksWon: number;
  taskWinPct: number;
  pointsPerTask: number;
  dqs: number;
  taskBreakdown: TaskBreakdown;
}

export interface SeasonContestant {
  id: number;
  name: string;
  totalPoints: number;
  pointsPerTask: number;
  episodeWinPct: number;
}

export interface Season {
  seriesNumber: number;
  year: number;
  episodes: number;
  contestants: SeasonContestant[];
  winner: { id: number; name: string };
}

export interface GroupStats {
  count: number;
  avgPointsPerTask: number;
  avgPointsPerEpisode: number;
  avgEpisodeWinPct: number;
  avgTaskWinPct: number;
  byTaskType: Record<string, number>;
  byActivity: Record<string, number>;
  byJudgement: Record<string, number>;
}

export interface Analysis {
  totalContestants: number;
  totalSeasons: number;
  winners: GroupStats;
  nonWinners: GroupStats;
  seasonWinners: { season: number; name: string; id: number }[];
  keyInsights: string[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}
