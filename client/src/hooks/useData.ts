const DATA_BASE = import.meta.env.BASE_URL + "data";

export async function fetchContestants() {
  const res = await fetch(`${DATA_BASE}/contestants.json`);
  return res.json();
}

export async function fetchContestant(id: number) {
  const all = await fetchContestants();
  return all.find((c: { id: number }) => c.id === id) || null;
}

export async function fetchSeasons() {
  const res = await fetch(`${DATA_BASE}/seasons.json`);
  return res.json();
}

export async function fetchAnalysis() {
  const res = await fetch(`${DATA_BASE}/analysis.json`);
  return res.json();
}

export async function fetchFunFacts(): Promise<string[]> {
  const res = await fetch(`${DATA_BASE}/funfacts.json`);
  return res.json();
}
