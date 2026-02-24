import { useState, useEffect } from "react";
import { fetchContestants, fetchAnalysis, fetchSeasons } from "../hooks/useData";

interface Analysis {
  totalContestants: number;
  totalSeasons: number;
  winners: { count: number; avgPointsPerTask: number; avgPointsPerEpisode: number; avgEpisodeWinPct: number; avgTaskWinPct: number; byTaskType: Record<string, number>; byActivity: Record<string, number>; byJudgement: Record<string, number> };
  nonWinners: { count: number; avgPointsPerTask: number; avgPointsPerEpisode: number; avgEpisodeWinPct: number; avgTaskWinPct: number; byTaskType: Record<string, number>; byActivity: Record<string, number>; byJudgement: Record<string, number> };
  seasonWinners: { season: number; name: string; id: number }[];
}

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis().then((data) => { setAnalysis(data); setLoading(false); });
  }, []);

  if (loading || !analysis) return <div className="loading"><div className="spinner" /> Loading insights...</div>;

  const w = analysis.winners;
  const nw = analysis.nonWinners;

  return (
    <div>
      <div className="card">
        <h2>🏆 Taskmaster UK — By The Numbers</h2>
        <div className="stat-grid">
          <div className="stat-item"><div className="stat-value">{analysis.totalContestants}</div><div className="stat-label">Contestants</div></div>
          <div className="stat-item"><div className="stat-value">{analysis.totalSeasons}</div><div className="stat-label">Seasons</div></div>
          <div className="stat-item"><div className="stat-value">{w.count}</div><div className="stat-label">Champions</div></div>
          <div className="stat-item"><div className="stat-value">{w.avgPointsPerTask}</div><div className="stat-label">Avg Winner PpT</div></div>
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
          <h2>🏆 Season Champions</h2>
          <table className="comparison-table">
            <thead><tr><th>Season</th><th>Champion</th></tr></thead>
            <tbody>
              {analysis.seasonWinners.map((sw) => (
                <tr key={sw.season}>
                  <td>Series {sw.season}</td>
                  <td><strong>{sw.name}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompRow({ label, w, nw, suffix = "" }: { label: string; w: number; nw: number; suffix?: string }) {
  const edge = w - nw;
  const edgeStr = edge > 0 ? `+${edge.toFixed(2)}${suffix}` : `${edge.toFixed(2)}${suffix}`;
  return (
    <tr>
      <td>{label}</td>
      <td><strong>{w}{suffix}</strong></td>
      <td>{nw}{suffix}</td>
      <td className={edge > 0 ? "highlight-better" : "highlight-worse"}>{edgeStr}</td>
    </tr>
  );
}
