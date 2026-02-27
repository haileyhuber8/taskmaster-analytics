import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../hooks/useData";
import type { ChatMessage } from "../hooks/useData";

const SUGGESTIONS = [
  "Do winners tend to score better on prize tasks?",
  "Is physical or mental task performance more important for winning?",
  "Who was the most dominant champion?",
  "Do consistent performers beat flashy ones?",
  "Which task type gives winners the biggest edge?",
  "Is live or filmed task performance more predictive of winning?",
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage(text, messages);
      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "The Taskmaster's communication device seems to be malfunctioning. Please check that the backend is running and Azure OpenAI is configured." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="card chat-container">
      <h2>🗣️ Ask the Taskmaster</h2>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--tm-text-muted)", padding: "2rem" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>👑</p>
            <p>The Taskmaster awaits your questions about contestant performance data.</p>
            <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Try one of the suggestions below, or ask anything!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant" style={{ opacity: 0.6 }}>
            <em>The Taskmaster is deliberating...</em>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {messages.length === 0 && (
        <div className="suggestions">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="suggestion-btn" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-area">
        <input
          className="chat-input"
          type="text"
          placeholder="Ask about Taskmaster data..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          disabled={loading}
        />
        <button className="chat-send" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
