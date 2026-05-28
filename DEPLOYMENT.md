# Deployment Guide

This project is split into two deployable services:

- `client/`: Vite static frontend, recommended on Vercel.
- `server/`: Express API, recommended on Render or Railway.
- Database: MongoDB Atlas.

Keep `node_modules`, `dist`, `.env`, local logs, and platform cache directories out of Git. The root `.gitignore` is configured for that.

## 1. MongoDB Atlas

1. Create an Atlas cluster.
2. Create a database user with a strong password.
3. Add network access for your backend host. For many hosted platforms you may need a broad allow rule unless you have fixed outbound IPs.
4. Copy the Atlas connection string. Prefer the SRV format:

```text
mongodb+srv://<user>:<password>@<cluster-host>/worldcupmanager2026?retryWrites=true&w=majority
```

Production backend needs this value as `MONGO_URI`.

## 2. Backend on Render

Create a Render Web Service from the GitHub repository.

Recommended settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Environment variables:

```text
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGINS=https://<your-vercel-app>.vercel.app
AUTO_SEED=true
```

Notes:

- Render sets `PORT`; the API reads `process.env.PORT`.
- Keep `AUTO_SEED=true` for the first production boot if you want demo data. After the database is seeded, set `AUTO_SEED=false` to avoid startup seed checks.
- Add preview frontend URLs to `CLIENT_ORIGINS` if Vercel preview deployments need API access.

## 3. Backend on Railway

Create a Railway service from the GitHub repository.

Recommended settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Variables:

```text
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGINS=https://<your-vercel-app>.vercel.app
AUTO_SEED=true
```

Railway exposes variables to both build and runtime. Review and deploy staged variable changes after editing them in the Railway UI.

## 4. Frontend on Vercel

Import the same GitHub repository into Vercel.

Recommended settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `client` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Environment variable:

```text
VITE_API_URL=https://<your-backend-host>/api
```

Important:

- `VITE_API_URL` is public because it is baked into the Vite browser bundle.
- Do not put secrets in `client/.env` or Vercel frontend variables.
- Redeploy Vercel after changing `VITE_API_URL`.

## 5. Production Environment Variable Reference

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Public API base URL, including `/api`. |

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | Use `production` in deployed environments. |
| `PORT` | Usually platform-provided | Port used by Express. |
| `CLIENT_ORIGIN` | Optional | Single allowed frontend origin fallback. |
| `CLIENT_ORIGINS` | Yes | Comma-separated CORS allowlist for production frontend URLs. |
| `MONGO_URI` | Yes | MongoDB Atlas URI. Required when `NODE_ENV=production`. |
| `JWT_SECRET` | Yes | Long random signing secret. Required when `NODE_ENV=production`. |
| `JWT_EXPIRES_IN` | Optional | JWT lifetime, defaults to `7d`. |
| `AUTO_SEED` | Optional | Use `true` for initial demo seed, `false` after production is seeded. |

## 6. Pre-Push Checks

Run these from the repository root before pushing:

```bash
npm run smoke --prefix server
npm run lint --prefix client
npm run build --prefix client
```

Check ignored/generated files:

```bash
git status --short --ignored
```

You should not see `node_modules`, `dist`, `.env`, local logs, or platform cache files staged for commit.

## 7. Deployment Order

1. Push the repository to GitHub.
2. Create MongoDB Atlas and copy `MONGO_URI`.
3. Deploy the backend on Render or Railway.
4. Confirm `https://<backend>/api/health` returns success.
5. Deploy the frontend on Vercel with `VITE_API_URL=https://<backend>/api`.
6. Add the Vercel URL to backend `CLIENT_ORIGINS`.
7. Redeploy backend after CORS changes.
8. Open the Vercel app and log in with the demo admin or manager account if seeded.

## References

- Vercel Vite docs: https://vercel.com/docs/frameworks/frontend/vite
- Render Express deploy docs: https://render.com/docs/deploy-node-express-app
- Render environment variables: https://render.com/docs/environment-variables
- Railway variables docs: https://docs.railway.com/variables
- MongoDB connection strings: https://www.mongodb.com/docs/manual/reference/connection-string/
