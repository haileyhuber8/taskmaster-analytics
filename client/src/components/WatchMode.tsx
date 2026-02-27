import { useState } from "react";
import { useProfiles } from "../hooks/useWatchMode";
import WatchModeScorer from "./WatchModeScorer";

// Sample episode tasks for Watch Mode demo
// In production, these would come from scraped episode data
const SAMPLE_EPISODES: Record<number, { title: string; tasks: Task[] }[]> = {};

interface Task {
  id: number;
  name: string;
  judgement: "objective" | "subjective" | "combo";
  contestants: { id: number; name: string; actualScore: number }[];
}

// Generate demo tasks from contestant data
function generateDemoTasks(seasonContestants: string[]): Task[] {
  const contestants = seasonContestants.map((name, i) => ({
    id: i + 1,
    name,
    actualScore: Math.floor(Math.random() * 5) + 1,
  }));

  return [
    { id: 1, name: "Prize Task: Best thing that smells amazing", judgement: "subjective", contestants: contestants.map(c => ({ ...c, actualScore: Math.floor(Math.random() * 5) + 1 })) },
    { id: 2, name: "Make the best sandwich without leaving the room", judgement: "subjective", contestants: contestants.map(c => ({ ...c, actualScore: Math.floor(Math.random() * 5) + 1 })) },
    { id: 3, name: "Throw a ball the furthest", judgement: "objective", contestants: contestants.map(c => ({ ...c, actualScore: Math.floor(Math.random() * 5) + 1 })) },
    { id: 4, name: "Create the most impressive work of art", judgement: "subjective", contestants: contestants.map(c => ({ ...c, actualScore: Math.floor(Math.random() * 5) + 1 })) },
    { id: 5, name: "Live task: Stack the most items", judgement: "combo", contestants: contestants.map(c => ({ ...c, actualScore: Math.floor(Math.random() * 5) + 1 })) },
  ];
}

const SEASON_CONTESTANTS: Record<number, string[]> = {
  1: ["Frank Skinner", "Josh Widdicombe", "Roisin Conaty", "Romesh Ranganathan", "Tim Key"],
  2: ["Doc Brown", "Joe Wilkinson", "Jon Richardson", "Katherine Ryan", "Richard Osman"],
  3: ["Al Murray", "Dave Gorman", "Paul Chowdhry", "Rob Beckett", "Sara Pascoe"],
  4: ["Hugh Dennis", "Joe Lycett", "Lolly Adefope", "Mel Giedroyc", "Noel Fielding"],
  5: ["Aisling Bea", "Bob Mortimer", "Mark Watson", "Nish Kumar", "Sally Phillips"],
  6: ["Alice Levine", "Asim Chaudhry", "Liza Tarbuck", "Russell Howard", "Tim Vine"],
  7: ["James Acaster", "Jessica Knappett", "Kerry Godliman", "Phil Wang", "Rhod Gilbert"],
  8: ["Iain Stirling", "Joe Thomas", "Lou Sanders", "Paul Sinha", "Sian Gibson"],
  9: ["David Baddiel", "Ed Gamble", "Jo Brand", "Katy Wix", "Rose Matafeo"],
  10: ["Daisy May Cooper", "Johnny Vegas", "Katherine Parkinson", "Mawaan Rizwan", "Richard Herring"],
  11: ["Charlotte Ritchie", "Jamali Maddix", "Lee Mack", "Mike Wozniak", "Sarah Kendall"],
  12: ["Alan Davies", "Desiree Burch", "Guz Khan", "Morgana Robinson", "Victoria Coren Mitchell"],
  13: ["Ardal O'Hanlon", "Bridget Christie", "Chris Ramsey", "Judi Love", "Sophie Duker"],
  14: ["Dara Ó Briain", "Fern Brady", "John Kearns", "Munya Chawawa", "Sarah Millican"],
  15: ["Frankie Boyle", "Ivo Graham", "Jenny Eclair", "Kiell Smith-Bynoe", "Mae Martin"],
  16: ["Julian Clary", "Lucy Beaumont", "Sam Campbell", "Sue Perkins", "Susan Wokoma"],
  17: ["Joanne McNally", "John Robins", "Nick Mohammed", "Sophie Willan", "Steve Pemberton"],
  18: ["Andy Zaltzman", "Babatunde Aléshé", "Emma Sidi", "Jack Dee", "Rosie Jones"],
  19: ["Fatiha El-Ghorri", "Jason Mantzoukas", "Mathew Baynton", "Rosie Ramsey", "Stevie Martin"],
  20: ["Ania Magliano", "Maisie Adam", "Phil Ellis", "Reece Shearsmith", "Sanjeev Bhaskar"],
};

export default function WatchMode() {
  const { profiles, addProfile, removeProfile, saveScores } = useProfiles();
  const [newName, setNewName] = useState("");
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleAddProfile = () => {
    if (newName.trim()) {
      addProfile(newName.trim());
      setNewName("");
    }
  };

  const startGame = () => {
    if (selectedSeason && profiles.length > 0) {
      const contestants = SEASON_CONTESTANTS[selectedSeason] || SEASON_CONTESTANTS[1];
      setTasks(generateDemoTasks(contestants));
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
            saveScores(r.playerId, `S${selectedSeason}-E1`, r.scores, r.alignment);
          });
          setGameActive(false);
        }}
        onCancel={() => setGameActive(false)}
      />
    );
  }

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
          <button className="chat-send" onClick={handleAddProfile}>Add</button>
        </div>

        <h3>Select Episode</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem", marginBottom: "1rem" }}>
          {Object.keys(SEASON_CONTESTANTS).map((s) => (
            <button
              key={s}
              className={`suggestion-btn ${selectedSeason === parseInt(s) ? "active" : ""}`}
              style={selectedSeason === parseInt(s) ? { borderColor: "var(--tm-red)", color: "var(--tm-red)" } : {}}
              onClick={() => setSelectedSeason(parseInt(s))}
            >
              Series {s}
            </button>
          ))}
        </div>

        <button
          className="chat-send"
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
          onClick={startGame}
          disabled={!selectedSeason || profiles.length === 0}
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
