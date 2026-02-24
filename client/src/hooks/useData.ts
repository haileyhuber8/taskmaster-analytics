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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  const data = await res.json();
  return data.response;
}
