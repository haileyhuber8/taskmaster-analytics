interface Contestant {
  id: number;
  name: string;
  seasonIds: number[];
  seasonWins: number;
  episodes: number;
  episodeWins: number;
  episodeWinPct: number;
  totalPoints: number;
  pointsPerTask: number;
  pointsPerEpisode: number;
  taskWinPct: number;
  tasksAttempted: number;
  tasksWon: number;
  basePoints: number;
  bonusPoints: number;
  pointsDeducted: number;
  dqs: number;
  taskBreakdown: {
    format: Record<string, { attempted: number; won: number; winPct: number; ppt: number }>;
    setting: Record<string, { attempted: number; won: number; winPct: number; ppt: number }>;
    activity: Record<string, { attempted: number; won: number; winPct: number; ppt: number }>;
    judgement: Record<string, { attempted: number; won: number; winPct: number; ppt: number }>;
  };
}

interface Props {
  contestant: Contestant;
  onClose: () => void;
}

export default function ContestantDetail({ contestant: c, onClose }: Props) {
  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <button className="detail-close" onClick={onClose}>✕</button>

        <h2 style={{ color: "var(--tm-red)", marginBottom: "0.5rem", fontFamily: "'Special Elite', 'Courier New', monospace" }}>
          {c.name}
          {c.seasonWins > 0 && <span className="winner-badge">🏆</span>}
        </h2>
        <p style={{ color: "var(--tm-text-muted)", marginBottom: "1.5rem" }}>
          Series {c.seasonIds.join(", ")} · {c.episodes} episodes
        </p>

        <div className="stat-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-item"><div className="stat-value">{c.totalPoints}</div><div className="stat-label">Total Points</div></div>
          <div className="stat-item"><div className="stat-value">{c.pointsPerTask}</div><div className="stat-label">PpT</div></div>
          <div className="stat-item"><div className="stat-value">{c.pointsPerEpisode}</div><div className="stat-label">PpE</div></div>
          <div className="stat-item"><div className="stat-value">{c.episodeWinPct}%</div><div className="stat-label">Ep Win %</div></div>
        </div>

        <BreakdownTable title="📋 By Format" data={c.taskBreakdown.format} />
        <BreakdownTable title="🎬 By Setting" data={c.taskBreakdown.setting} />
        <BreakdownTable title="🎯 By Activity" data={c.taskBreakdown.activity} />
        <BreakdownTable title="⚖️ By Judgement" data={c.taskBreakdown.judgement} />

        <div style={{ marginTop: "1rem" }}>
          <h3 style={{ color: "var(--tm-brown)", marginBottom: "0.5rem" }}>Extra Stats</h3>
          <p style={{ color: "var(--tm-text-muted)", fontSize: "0.9rem" }}>
            Tasks: {c.tasksAttempted} attempted, {c.tasksWon} won ({c.taskWinPct}%)<br />
            Bonus: +{c.bonusPoints} · Deductions: -{c.pointsDeducted} · DQs: {c.dqs}
          </p>
        </div>
      </div>
    </>
  );
}

function BreakdownTable({ title, data }: { title: string; data: Record<string, { attempted: number; won: number; winPct: number; ppt: number }> }) {
  const entries = Object.entries(data).filter(([, v]) => v.attempted > 0);
  if (entries.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h3 style={{ color: "var(--tm-brown)", marginBottom: "0.5rem" }}>{title}</h3>
      <table className="comparison-table" style={{ fontSize: "0.85rem" }}>
        <thead>
          <tr><th>Type</th><th>Att.</th><th>Won</th><th>Win%</th><th>PpT</th></tr>
        </thead>
        <tbody>
          {entries.map(([key, val]) => (
            <tr key={key}>
              <td style={{ textTransform: "capitalize" }}>{key}</td>
              <td>{val.attempted}</td>
              <td>{val.won}</td>
              <td>{val.winPct}%</td>
              <td><strong>{val.ppt}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
