import { useState, useEffect } from "react";
import { fetchSeasons } from "../hooks/useData";

interface SeasonContestant {
  id: number;
  name: string;
  totalPoints: number;
  pointsPerTask: number;
  episodeWinPct: number;
}

interface Season {
  seriesNumber: number;
  year: number;
  episodes: number;
  contestants: SeasonContestant[];
  winner: { id: number; name: string };
}

export default function SeasonView() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasons().then((data: Season[]) => { setSeasons(data); setLoading(false); });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading seasons...</div>;

  return (
    <div>
      {seasons.map((s) => (
        <div key={s.seriesNumber} className="card" style={{ marginBottom: "1.5rem" }}>
          <h2>Series {s.seriesNumber} ({s.year})</h2>
          <p style={{ color: "var(--tm-text-muted)", marginBottom: "1rem" }}>
            {s.episodes} episodes · Champion: <strong style={{ color: "var(--tm-red)" }}>{s.winner.name}</strong>
          </p>
          {s.contestants.length > 0 ? (
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Contestant</th>
                  <th>Total Points</th>
                  <th>PpT</th>
                  <th>Ep Win %</th>
                </tr>
              </thead>
              <tbody>
                {s.contestants
                  .sort((a, b) => b.totalPoints - a.totalPoints)
                  .map((c) => (
                    <tr key={c.id} style={c.id === s.winner.id ? { background: "rgba(121, 0, 0, 0.08)" } : {}}>
                      <td>
                        {c.name}
                        {c.id === s.winner.id && <span className="winner-badge">🏆</span>}
                      </td>
                      <td><strong>{c.totalPoints}</strong></td>
                      <td>{c.pointsPerTask}</td>
                      <td>{c.episodeWinPct}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "var(--tm-text-muted)" }}>Detailed contestant data not yet available for this series.</p>
          )}
        </div>
      ))}
    </div>
  );
}
