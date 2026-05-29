# WorldCupManager 2026

WorldCupManager 2026 is a full-stack national-team management and World Cup simulation platform. Take charge of a national side, pick your squad, analyze opponents, set tactics, simulate matches, and follow your tournament journey through a press-and-media driven experience.

## Live Demo

- **Live Frontend Demo:** https://world-cup-manager-2026.vercel.app
- **Backend API:** https://worldcupmanager-2026-api.onrender.com
- **Health Check:** https://worldcupmanager-2026-api.onrender.com/api/health

> The backend is hosted on Render's free tier and may take ~30–60 seconds to wake up on the first request.

### Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Manager | `manager@wcm.dev` | `WorldCup2026!` |
| Admin | `admin@wcm.dev` | `WorldCup2026!` |

## Features

- **Manager login** — secure JWT-based authentication
- **National team selection** — choose the side you want to manage
- **Dashboard** — central hub for your campaign
- **Opponent analysis** — scout upcoming rivals before kickoff
- **Press conference** — answer the media and shape morale
- **Tactics editor** — set formation, style, and instructions
- **Recommended XI** — suggested starting lineup based on your squad
- **Match simulation** — drive matches through the simulation engine
- **Match report** — detailed post-match breakdown
- **Dynamic news / media reactions** — context-aware press coverage that responds to results
- **Tournament journey / manager performance report** — track your run and overall management performance
- **Stats page** — sortable columns for players and teams
- **Admin panel** — administrative management tools

## Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **Auth:** JWT
- **Hosting:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

## Repository Structure

```text
client/                 React/Vite frontend
  src/components/       Shared UI components
  src/pages/            Route-level screens
  src/context/          Language and theme providers
  src/i18n/             tr.json and en.json UI dictionaries
  src/services/         Axios API client
  src/store/            Zustand auth store

server/                 Express/Mongoose backend
  src/config/           Environment and database setup
  src/controllers/      Request handlers
  src/middleware/       Auth, validation, error handling
  src/models/           Mongoose models
  src/routes/           API route modules
  src/seeds/            Modular 2026 seed system
  src/services/         Match engine, standings, bracket, domain services
  scripts/              Import smoke checks
```

## Local Development

```bash
npm install --prefix client
npm install --prefix server
npm run dev:server
npm run dev:client
```

Frontend: `http://127.0.0.1:5173`

Backend: `http://localhost:5000/api`

Local database behavior:

- If `server/.env` has no `MONGO_URI`, the backend starts a MongoDB memory server automatically.
- `AUTO_SEED=true` seeds 48 teams, 1440 candidate players, coaches, news, demo users, and 72 group-stage fixtures when the database is empty.
- For persistent local MongoDB, set `MONGO_URI=mongodb://127.0.0.1:27017/worldcupmanager2026`.

## Environment Variables

Frontend variables live in `client/.env`:

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | Yes in production | `https://worldcupmanager-2026-api.onrender.com/api` | Public backend API base URL. Must include `/api`. |

Backend variables live in `server/.env`:

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | Production yes | `production` | Enables production env validation. |
| `PORT` | Platform usually sets it | `5000` | Express listen port. Render normally provides this. |
| `MONGO_URI` | Production yes | `mongodb+srv://...` | MongoDB Atlas connection string. Leave blank locally for memory Mongo. |
| `JWT_SECRET` | Production yes | long random secret | Must be strong and private. |
| `JWT_EXPIRES_IN` | Optional | `7d` | Passed to JWT signing. |
| `AUTO_SEED` | Optional | `true` locally, `false` after production seed | Seeds empty databases on server start. |
| `CLIENT_ORIGIN` | Optional | `https://world-cup-manager-2026.vercel.app` | Backward-compatible single CORS origin. |
| `CLIENT_ORIGINS` | Production yes | `https://world-cup-manager-2026.vercel.app,https://preview-url.vercel.app` | Comma-separated allowed frontend origins. |

## Scripts

```bash
npm run smoke --prefix server
npm run lint --prefix client
npm run build --prefix client
npm run seed --prefix server -- --force
```

Root helpers:

```bash
npm run dev:server
npm run dev:client
npm run lint
npm run build
npm run smoke
```

## Seed Files

- `server/src/seeds/seedTeams2026.js`
- `server/src/seeds/seedPlayers2026.js`
- `server/src/seeds/seedCoaches2026.js`
- `server/src/seeds/seedGroups2026.js`
- `server/src/seeds/seedFixtures2026.js`
- `server/src/seeds/seedAll2026.js`

Team/group seed metadata uses source fields (`sourceName`, `sourceUrl`, `verificationStatus`, `lastVerifiedAt`). Player pools are intentionally marked `estimated` until replaced by manually verified federation roster data.

## Deployment

| Layer | Platform |
| --- | --- |
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel frontend, Render backend, MongoDB Atlas setup, environment variables, and deployment checks.
