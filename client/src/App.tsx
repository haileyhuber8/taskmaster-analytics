import { useState } from "react";
import "./styles/theme.css";
import Dashboard from "./components/Dashboard";
import ContestantExplorer from "./components/ContestantExplorer";
import ContestantDetail from "./components/ContestantDetail";
import SeasonView from "./components/SeasonView";
import ChatPanel from "./components/ChatPanel";
import WatchMode from "./components/WatchMode";

type Page = "dashboard" | "contestants" | "seasons" | "chat" | "watch";

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedContestant, setSelectedContestant] = useState<any>(null);

  return (
    <div className="app">
      <header className="header">
        <h1>TASKMASTER <span>Analytics</span></h1>
        <nav>
          <a href="#" className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>Dashboard</a>
          <a href="#" className={page === "contestants" ? "active" : ""} onClick={() => setPage("contestants")}>Contestants</a>
          <a href="#" className={page === "seasons" ? "active" : ""} onClick={() => setPage("seasons")}>Seasons</a>
          <a href="#" className={page === "watch" ? "active" : ""} onClick={() => setPage("watch")}>🎬 Watch</a>
          <a href="#" className={page === "chat" ? "active" : ""} onClick={() => setPage("chat")}>💬 Ask</a>
        </nav>
      </header>

      <main className="main">
        {page === "dashboard" && <Dashboard />}
        {page === "contestants" && (
          <ContestantExplorer onSelect={(c) => setSelectedContestant(c)} />
        )}
        {page === "seasons" && <SeasonView />}
        {page === "watch" && <WatchMode />}
        {page === "chat" && <ChatPanel />}
      </main>

      {selectedContestant && (
        <ContestantDetail
          contestant={selectedContestant}
          onClose={() => setSelectedContestant(null)}
        />
      )}
    </div>
  );
}

export default App;
