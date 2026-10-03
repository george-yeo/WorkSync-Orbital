# Deployment

WorkSync deploys as two pieces:

| Piece                           | Host                | Why                                                            |
| ------------------------------- | ------------------- | -------------------------------------------------------------- |
| `client/` (static Vite build)   | Cloudflare Pages    | Free, global CDN, loads instantly even while the API is asleep |
| `server/` (Express + Socket.IO) | Koyeb free instance | Free, supports WebSockets, wakes from sleep in a few seconds   |
| Database                        | MongoDB Atlas M0    | Free 512 MB cluster                                            |

All three have free tiers. The only trade-off: Koyeb's free instance scales to zero after an hour without traffic, so the first API request after a quiet period takes a few seconds while it wakes.

## 1. MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → add a database user with a generated password (read/write to any database is fine for a single-app cluster).
3. **Network Access** → add `0.0.0.0/0`. Koyeb's free tier has no static outbound IP, so the cluster can't be IP-restricted; access is controlled by the user/password over TLS. Never commit the connection string.
4. **Connect → Drivers** → copy the `mongodb+srv://…` string and add a database name before the `?`, e.g. `…mongodb.net/worksync?retryWrites=true&w=majority`.

## 2. API on Koyeb

1. Create a **Web Service** from the GitHub repository.
2. Builder: **Dockerfile**.
   - Dockerfile location: `server/Dockerfile`
   - Work directory: leave empty (repository root; the Dockerfile needs the root `package-lock.json`)
3. Instance: **Free** (Frankfurt or Washington, D.C.; pick the one closer to your users).
4. Port: `8000` (HTTP). Health check: HTTP `GET /api/health`.
5. Environment variables (mark secrets as **Secret**):

   | Name            | Value                                                                                                   |
   | --------------- | ------------------------------------------------------------------------------------------------------- |
   | `NODE_ENV`      | `production`                                                                                            |
   | `MONGO_URI`     | the Atlas connection string                                                                             |
   | `JWT_SECRET`    | 48+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `CLIENT_ORIGIN` | your Pages URL, e.g. `https://worksync.pages.dev` (comma-separate several)                              |
   | `DEMO_ENABLED`  | `true`                                                                                                  |

6. Deploy, then check `https://<your-service>.koyeb.app/api/health` returns `{"status":"ok","db":"up"}`.

If the deploy fails, the logs will say why: the server validates its environment on boot and exits with a readable error (missing `MONGO_URI`, a short `JWT_SECRET`, or an unreachable database) instead of hanging.

## 3. Client on Cloudflare Pages

1. **Workers & Pages → Create → Pages → Connect to Git** and pick the repository.
2. Build settings:
   - Framework preset: None
   - Build command: `npm ci && npm run build --workspace client`
   - Build output directory: `client/dist`
   - Root directory: leave empty
3. Environment variables:

   | Name           | Value                                                                             |
   | -------------- | --------------------------------------------------------------------------------- |
   | `NODE_VERSION` | `22`                                                                              |
   | `VITE_API_URL` | the Koyeb URL, e.g. `https://worksync-api-yourname.koyeb.app` (no trailing slash) |

4. Deploy. Pages serves `index.html` for unknown paths automatically, so client-side routes like `/groups/123` work on refresh. `client/public/_headers` adds basic security headers.
5. Go back to Koyeb and make sure `CLIENT_ORIGIN` matches the final Pages URL (including any custom domain), otherwise the browser will block API calls with a CORS error.

## Rotating secrets

- **JWT secret:** change `JWT_SECRET` on Koyeb and redeploy. Everyone is logged out.
- **Database password:** Atlas → Database Access → edit user → new password, then update `MONGO_URI` on Koyeb.

## Demo mode

With `DEMO_ENABLED=true` the API creates six fictional seed users on boot and exposes `POST /api/auth/demo`, which the "Explore the demo" button calls. Each demo visitor gets an isolated sandbox (their own copies of the sample groups, tasks and chats) that nobody else can see. Guests are deleted with all their data after 24 hours by a cleanup job that runs every 30 minutes. Demo sessions are rate-limited to 10 per hour per IP to protect the free database quota.
