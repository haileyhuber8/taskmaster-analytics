import { useState, useEffect } from "react";

interface Player {
  id: string;
  name: string;
  color: string;
  scores: Record<string, Record<number, number>>; // episodeKey -> contestantId -> score
  alignmentHistory: number[];
}

const COLORS = ["#D4AF37", "#7B3FA0", "#e74c3c", "#2ecc71", "#3498db", "#e67e22"];

const STORAGE_KEY = "taskmaster-watch-mode-profiles";

export function useProfiles() {
  const [profiles, setProfiles] = useState<Player[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  const addProfile = (name: string) => {
    const newProfile: Player = {
      id: crypto.randomUUID(),
      name,
      color: COLORS[profiles.length % COLORS.length],
      scores: {},
      alignmentHistory: [],
    };
    setProfiles([...profiles, newProfile]);
    return newProfile;
  };

  const removeProfile = (id: string) => {
    setProfiles(profiles.filter((p) => p.id !== id));
  };

  const saveScores = (
    playerId: string,
    episodeKey: string,
    scores: Record<number, number>,
    alignmentScore: number
  ) => {
    setProfiles(
      profiles.map((p) =>
        p.id === playerId
          ? {
              ...p,
              scores: { ...p.scores, [episodeKey]: scores },
              alignmentHistory: [...p.alignmentHistory, alignmentScore],
            }
          : p
      )
    );
  };

  return { profiles, addProfile, removeProfile, saveScores };
}
