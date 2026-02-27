import { useState, useEffect } from "react";
import { fetchContestants, fetchAnalysis } from "../hooks/useData";

interface TaskStat { attempted: number; won: number; winPct: number; ppt: number }
interface Contestant {
  id: number; name: string; seasonIds: number[]; seasonWins: number;
  episodes: number; episodeWins: number; episodeWinPct: number;
  totalPoints: number; pointsPerTask: number; pointsPerEpisode: number;
  tasksAttempted: number; tasksWon: number; taskWinPct: number;
  basePoints: number; bonusPoints: number; pointsDeducted: number; dqs: number;
  taskBreakdown: {
    format: Record<string, TaskStat>;
    setting: Record<string, TaskStat>;
    activity: Record<string, TaskStat>;
    judgement: Record<string, TaskStat>;
  };
}

interface Analysis {
  totalContestants: number;
  totalSeasons: number;
  winners: { count: number; avgPointsPerTask: number; avgPointsPerEpisode: number; avgEpisodeWinPct: number; avgTaskWinPct: number; byTaskType: Record<string, number>; byActivity: Record<string, number>; byJudgement: Record<string, number> };
  nonWinners: { count: number; avgPointsPerTask: number; avgPointsPerEpisode: number; avgEpisodeWinPct: number; avgTaskWinPct: number; byTaskType: Record<string, number>; byActivity: Record<string, number>; byJudgement: Record<string, number> };
  seasonWinners: { season: number; name: string; id: number }[];
}

