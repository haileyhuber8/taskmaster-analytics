import { useState } from "react";

interface Task {
  id: number;
  name: string;
  judgement: "objective" | "subjective" | "combo";
  contestants: { id: number; name: string; actualScore: number }[];
}

interface Player {
  id: string;
  name: string;
  color: string;
}

interface Props {
  tasks: Task[];
  players: Player[];
  seasonNumber: number;
  onComplete: (results: { playerId: string; scores: Record<number, number>; alignment: number }[]) => void;
  onCancel: () => void;
}

export default function WatchModeScorer({ tasks, players, seasonNumber, onComplete, onCancel }: Props) {
  const scorableTasks = tasks.filter((t) => t.judgement !== "objective");
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [allScores, setAllScores] = useState<Record<string, Record<number, Record<number, number>>>>({});
  // allScores[playerId][taskId][contestantId] = score
  const [showResults, setShowResults] = useState(false);

  const currentTask = scorableTasks[currentTaskIdx];
  const currentPlayer = players[currentPlayerIdx];
  const totalSteps = scorableTasks.length * players.length;
  const currentStep = currentTaskIdx * players.length + currentPlayerIdx + 1;

  const playerScoresForTask = allScores[currentPlayer?.id]?.[currentTask?.id] || {};

  const setScore = (contestantId: number, score: number) => {
    setAllScores((prev) => ({
      ...prev,
      [currentPlayer.id]: {
        ...prev[currentPlayer.id],
        [currentTask.id]: {
          ...prev[currentPlayer.id]?.[currentTask.id],
          [contestantId]: score,
        },
      },
    }));
  };

  const allContestantsScored = currentTask?.contestants.every(
    (c) => playerScoresForTask[c.id] !== undefined
  );

  const handleNext = () => {
    if (currentPlayerIdx < players.length - 1) {
      setCurrentPlayerIdx(currentPlayerIdx + 1);
    } else if (currentTaskIdx < scorableTasks.length - 1) {
      setCurrentTaskIdx(currentTaskIdx + 1);
      setCurrentPlayerIdx(0);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <ResultsView
        tasks={scorableTasks}
        objectiveTasks={tasks.filter((t) => t.judgement === "objective")}
        players={players}
        allScores={allScores}
        seasonNumber={seasonNumber}
        onDone={() => {
          const results = players.map((p) => {
            const playerScores: Record<number, number> = {};
            let matches = 0;
            let total = 0;
            for (const task of scorableTasks) {
              for (const c of task.contestants) {
                const userScore = allScores[p.id]?.[task.id]?.[c.id] ?? 0;
                playerScores[c.id] = (playerScores[c.id] || 0) + userScore;
                if (userScore === c.actualScore) matches++;
                total++;
              }
            }
            return {
              playerId: p.id,
              scores: playerScores,
              alignment: total > 0 ? Math.round((matches / total) * 100) : 0,
            };
          });
          onComplete(results);
        }}
      />
    );
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2>
          Task {currentTaskIdx + 1}/{scorableTasks.length}
        </h2>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid var(--tm-cream-dark)", color: "var(--tm-text-muted)", padding: "0.4rem 1rem", borderRadius: "6px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>

      <div style={{ background: "var(--tm-cream-dark)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
        <p style={{ color: "var(--tm-red)", fontWeight: 700, marginBottom: "0.5rem" }}>{currentTask.name}</p>
        <p style={{ color: "var(--tm-text-muted)", fontSize: "0.85rem" }}>
          Type: {currentTask.judgement} · Step {currentStep}/{totalSteps}
        </p>
      </div>

      <div style={{
        background: `${currentPlayer.color}20`,
        border: `2px solid ${currentPlayer.color}`,
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1rem",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          🎯 {currentPlayer.name}, score this task!
        </p>
        <p style={{ color: "var(--tm-text-muted)", fontSize: "0.85rem" }}>
          Award 1-5 points to each contestant
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {currentTask.contestants.map((c) => (
          <div key={c.id} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--tm-cream-dark)",
          }}>
            <span style={{ fontWeight: 600 }}>{c.name}</span>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setScore(c.id, score)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    border: playerScoresForTask[c.id] === score ? "2px solid var(--tm-red)" : "1px solid var(--tm-cream-dark)",
                    background: playerScoresForTask[c.id] === score ? "var(--tm-red-bright)" : "white",
                    color: playerScoresForTask[c.id] === score ? "white" : "var(--tm-text-dark)",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="chat-send"
        style={{ width: "100%", marginTop: "1rem", padding: "0.75rem" }}
        onClick={handleNext}
        disabled={!allContestantsScored}
      >
        {currentTaskIdx === scorableTasks.length - 1 && currentPlayerIdx === players.length - 1
          ? "🏆 See Results!"
          : currentPlayerIdx === players.length - 1
          ? "Next Task →"
          : `Next: ${players[currentPlayerIdx + 1].name}'s turn →`}
      </button>
    </div>
  );
}

function ResultsView({
  tasks,
  objectiveTasks,
  players,
  allScores,
  seasonNumber,
  onDone,
}: {
  tasks: { id: number; name: string; contestants: { id: number; name: string; actualScore: number }[] }[];
  objectiveTasks: { id: number; name: string; contestants: { id: number; name: string; actualScore: number }[] }[];
  players: Player[];
  allScores: Record<string, Record<number, Record<number, number>>>;
  seasonNumber: number;
  onDone: () => void;
}) {
  // Calculate totals per contestant per player
  const allTasks = [...tasks, ...objectiveTasks];
  const contestantNames = tasks[0]?.contestants.map((c) => c.name) || [];
  const contestantIds = tasks[0]?.contestants.map((c) => c.id) || [];

  const playerTotals: Record<string, Record<number, number>> = {};
  const actualTotals: Record<number, number> = {};
  let alignments: Record<string, { matches: number; total: number }> = {};

  for (const p of players) {
    playerTotals[p.id] = {};
    alignments[p.id] = { matches: 0, total: 0 };
    for (const cId of contestantIds) {
      playerTotals[p.id][cId] = 0;
    }
  }
  for (const cId of contestantIds) {
    actualTotals[cId] = 0;
  }

  // Sum subjective task scores
  for (const task of tasks) {
    for (const c of task.contestants) {
      actualTotals[c.id] += c.actualScore;
      for (const p of players) {
        const userScore = allScores[p.id]?.[task.id]?.[c.id] ?? 0;
        playerTotals[p.id][c.id] += userScore;
        if (userScore === c.actualScore) alignments[p.id].matches++;
        alignments[p.id].total++;
      }
    }
  }

  // Add objective task scores (same for everyone)
  for (const task of objectiveTasks) {
    for (const c of task.contestants) {
      actualTotals[c.id] += c.actualScore;
      for (const p of players) {
        playerTotals[p.id][c.id] += c.actualScore;
      }
    }
  }

  // Find winners
  const actualWinner = contestantIds.reduce((a, b) => actualTotals[a] > actualTotals[b] ? a : b);
  const playerWinners: Record<string, number> = {};
  for (const p of players) {
    playerWinners[p.id] = contestantIds.reduce((a, b) =>
      playerTotals[p.id][a] > playerTotals[p.id][b] ? a : b
    );
  }

  const bestAlignment = players.reduce((best, p) => {
    const pct = alignments[p.id].total > 0 ? alignments[p.id].matches / alignments[p.id].total : 0;
    const bestPct = alignments[best.id].total > 0 ? alignments[best.id].matches / alignments[best.id].total : 0;
    return pct > bestPct ? p : best;
  });

  return (
    <div>
      <div className="card">
        <h2>🏆 Results — Series {seasonNumber}</h2>

        <table className="comparison-table">
          <thead>
            <tr>
              <th>Contestant</th>
              <th>Greg's Score</th>
              {players.map((p) => (
                <th key={p.id} style={{ borderBottom: `3px solid ${p.color}` }}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contestantIds.map((cId, i) => (
              <tr key={cId} style={cId === actualWinner ? { background: "rgba(121, 0, 0, 0.08)" } : {}}>
                <td>
                  {contestantNames[i]}
                  {cId === actualWinner && <span className="winner-badge">🏆</span>}
                </td>
                <td><strong>{actualTotals[cId]}</strong></td>
                {players.map((p) => (
                  <td key={p.id} style={playerWinners[p.id] === cId ? { fontWeight: 700, color: p.color } : {}}>
                    {playerTotals[p.id][cId]}
                    {playerWinners[p.id] === cId && " 👑"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>📊 Taskmaster Alignment</h2>
        {players.map((p) => {
          const pct = alignments[p.id].total > 0
            ? Math.round((alignments[p.id].matches / alignments[p.id].total) * 100)
            : 0;
          return (
            <div key={p.id} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ color: p.color, fontWeight: 700 }}>{p.name}</span>
                <span>{pct}% match with Greg</span>
              </div>
              <div style={{ background: "var(--tm-cream-dark)", borderRadius: "4px", height: "12px", overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: p.color, borderRadius: "4px", transition: "width 0.5s" }} />
              </div>
            </div>
          );
        })}

        {players.length > 1 && (
          <p style={{ textAlign: "center", fontSize: "1.1rem", fontWeight: 700, color: "var(--tm-red)", marginTop: "1rem" }}>
            👑 {bestAlignment.name} is the Better Taskmaster!
          </p>
        )}
      </div>

      <button
        className="chat-send"
        style={{ width: "100%", marginTop: "1rem", padding: "1rem", fontSize: "1.1rem" }}
        onClick={onDone}
      >
        Back to Watch Mode
      </button>
    </div>
  );
}
