# ⚡ J.A.R.V.I.S. AI COMMAND CENTER

A voice-first personal AI assistant inspired by the futuristic holographic interaction style of J.A.R.V.I.S. from *Iron Man*, built using real web technologies, a modular backend tool registry, persistent SQLite/Cloudflare D1 memory, dynamic polymorphic holographic HUD panels, and continuous hands-free wake-word detection.

---

## 🎯 Key Features & Capabilities

- **🎙️ Hands-Free Wake-Word Detection**: Continuously monitors audio for `"Hey Jarvis"` or `"Jarvis"`. When detected, transitions smoothly to `LISTENING`, triggers futuristic HUD chimes, captures your spoken command, and parses intent.
- **🔊 Auto-Echo Cancellation (Feedback Prevention)**: Automatically pauses speech recognition while JARVIS speaks, preventing acoustic loop feedback, and resumes continuous wake-word listening immediately once speech finishes.
- **⚛️ Holographic Canvas AI Core**: Center HUD with multi-layered rotating concentric rings, orbital particle trackers, tick graduation marks, and dynamic state transitions (`IDLE`, `LISTENING`, `PROCESSING`, `SEARCHING`, `EXECUTING_TOOL`, `SPEAKING`, `ERROR`).
- **🪟 Polymorphic Dynamic AI Response Renderer**: Floating, draggable, minimizable holographic panels rendered directly from structured backend payloads:
  - **`NewsCard`**: Headlines, real-time RSS/curated articles, publication badges, timestamps, AI summaries, and verified source links.
  - **`SearchResultsCard`**: Tactical web search results, verified domains, snippets, and source references.
  - **`WeatherCard`**: Live atmospheric readings from Open-Meteo API (temperature, feels-like, wind, humidity, 5-day forecast horizon).
  - **`CalculationCard`**: 64-bit precision math evaluator, formulas, step-by-step trace, and copy-result button.
  - **`MemoryCard`**: Synaptic memory recall cards, tags, category pills, and record deletion.
  - **`SystemStatusCard`**: Real-time host telemetry (heap memory gauge, uptime, platform, CPU cores, active services).
  - **`TimeCard`**: Digital chronometer, date, timezone, and live global world clock comparisons.
  - **`SummaryCard`**: Prior conversation logs and structured intelligence briefings.
- **🛠️ Modular Tool Registry**:
  - `webSearch`: Live DuckDuckGo search + curated technical index.
  - `newsSearch`: Real-time RSS feeds (Google News, TechCrunch) + curated AI news.
  - `calculator`: Safe mathematical evaluator with natural language word-problem parsing.
  - `memoryStore`: Structured persistent database storage in SQLite / D1.
  - `memoryRecall`: Keyword and semantic recall from persistent storage.
  - `weather`: 100% free, keyless Open-Meteo weather API with geocoding.
  - `systemStatus`: Host OS, Node.js process memory, and subsystem telemetry.
  - `time`: Temporal coordinates, timezone resolution, and world clocks.
  - `databaseQuery`: Prior interaction logs and conversation archives.
- **💾 Persistent Structured Memory**: SQLite database (`node:sqlite` built into modern Node.js, zero external C++ build dependencies) with migrations compatible with Cloudflare D1.
- **✨ 100% Free Out-of-the-box Operation & Demo Mode**: Works immediately without any paid API keys using open public APIs and a deterministic neural engine, with instant upgrade when `GEMINI_API_KEY` or `OPENAI_API_KEY` is supplied in `.env`.
- **⌨️ Keyboard & Push-to-Talk Fallbacks**: Hit **Spacebar** anywhere or tap the glowing microphone button for instant listening.

---

## 🏛️ System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │             JARVIS FRONTEND (React + Vite)             │
                                    │                                                        │
   ┌──────────────────────────────┐ │  ┌─────────────────────────┐  ┌─────────────────────┐  │
   │ Microphone / Acoustic Sensor │─┼─>│ Wake Word Detector      │─>│ State Coordinator   │  │
   └──────────────────────────────┘ │  │ ("Hey Jarvis")          │  │ (IDLE, LISTENING...)│  │
                                    │  └─────────────────────────┘  └──────────┬──────────┘  │
                                    │                                          │             │
                                    │  ┌─────────────────────────┐             ▼             │
                                    │  │ Web Audio Synthesizer   │  ┌─────────────────────┐  │
                                    │  │ (Pure Oscillator HUD FX)│  │ Holographic AI Core │  │
                                    │  └─────────────────────────┘  │ (Canvas 60fps HUD)  │  │
                                    │                               └──────────┬──────────┘  │
                                    │  ┌─────────────────────────┐             │             │
                                    │  │ Floating Window Manager │<────────────┘             │
                                    │  │ (Draggable / Stacked)   │                           │
                                    │  └───────────▲─────────────┘                           │
                                    │              │ (Structured Polymorphic Payload)        │
                                    └──────────────┼─────────────────────────────────────────┘
                                                   │ HTTP REST (/api/command)
                                                   ▼
                                    ┌────────────────────────────────────────────────────────┐
                                    │            JARVIS BACKEND (Node/Express API)           │
                                    │                                                        │
                                    │  ┌──────────────────────────────────────────────────┐  │
                                    │  │ Intent Classifier & Orchestrator                 │  │
                                    │  └──────────────────────────┬───────────────────────┘  │
                                    │                             ▼                          │
                                    │  ┌──────────────────────────────────────────────────┐  │
                                    │  │ Modular Tool Registry                            │  │
                                    │  │ • newsSearch   • webSearch    • calculator       │  │
                                    │  │ • memoryStore  • memoryRecall • weather          │  │
                                    │  │ • systemStatus • time         • databaseQuery    │  │
                                    │  └──────────────┬────────────────────┬──────────────┘  │
                                    │                 │                    │                 │
                                    │                 ▼                    ▼                 │
                                    │  ┌───────────────────────┐ ┌────────────────────────┐  │
                                    │  │ AI Model Layer        │ │ Persistent Database    │  │
                                    │  │ (Gemini / Demo Engine)│ │ (SQLite / CF D1)       │  │
                                    │  └───────────────────────┘ └────────────────────────┘  │
                                    └────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher (Node v22+ includes native `node:sqlite`).
