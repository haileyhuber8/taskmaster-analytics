import { useState, useEffect } from "react";
import { useProfiles } from "../hooks/useWatchMode";
import { fetchEpisodes, type Episode } from "../hooks/useData";
import WatchModeScorer from "./WatchModeScorer";

interface Task {
  id: number;
  name: string;
  judgement: "objective" | "subjective" | "combo";
  contestants: { id: number; name: string; actualScore: number }[];
}

export default function WatchMode() {
  const { profiles, addProfile, removeProfile, saveScores } = useProfiles();
  const [newName, setNewName] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allEpisodes, setAllEpisodes] = useState<Record<string, Episode[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEpisodes().then((data) => {
      setAllEpisodes(data);
      setLoading(false);
    });
  }, []);

  const handleAddProfile = () => {
    if (newName.trim()) {
      addProfile(newName.trim());
      setNewName("");
    }
  };

  const currentEpisodes = selectedSeason ? (allEpisodes[String(selectedSeason)] || []) : [];

  const startGame = () => {
    if (selectedSeason && selectedEpisode && profiles.length > 0) {
      const ep = currentEpisodes.find((e) => e.episode === selectedEpisode);
      if (!ep) return;
      // Map score -> actualScore for compatibility with scorer
      const mappedTasks: Task[] = ep.tasks.map((t) => ({
        ...t,
        contestants: t.contestants.map((c) => ({ id: c.id, name: c.name, actualScore: c.score })),
      }));
      setTasks(mappedTasks);
      setGameActive(true);
    }
  };

  if (gameActive && tasks.length > 0) {
    return (
      <WatchModeScorer
        tasks={tasks}
        players={profiles}
        seasonNumber={selectedSeason!}
        onComplete={(results) => {
          results.forEach((r) => {
            saveScores(r.playerId, `S${selectedSeason}-E${selectedEpisode}`, r.scores, r.alignment);
          });
          setGameActive(false);
        }}
        onCancel={() => setGameActive(false)}
      />
    );
  }

  if (loading) return <div className="loading"><div className="spinner" /> Loading episodes...</div>;

  return (
    <div>
      <div className="card">
        <h2>🎬 Watch Mode — Play Along as Taskmaster</h2>
        <p style={{ color: "var(--tm-text-muted)", marginBottom: "1.5rem" }}>
          Watch an episode and score the subjective tasks yourself! Then compare your
          scores with Greg Davies' actual judgements. Play with friends to see who
          has the best Taskmaster instincts.
        </p>

        <h3>Players</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem", marginTop: "0.5rem" }}>
          {profiles.map((p) => (
            <div key={p.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--tm-cream-dark)",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              borderLeft: `4px solid ${p.color}`,
            }}>
              <span>{p.name}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--tm-text-muted)" }}>
                ({p.alignmentHistory.length} games)
              </span>
              <button
                onClick={() => removeProfile(p.id)}
                style={{ background: "none", border: "none", color: "var(--tm-accent)", cursor: "pointer" }}
              >✕</button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input
            className="filter-input"
            type="text"
            placeholder="Add player name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProfile()}
          />
          <button className="btn-primary" onClick={handleAddProfile}>Add</button>
        </div>

        <h3>Select Series</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem", marginBottom: "1rem" }}>
          {Object.keys(allEpisodes).sort((a, b) => Number(a) - Number(b)).map((s) => (
            <button
              key={s}
              className={`suggestion-btn ${selectedSeason === parseInt(s) ? "active" : ""}`}
              style={selectedSeason === parseInt(s) ? { borderColor: "var(--tm-red)", color: "var(--tm-red)" } : {}}
              onClick={() => { setSelectedSeason(parseInt(s)); setSelectedEpisode(null); }}
            >
              Series {s}
            </button>
          ))}
        </div>

        {selectedSeason && currentEpisodes.length > 0 && (
          <>
            <h3>Select Episode</h3>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem", marginBottom: "1rem" }}>
              {currentEpisodes.map((ep) => (
                <button
                  key={ep.episode}
                  className={`suggestion-btn ${selectedEpisode === ep.episode ? "active" : ""}`}
                  style={selectedEpisode === ep.episode ? { borderColor: "var(--tm-red)", color: "var(--tm-red)" } : {}}
                  onClick={() => setSelectedEpisode(ep.episode)}
                >
                  Ep {ep.episode}: {ep.title}
                </button>
              ))}
            </div>
          </>
        )}

        {selectedEpisode && (() => {
          const ep = currentEpisodes.find((e) => e.episode === selectedEpisode);
          if (!ep) return null;
          return (
            <div style={{ background: "var(--tm-cream-dark)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
              <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                Series {selectedSeason}, {ep.title} — {ep.tasks.length} tasks
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {ep.tasks.map((t) => (
                  <p key={t.id} style={{ margin: 0, fontSize: "0.85rem", color: "var(--tm-text-muted)" }}>
                    {t.id}. {t.name} <span style={{ opacity: 0.6 }}>({t.judgement})</span>
                  </p>
                ))}
              </div>
            </div>
          );
        })()}

        <button
          className="btn-primary"
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
          onClick={startGame}
          disabled={!selectedSeason || !selectedEpisode || profiles.length === 0}
        >
          🎬 Start Watch Mode
        </button>
      </div>

      {profiles.length > 0 && profiles.some((p) => p.alignmentHistory.length > 0) && (
        <div className="card">
          <h2>📊 Player Stats</h2>
          <table className="comparison-table">
            <thead>
              <tr><th>Player</th><th>Games</th><th>Avg Alignment</th><th>Best</th></tr>
            </thead>
            <tbody>
              {profiles
                .filter((p) => p.alignmentHistory.length > 0)
                .map((p) => {
                  const avg = p.alignmentHistory.reduce((a, b) => a + b, 0) / p.alignmentHistory.length;
                  const best = Math.max(...p.alignmentHistory);
                  return (
                    <tr key={p.id}>
                      <td style={{ borderLeft: `4px solid ${p.color}`, paddingLeft: "1rem" }}>{p.name}</td>
                      <td>{p.alignmentHistory.length}</td>
                      <td><strong>{avg.toFixed(0)}%</strong></td>
                      <td>{best}%</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
