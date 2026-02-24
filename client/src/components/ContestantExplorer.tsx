import { useState, useEffect } from "react";
import { fetchContestants } from "../hooks/useData";

interface Contestant {
  id: number;
  name: string;
  seasonIds: number[];
  seasonWins: number;
  episodes: number;
  episodeWinPct: number;
  totalPoints: number;
  pointsPerTask: number;
  pointsPerEpisode: number;
  taskWinPct: number;
  taskBreakdown: any;
}

interface Props {
  onSelect: (c: Contestant) => void;
}

export default function ContestantExplorer({ onSelect }: Props) {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("pointsPerTask");
  const [filterSeason, setFilterSeason] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContestants().then((data: Contestant[]) => {
      setContestants(data.filter((c: Contestant) => c.episodes >= 5));
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /> Loading contestants...</div>;

  const seasons = [...new Set(contestants.flatMap((c) => c.seasonIds))].sort((a, b) => a - b);

  let filtered = contestants
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => filterSeason === "all" || c.seasonIds.includes(parseInt(filterSeason)));

  filtered.sort((a, b) => {
    const av = (a as any)[sortBy] ?? 0;
    const bv = (b as any)[sortBy] ?? 0;
    return bv - av;
  });

  return (
    <div>
      <div className="card">
        <h2>Contestant Explorer</h2>
        <div className="filters">
          <input
            className="filter-input"
            type="text"
            placeholder="Search contestants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="pointsPerTask">Points per Task</option>
            <option value="pointsPerEpisode">Points per Episode</option>
            <option value="totalPoints">Total Points</option>
            <option value="episodeWinPct">Episode Win %</option>
            <option value="taskWinPct">Task Win %</option>
          </select>
          <select className="filter-select" value={filterSeason} onChange={(e) => setFilterSeason(e.target.value)}>
            <option value="all">All Seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>Series {s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="contestant-grid">
        {filtered.map((c) => (
          <div
            key={c.id}
            className={`contestant-card ${c.seasonWins > 0 ? "winner" : ""}`}
            onClick={() => onSelect(c)}
          >
            <div className="contestant-name">
              {c.name}
              {c.seasonWins > 0 && <span className="winner-badge">🏆 Champion</span>}
            </div>
            <div className="contestant-meta">
              Series {c.seasonIds.join(", ")} · {c.episodes} episodes
            </div>
            <div className="contestant-stats">
              <div className="mini-stat">
                <div className="value">{c.pointsPerTask}</div>
                <div className="label">PpT</div>
              </div>
              <div className="mini-stat">
                <div className="value">{c.pointsPerEpisode}</div>
                <div className="label">PpE</div>
              </div>
              <div className="mini-stat">
                <div className="value">{c.episodeWinPct}%</div>
                <div className="label">Ep Win</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