function computeShowStats(contestants: Contestant[]) {
  // Task makeup by setting (prize/filmed/homework/live)
  const settingTotals: Record<string, number> = {};
  const formatTotals: Record<string, number> = {};
  const activityTotals: Record<string, number> = {};
  const judgementTotals: Record<string, number> = {};
  let totalTasks = 0;
  let totalBonus = 0, totalDeductions = 0, totalDQs = 0;
  let totalEpisodes = 0, totalPoints = 0;

  // Per-season aggregates
  const seasonData: Record<number, { bonus: number; deductions: number; dqs: number; points: number; episodes: number; contestants: number }> = {};

  // Records
  let highestPpT = { name: "", val: 0 };
  let lowestPpT = { name: "", val: Infinity };
  let mostDQs = { name: "", val: 0 };
  let mostEpWins = { name: "", val: 0 };
  let mostTasksWon = { name: "", val: 0 };
  let highestTotal = { name: "", val: 0 };
  let lowestTotal = { name: "", val: Infinity };

  for (const c of contestants) {
    // Aggregates
    totalBonus += c.bonusPoints;
    totalDeductions += c.pointsDeducted;
    totalDQs += c.dqs;
    totalPoints += c.totalPoints;

    // Records
    if (c.pointsPerTask > highestPpT.val) highestPpT = { name: c.name, val: c.pointsPerTask };
    if (c.pointsPerTask < lowestPpT.val) lowestPpT = { name: c.name, val: c.pointsPerTask };
    if (c.dqs > mostDQs.val) mostDQs = { name: c.name, val: c.dqs };
    if (c.episodeWins > mostEpWins.val) mostEpWins = { name: c.name, val: c.episodeWins };
    if (c.tasksWon > mostTasksWon.val) mostTasksWon = { name: c.name, val: c.tasksWon };
    if (c.totalPoints > highestTotal.val) highestTotal = { name: c.name, val: c.totalPoints };
    if (c.totalPoints < lowestTotal.val) lowestTotal = { name: c.name, val: c.totalPoints };

    for (const sId of c.seasonIds) {
      if (!seasonData[sId]) seasonData[sId] = { bonus: 0, deductions: 0, dqs: 0, points: 0, episodes: 0, contestants: 0 };
      seasonData[sId].bonus += c.bonusPoints;
      seasonData[sId].deductions += c.pointsDeducted;
      seasonData[sId].dqs += c.dqs;
      seasonData[sId].points += c.totalPoints;
      seasonData[sId].contestants += 1;
      seasonData[sId].episodes = Math.max(seasonData[sId].episodes, c.episodes);
    }

    // Task breakdowns — divide by 5 (contestants per season) to get unique task counts
    for (const [k, v] of Object.entries(c.taskBreakdown.setting)) {
      settingTotals[k] = (settingTotals[k] || 0) + v.attempted;
    }
    for (const [k, v] of Object.entries(c.taskBreakdown.format)) {
      formatTotals[k] = (formatTotals[k] || 0) + v.attempted;
    }
    for (const [k, v] of Object.entries(c.taskBreakdown.activity)) {
      activityTotals[k] = (activityTotals[k] || 0) + v.attempted;
    }
    for (const [k, v] of Object.entries(c.taskBreakdown.judgement)) {
      judgementTotals[k] = (judgementTotals[k] || 0) + v.attempted;
    }
    totalTasks += c.tasksAttempted;
  }

  // Each task is attempted by 5 contestants, so unique tasks = total / 5
  const uniqueTasks = Math.round(totalTasks / 5);
  for (const seasons of Object.values(seasonData)) {
    totalEpisodes += seasons.episodes;
  }

  // Per-season bonus/dqs for the table
  const seasonStats = Object.entries(seasonData)
    .map(([s, d]) => ({ season: parseInt(s), ...d, avgPpE: +(d.points / (d.episodes * 5)).toFixed(1) }))
    .sort((a, b) => a.season - b.season);

  return {
    settingTotals, formatTotals, activityTotals, judgementTotals,
    uniqueTasks, totalTasks, totalBonus, totalDeductions, totalDQs,
    totalEpisodes, totalPoints,
    seasonStats,
    records: { highestPpT, lowestPpT, mostDQs, mostEpWins, mostTasksWon, highestTotal, lowestTotal },
  };
}

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAnalysis(), fetchContestants()]).then(([a, c]) => {
      setAnalysis(a);
      setContestants(c);
      setLoading(false);
    });
  }, []);

  if (loading || !analysis) return <div className="loading"><div className="spinner" /> Loading insights...</div>;

  const w = analysis.winners;
  const nw = analysis.nonWinners;
  const stats = computeShowStats(contestants);

  const divBy5 = (totals: Record<string, number>) => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(totals)) out[k] = Math.round(v / 5);
    return out;
  };
  const settingTasks = divBy5(stats.settingTotals);
  const formatTasks = divBy5(stats.formatTotals);
  const activityTasks = divBy5(stats.activityTotals);
  const settingTotal = Object.values(settingTasks).reduce((a, b) => a + b, 0);
  const formatTotal = Object.values(formatTasks).reduce((a, b) => a + b, 0);
  const activityTotal = Object.values(activityTasks).reduce((a, b) => a + b, 0);

  const settingLabels: Record<string, string> = { prize: "🎁 Prize", filmed: "🎬 Filmed", homework: "📝 Homework", live: "🎤 Live" };
  const formatLabels: Record<string, string> = { solo: "👤 Solo", team: "👥 Team", split: "✂️ Split", tiebreak: "⚡ Tiebreak" };
  const activityLabels: Record<string, string> = { creative: "🎨 Creative", mental: "🧠 Mental", physical: "💪 Physical", social: "🗣️ Social" };

  return (
    <div>
      <div className="card">
        <h2>🏆 Taskmaster UK — By The Numbers</h2>
        <div className="stat-grid">
          <div className="stat-item"><div className="stat-value">{analysis.totalContestants}</div><div className="stat-label">Contestants</div></div>
          <div className="stat-item"><div className="stat-value">{analysis.totalSeasons}</div><div className="stat-label">Series</div></div>
          <div className="stat-item"><div className="stat-value">{stats.totalEpisodes}</div><div className="stat-label">Episodes</div></div>
          <div className="stat-item"><div className="stat-value">{stats.uniqueTasks}</div><div className="stat-label">Tasks</div></div>
          <div className="stat-item"><div className="stat-value">{stats.totalDQs}</div><div className="stat-label">Disqualifications</div></div>
          <div className="stat-item"><div className="stat-value">{stats.totalBonus}</div><div className="stat-label">Bonus Points Awarded</div></div>
        </div>
      </div>

      <div className="insight-grid">
        <div className="card">
          <h2>Winners vs Non-Winners</h2>
          <table className="comparison-table">
            <thead><tr><th>Metric</th><th>Winners</th><th>Non-Winners</th><th>Edge</th></tr></thead>
            <tbody>
              <CompRow label="Points per Task" w={w.avgPointsPerTask} nw={nw.avgPointsPerTask} />
              <CompRow label="Points per Episode" w={w.avgPointsPerEpisode} nw={nw.avgPointsPerEpisode} />
              <CompRow label="Episode Win %" w={w.avgEpisodeWinPct} nw={nw.avgEpisodeWinPct} suffix="%" />
              <CompRow label="Task Win %" w={w.avgTaskWinPct} nw={nw.avgTaskWinPct} suffix="%" />
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Task Type Performance</h2>
          <table className="comparison-table">
            <thead><tr><th>Task Type</th><th>Winners</th><th>Non-Winners</th><th>Edge</th></tr></thead>
            <tbody>
              <CompRow label="🎁 Prize" w={w.byTaskType.prize} nw={nw.byTaskType.prize} />
              <CompRow label="🎬 Filmed" w={w.byTaskType.filmed} nw={nw.byTaskType.filmed} />
              <CompRow label="🎤 Live" w={w.byTaskType.live} nw={nw.byTaskType.live} />
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Activity Type Performance</h2>
          <table className="comparison-table">
            <thead><tr><th>Activity</th><th>Winners</th><th>Non-Winners</th><th>Edge</th></tr></thead>
            <tbody>
              <CompRow label="🎨 Creative" w={w.byActivity.creative} nw={nw.byActivity.creative} />
              <CompRow label="🧠 Mental" w={w.byActivity.mental} nw={nw.byActivity.mental} />
              <CompRow label="💪 Physical" w={w.byActivity.physical} nw={nw.byActivity.physical} />
              <CompRow label="🗣️ Social" w={w.byActivity.social} nw={nw.byActivity.social} />
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>📋 Task Makeup — By Setting</h2>
          <table className="comparison-table">
            <thead><tr><th>Setting</th><th>Tasks</th><th>% of Total</th></tr></thead>
            <tbody>
              {Object.entries(settingTasks)
                .sort(([,a],[,b]) => b - a)
                .map(([k, v]) => (
                  <tr key={k}>
                    <td>{settingLabels[k] || k}</td>
                    <td><strong>{v}</strong></td>
                    <td>{((v / settingTotal) * 100).toFixed(1)}%</td>
                  </tr>
              ))}
            </tbody>
          </table>
          <BarChart data={settingTasks} labels={settingLabels} total={settingTotal} />
        </div>

        <div className="card">
          <h2>👥 Task Makeup — By Format</h2>
          <table className="comparison-table">
            <thead><tr><th>Format</th><th>Tasks</th><th>% of Total</th></tr></thead>
            <tbody>
              {Object.entries(formatTasks)
                .sort(([,a],[,b]) => b - a)
                .map(([k, v]) => (
                  <tr key={k}>
                    <td>{formatLabels[k] || k}</td>
                    <td><strong>{v}</strong></td>
                    <td>{((v / formatTotal) * 100).toFixed(1)}%</td>
                  </tr>
              ))}
            </tbody>
          </table>
          <BarChart data={formatTasks} labels={formatLabels} total={formatTotal} />
        </div>

        <div className="card">
          <h2>🎯 Task Makeup — By Activity</h2>
          <table className="comparison-table">
            <thead><tr><th>Activity</th><th>Tasks</th><th>% of Total</th></tr></thead>
            <tbody>
              {Object.entries(activityTasks)
                .sort(([,a],[,b]) => b - a)
                .map(([k, v]) => (
                  <tr key={k}>
                    <td>{activityLabels[k] || k}</td>
                    <td><strong>{v}</strong></td>
                    <td>{((v / activityTotal) * 100).toFixed(1)}%</td>
                  </tr>
              ))}
            </tbody>
          </table>
          <BarChart data={activityTasks} labels={activityLabels} total={activityTotal} />
        </div>

        <div className="card card-full">
          <h2>📊 Season-by-Season Stats</h2>
          <table className="comparison-table" style={{ tableLayout: "auto" }}>
            <thead><tr><th>Series</th><th>Eps</th><th>Bonus</th><th>Deductions</th><th>DQs</th><th>Avg PpE</th></tr></thead>
            <tbody>
              {stats.seasonStats.map((s) => (
                <tr key={s.season}>
                  <td>S{s.season}</td>
                  <td>{s.episodes}</td>
                  <td>{s.bonus}</td>
                  <td>{s.deductions}</td>
                  <td>{s.dqs}</td>
                  <td><strong>{s.avgPpE}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>🎖️ All-Time Records</h2>
          <table className="comparison-table">
            <thead><tr><th>Record</th><th>Contestant</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>🔥 Highest PpT</td><td><strong>{stats.records.highestPpT.name}</strong></td><td>{stats.records.highestPpT.val}</td></tr>
              <tr><td>📉 Lowest PpT</td><td><strong>{stats.records.lowestPpT.name}</strong></td><td>{stats.records.lowestPpT.val}</td></tr>
              <tr><td>⭐ Most Points</td><td><strong>{stats.records.highestTotal.name}</strong></td><td>{stats.records.highestTotal.val}</td></tr>
              <tr><td>😬 Fewest Points</td><td><strong>{stats.records.lowestTotal.name}</strong></td><td>{stats.records.lowestTotal.val}</td></tr>
              <tr><td>🏅 Most Tasks Won</td><td><strong>{stats.records.mostTasksWon.name}</strong></td><td>{stats.records.mostTasksWon.val}</td></tr>
              <tr><td>📺 Most Episode Wins</td><td><strong>{stats.records.mostEpWins.name}</strong></td><td>{stats.records.mostEpWins.val}</td></tr>
              <tr><td>🚫 Most DQs</td><td><strong>{stats.records.mostDQs.name}</strong></td><td>{stats.records.mostDQs.val}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, labels, total }: { data: Record<string, number>; labels: Record<string, string>; total: number }) {
  const sorted = Object.entries(data).sort(([,a],[,b]) => b - a);
  const max = sorted[0]?.[1] || 1;
  const colors = ["#790000", "#a1663c", "#CC0000", "#44250a", "#8a7a60"];
  return (
    <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      {sorted.map(([k, v], i) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ width: "110px", fontSize: "0.75rem", textAlign: "right", flexShrink: 0 }}>
            {(labels[k] || k).replace(/^[^\s]+\s/, "")}
          </span>
          <div style={{ flex: 1, background: "var(--tm-cream-dark)", borderRadius: "3px", height: "18px", overflow: "hidden" }}>
            <div style={{
              width: `${(v / max) * 100}%`,
              height: "100%",
              background: colors[i % colors.length],
              borderRadius: "3px",
              transition: "width 0.5s",
            }} />
          </div>
          <span style={{ fontSize: "0.75rem", width: "40px", flexShrink: 0 }}>
            {((v / total) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function CompRow({ label, w, nw, suffix = "" }: { label: string; w: number; nw: number; suffix?: string }) {
  const edge = w - nw;
  const fmt = (n: number) => Number.isInteger(n) ? n.toString() : n.toFixed(2);
  const edgeStr = edge > 0 ? `+${fmt(edge)}${suffix}` : `${fmt(edge)}${suffix}`;
  return (
    <tr>
      <td>{label}</td>
      <td><strong>{fmt(w)}{suffix}</strong></td>
      <td>{fmt(nw)}{suffix}</td>
      <td className={edge > 0 ? "highlight-better" : "highlight-worse"}>{edgeStr}</td>
    </tr>
  );
}
