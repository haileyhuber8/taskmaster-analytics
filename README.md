# 🏆 Taskmaster Analytics

A Taskmaster UK-themed data analytics web app with an AI-powered chat feature and multiplayer Watch Mode.

Analyze contestant performance across all task categories, discover what makes a Taskmaster champion, and play along as the Taskmaster with friends!

## Features

- **📊 Dashboard** — Key insights comparing winners vs non-winners across all task types
- **👤 Contestant Explorer** — Browse, search, filter, and sort all contestants by any stat
- **📺 Season View** — Series-by-series breakdown with champion highlights
- **💬 Ask the Taskmaster** — AI chat powered by Azure OpenAI with Greg Davies' personality
- **🎬 Watch Mode** — Multiplayer game: score subjective tasks yourself, compare with Greg's actual scores, track your "Taskmaster Alignment Score"

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **AI Chat:** Azure OpenAI (GPT-4o)
- **Data:** Pre-scraped from [taskmaster.info](https://taskmaster.info)
- **Styling:** Custom Taskmaster-themed CSS (gold/purple/dark)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ (only for re-scraping data)
- Azure OpenAI access (for chat feature)

### 1. Clone & Install

```bash
git clone https://github.com/haileyhuber8/taskmaster-analytics.git
cd taskmaster-analytics

# Install server dependencies
cd server && npm install

# Install client dependencies  
cd ../client && npm install
```

### 2. Configure Azure OpenAI (for chat)

```bash
cd server
cp .env.example .env
# Edit .env with your Azure OpenAI credentials
```

### 3. Run

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm run dev
```

Open http://localhost:5173 in your browser.

## Watch Mode

1. Go to the 🎬 Watch tab
2. Add players (you + friends/family)
3. Select a series
4. Score each subjective/combo task as if you're the Taskmaster
5. See how your scores compare with Greg Davies!
6. Track your alignment score over multiple episodes

## Data

Data is pre-scraped from taskmaster.info and stored in `data/`. To re-scrape:

```bash
cd scraper
pip install -r requirements.txt
python scrape.py
python clean_data.py
```

## Project Structure

```
taskmaster-analytics/
├── data/               # Pre-scraped JSON data files
├── scraper/            # Python scraper for taskmaster.info
├── server/             # Node.js/Express backend
│   └── src/
│       ├── routes/     # API endpoints
│       └── services/   # Data & chat services
├── client/             # React frontend
│   └── src/
│       ├── components/ # UI components
│       ├── hooks/      # Data fetching & state
│       └── styles/     # Taskmaster theming
└── README.md
```

## License

MIT
