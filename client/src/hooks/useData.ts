const API_BASE = "http://localhost:3001/api";

export async function fetchContestants() {
  const res = await fetch(`${API_BASE}/contestants`);
  return res.json();
}

export async function fetchContestant(id: number) {
  const res = await fetch(`${API_BASE}/contestants/${id}`);
  return res.json();
}

export async function fetchSeasons() {
  const res = await fetch(`${API_BASE}/seasons`);
  return res.json();
}

export async function fetchAnalysis() {
  const res = await fetch(`${API_BASE}/analysis`);
  return res.json();
}