- **NPM**: v9 or higher.

### 2. Installation
```bash
# Clone or navigate to the repository directory
cd /path/to/Zarvis

# Install dependencies
npm install
```

### 3. Environment Configuration
A default `.env` file is already provided. If you wish to enable live Gemini or OpenAI models, edit `.env`:
```bash
# Server Port
PORT=3001
NODE_ENV=development

# Optional LLM API Keys (leaves as fallback demo engine if omitted)
# GEMINI_API_KEY=your_gemini_api_key_here
# OPENAI_API_KEY=your_openai_api_key_here

# System Settings
DEMO_MODE=false
DATABASE_PATH=./server/db/jarvis.sqlite
```

### 4. Running the Application
```bash
# Start both Backend and Frontend concurrently
npm run dev
```

- **Frontend HUD**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001/api/status](http://localhost:3001/api/status)

---

## 🗣️ Supported Voice Directives

Simply say **"Hey Jarvis"** or **"Jarvis"** followed naturally by your directive:

| Voice Directive | Detected Intent | Subsystem Executed | Dynamic Component |
| :--- | :--- | :--- | :--- |
| *"Hey Jarvis, what are the latest AI news today?"* | `NEWS_SEARCH` | `newsSearch` | `NewsCard` (Headlines, images, links) |
| *"Jarvis, search the web for the latest NVIDIA AI announcements."* | `WEB_SEARCH` | `webSearch` | `SearchResultsCard` (Snippets, URLs) |
| *"Jarvis, calculate 125 multiplied by 47."* | `CALCULATOR` | `calculator` | `CalculationCard` (Trace, answer) |
| *"Jarvis, what is 20 percent of 850?"* | `CALCULATOR` | `calculator` | `CalculationCard` (Formula, answer) |
| *"Jarvis, remember that my project is called CleanFleet."* | `MEMORY_STORE` | `memoryStore` | `MemoryCard` (Committed record) |
| *"Jarvis, what do you remember about CleanFleet?"* | `MEMORY_RECALL` | `memoryRecall` | `MemoryCard` (Synaptic recall) |
| *"Jarvis, show me today's weather."* | `WEATHER` | `weather` | `WeatherCard` (Open-Meteo telemetry) |
| *"Jarvis, what time is it?"* | `TIME` | `time` | `TimeCard` (Digital clock + world times) |
| *"Jarvis, show me the last five things I asked you."* | `DATABASE_QUERY` | `databaseQuery` | `SummaryCard` (Interaction archive) |
| *"Jarvis, system status diagnostic."* | `SYSTEM_STATUS` | `systemStatus` | `SystemStatusCard` (Hardware gauges) |

> 💡 **Tip**: You can also use the bottom direct text input or click any of the directive pills at the bottom of the screen!

---

## 🧪 Automated Testing

Run the Vitest test suite covering the intent router, calculation safety, persistent memory CRUD, and in-memory REST API endpoints:

```bash
# Run all tests
npm test

# Run tests in watch mode
npx vitest
```

---

## ☁️ Cloudflare Workers & D1 Deployment

The project includes `wrangler.toml` and `server/worker.ts` for 1-click deployment to Cloudflare's serverless edge:

1. **Install Wrangler** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Create a Cloudflare D1 database**:
   ```bash
   wrangler d1 create jarvis-d1
   ```
   *Copy the output `database_id` into `wrangler.toml` under `[[d1_databases]]`.*

3. **Apply the initial migration**:
   ```bash
   wrangler d1 execute jarvis-d1 --file=./migrations/0001_init.sql
   ```

4. **Build the frontend**:
   ```bash
   npm run client:build
   ```

5. **Deploy**:
   ```bash
   wrangler deploy
   ```

---

## 🌐 Browser Compatibility & Microphone Access

| Browser | Continuous Wake Word | Push-To-Talk | Speech Synthesis (TTS) | Web Audio FX |
| :--- | :---: | :---: | :---: | :---: |
| **Google Chrome** | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported |
| **Microsoft Edge** | ✅ Supported | ✅ Supported | ✅ Supported | ✅ Supported |
| **Apple Safari** | ⚠️ Requires Click / Spacebar | ✅ Supported | ✅ Supported | ✅ Supported |
| **Mozilla Firefox** | ⚠️ Fallback to Spacebar/Input | ⚠️ Partial Web Speech | ✅ Supported | ✅ Supported |
| **Mobile (iOS/Android)**| ⚠️ Requires User Tap | ✅ Supported | ✅ Supported | ✅ Supported |

### Microphone Permissions
- When opening the application for the first time, click **Allow** on the browser microphone permission prompt.
- If continuous listening is restricted by your browser policy, tap the **Spacebar** or the glowing **Microphone** button to speak.

---

## 🛡️ Security & Privacy Architecture

- **Zero Client-Side Secrets**: API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) reside strictly in server-side environment variables and are never bundled into client JavaScript.
- **Safe Calculation Engine**: Math parser uses sandboxed evaluation without executing arbitrary shell or OS scripts.
- **Content Sanitization**: External feeds and URLs are verified and rendered in sandboxed components with `rel="noopener noreferrer"`.
- **Zero Hidden Reasoning**: Live activity stream displays strictly safe operational telemetry without exposing private model chain-of-thought.

