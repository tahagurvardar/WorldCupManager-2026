# WorldCupManager 2026

WorldCupManager 2026 is a full-stack national-team management and World Cup simulation platform. It is independent from earlier TurcoManager work and is structured for GitHub publishing plus production deployment.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Zustand, custom TR/EN i18n, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, JWT auth
- Data: 48 teams, 12 groups, modular 2026 seed files

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

## Demo Accounts

- Manager: `manager@wcm.dev` / `WorldCup2026!`
- Admin: `admin@wcm.dev` / `WorldCup2026!`

## Environment Variables

Frontend variables live in `client/.env`:

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `VITE_API_URL` | Yes in production | `https://worldcupmanager-api.onrender.com/api` | Public backend API base URL. Must include `/api`. |

Backend variables live in `server/.env`:

| Variable | Required | Example | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | Production yes | `production` | Enables production env validation. |
| `PORT` | Platform usually sets it | `5000` | Express listen port. Render/Railway normally provide this. |
| `CLIENT_ORIGIN` | Optional | `https://worldcupmanager.vercel.app` | Backward-compatible single CORS origin. |
| `CLIENT_ORIGINS` | Production yes | `https://worldcupmanager.vercel.app,https://preview-url.vercel.app` | Comma-separated allowed frontend origins. |
| `MONGO_URI` | Production yes | `mongodb+srv://...` | MongoDB Atlas connection string. Leave blank locally for memory Mongo. |
| `JWT_SECRET` | Production yes | long random secret | Must be strong and private. |
| `JWT_EXPIRES_IN` | Optional | `7d` | Passed to JWT signing. |
| `AUTO_SEED` | Optional | `true` locally, `false` after production seed | Seeds empty databases on server start. |

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

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel frontend, Render/Railway backend, MongoDB Atlas setup, environment variables, and deployment checks.
