# 🎵 Vibebox

> *No more aux cord dictators. No more shouted requests. Just music, chosen together.*

---

## Problem Statement

You're in a hostel room at 1am. Five people, five different music tastes, one Bluetooth speaker. One person grabbed the aux cord twenty minutes ago and hasn't let go. Someone shouts a request — it gets ignored. Someone else tries to grab the phone — awkward. A terrible song comes on and everyone suffers in silence because no one wants to cause a scene.

This happens everywhere: road trips, post-hackathon chill sessions, college common rooms, house parties. Controlling the music is always a power struggle. There's no democratic way to handle it.

**The pain points:**
- The "Aux Cord Dictator" kills the collective vibe
- Passing a phone around to queue songs is disruptive and chaotic
- No mechanism for the group to collectively skip a bad song
- No way to read the room's energy and keep the vibe consistent

---

## Solution

**Vibebox** is a real-time, collaborative music queue system where everyone in the room has a voice — and the music adapts to the collective mood.

Anyone joins a session via a 4-character room code. Everyone can search songs via Spotify and add them to a shared queue. The queue is ordered democratically: upvoted songs rise, downvoted songs fall. If a song drops below a vote threshold, it auto-skips — no confrontation needed.

An AI vibe engine monitors the BPM and energy of queued tracks and suggests smooth transitions between genres, so the playlist never whiplashes from death metal to acoustic folk.

---

## Features

| Feature | Description |
|---|---|
| 🚪 Room creation & joining | Host creates a session, guests join via room code |
| 🔍 Spotify song search | Search any track and add it to the shared queue |
| 🗳️ Live upvote / downvote | Everyone votes; queue reorders in real time |
| ⏭️ Auto-skip | Songs below vote threshold are automatically removed |
| 🕵️ Anonymous voting | Votes are private — no peer pressure |
| 👑 Host controls | Host can pin, remove, or override any song |
| 🤖 AI vibe engine | Analyzes BPM/energy to suggest genre-smooth transitions |
| 📊 Crowd energy meter | Live visual showing the room's collective vibe score |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 | SSR, routing, API routes, production-ready |
| Styling | Tailwind CSS + shadcn/ui | Fast, accessible, consistent UI |
| Animations | Framer Motion | Smooth queue reorder transitions |
| Backend | NestJS | Modular, enterprise-grade, WebSocket support built-in |
| Runtime | Node.js | Event-driven — ideal for real-time systems |
| Database | PostgreSQL (Supabase) | Reliable structured data + managed hosting |
| ORM | Prisma | Type-safe queries, easy migrations |
| Real-time | Socket.IO | Live queue sync, vote events, vibe updates |
| Auth | Clerk | Google/Spotify OAuth in under an hour |
| Music API | Spotify Web API | Song search, metadata, BPM, audio features |
| AI Layer | OpenAI API | Mood analysis, vibe continuity recommendations |
| State | Zustand | Lightweight client-side state for queue/votes |
| Monorepo | Turborepo | Shared types between frontend and backend |
| Deploy (FE) | Vercel | Optimized Next.js deployment |
| Deploy (BE) | Railway | Backend + environment variables, easy setup |
| CI/CD | GitHub Actions | Auto-deploy on merge to `main` |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                       CLIENT                        │
│   Host Dashboard │ Shared Queue View │ Vote + Search │
└────────────┬──────────────┬──────────────────────────┘
             │  REST (HTTP) │  Socket.IO (WebSocket)
┌────────────▼──────────────▼──────────────────────────┐
│                  BACKEND (NestJS)                     │
│  Room Module │ Queue Module │ Vote Engine │ Auth       │
│         Spotify Module │ AI Vibe Engine               │
└───────┬───────────────┬───────────────────────────────┘
         │               │
    ┌────▼────┐    ┌──────▼──────┐    ┌────────────┐
    │PostgreSQL│   │ Spotify API │    │ OpenAI API │
    │(Supabase)│   │ (search/BPM)│    │ (mood AI)  │
    └──────────┘   └─────────────┘    └────────────┘
```

---

## User Flow

1. **Host** opens the app → clicks "Create Room" → gets a 4-character code (e.g. `AUX7`)
2. **Guests** enter the code on their phone → instantly join the live session
3. Anyone searches for a song via Spotify → adds it to the shared queue
4. All connected clients see the queue update in real time via Socket.IO
5. Users upvote songs they want sooner, downvote songs they don't want
6. Queue auto-reorders by score every few seconds
7. If a song's score drops below `-3`, it is auto-skipped
8. The AI vibe engine reads BPM/energy of the top 5 queued songs and flags jarring transitions
9. Host sees the crowd energy meter — a live composite of BPM averages and vote velocity

---

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL (or a free [Supabase](https://supabase.com) project)
- Spotify Developer account → [create an app](https://developer.spotify.com/dashboard)
- OpenAI API key → [platform.openai.com](https://platform.openai.com)
- Clerk account → [clerk.com](https://clerk.com)

### 1. Clone the repo

```bash
git clone https://github.com/debug-ger/The-Democratic-Aux-Cord-Hostel-Event-DJ-.git
cd The-Democratic-Aux-Cord-Hostel-Event-DJ-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

**Backend** (`apps/server/.env`):
```env
DATABASE_URL=postgresql://user:password@host:5432/auxcord
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_key
CLERK_SECRET_KEY=your_clerk_secret
JWT_SECRET=your_jwt_secret
```

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 4. Set up the database

```bash
cd apps/server
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run locally

```bash
# From root — starts both frontend and backend
npm run dev
```

Frontend → `http://localhost:3000`  
Backend → `http://localhost:3001`

---

## Scalability

Vibebox is built to scale smoothly for both small rooms and large events. By decoupling the static UI serving (via Vercel and Next.js) from the realtime socket event processing (NestJS + Socket.IO on Railway), we ensure high throughput with low latency. 
The use of **Supabase** (Managed PostgreSQL) guarantees reliable state persistence, while the realtime sync relies entirely on stateless Socket.IO connections that broadcast events locally to room IDs, allowing horizontal scaling across multiple Node.js instances if backed by a Redis adapter in the future.

---

## Future Scope

| Future Feature | Real-World Impact |
|---|---|
| Spotify Connect | Direct playback control |
| AI DJ Mode | Automatic vibe management |
| Smart Recommendations | Personalized group suggestions |
| Voice Commands | Hands-free interaction |
| Cross-Platform Mobile App | Wider adoption |
| Venue Mode | Cafes/events/nightclubs |
| Smart Speaker Support | Alexa/Google Home integration |
| Crowd Sentiment AI | Detect mood drops |
| NFT/Event Pass Integration | Premium communities |
| Music Analytics Dashboard | Insights for hosts/events |

---

## Contributors

| Name | Role |
|---|---|
| — | Frontend (Next.js, UI/UX) |
| — | Backend (NestJS, WebSockets) |
| — | Database + Spotify API integration |
| — | AI vibe engine + analytics |
