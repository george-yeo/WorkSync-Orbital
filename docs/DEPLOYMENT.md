# Deployment

WorkSync deploys as three pieces, all on free tiers:

| Piece                           | Host                           | Why                                                        |
| ------------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `client/` (static Vite build)   | Vercel                         | Global CDN, instant loads, preview deploys                 |
| `server/` (Express + Socket.IO) | Northflank (Developer Sandbox) | Always-on container (no cold starts), WebSockets supported |
| Database                        | MongoDB Atlas M0               | Free 512 MB cluster                                        |

## 1. MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → add a database user with a generated password.
3. **Network Access** → add `0.0.0.0/0`. Northflank's free plan has no static outbound IP, so the cluster can't be IP-restricted; access is protected by the user/password over TLS. Never commit the connection string.
4. **Connect → Drivers** → copy the `mongodb+srv://…` string and add a database name before the `?`, e.g. `…mongodb.net/worksync?retryWrites=true&w=majority`.

## 2. API on Northflank

Northflank requires a payment method on file for identity verification, even on the free Developer Sandbox plan. Staying within the free allowance (2 services, 1 addon) costs nothing.

1. Create a **project** and pick the region closest to your users.
2. **Create new → Service → Combined service** (builds from Git and deploys in one).
3. **Repository:** connect GitHub and pick this repository, branch `main`.
4. **Build options:** Dockerfile
   - Dockerfile location: `/server/Dockerfile`
   - Build context: `/` (the repository root; the Dockerfile needs the root `package-lock.json`)
5. **Environment variables** (runtime variables; mark them secret):

   | Name            | Value                                                                                                   |
   | --------------- | ------------------------------------------------------------------------------------------------------- |
   | `NODE_ENV`      | `production`                                                                                            |
   | `MONGO_URI`     | the Atlas connection string                                                                             |
   | `JWT_SECRET`    | 48+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `CLIENT_ORIGIN` | your Vercel URL, e.g. `https://worksync.vercel.app` (comma-separate several)                            |
   | `DEMO_ENABLED`  | `true`                                                                                                  |

6. **Networking:** add a port: name `http`, port `8000`, protocol **HTTP**, **Public**. Northflank generates a public URL for it.
7. **Resources:** the smallest plan included in the free sandbox (`nf-compute-10`). The API idles around 125 MB and peaked at about 170 MB in a load test with image uploads; the Dockerfile caps the V8 heap at 160 MB and sharp runs without a cache to stay inside a small container.
8. **Advanced → Health checks:** add an **HTTP readiness** probe on port `8000`, path `/api/health`.
9. **Create service**, wait for the build, then open `https://<generated-host>/api/health`. It should return `{"status":"ok","db":"up"}`.

Pushes to `main` rebuild and redeploy automatically.

If the deploy fails, the runtime logs say why: the server validates its environment on boot and exits with a readable error (missing `MONGO_URI`, a short `JWT_SECRET`, or an unreachable database) instead of hanging.

## 3. Client on Vercel

1. **Add New… → Project** and import the repository.
2. **Root Directory:** click **Edit** and choose `client`. Vercel picks up `client/vercel.json`, which sets everything else:
   - Framework: Vite
   - Install command: `npm ci --workspace=@worksync/client` (installs only the client's dependencies from the root lockfile)
   - Build command: `npm run build`, output directory: `dist`
   - A rewrite to `index.html`, so client-side routes like `/groups/123` work on refresh
   - Security headers, and long-lived caching for hashed files in `/assets`
3. **Environment Variables:** add `VITE_API_URL` = the Northflank public URL (starts with `https://`, no trailing slash), for the Production environment.
4. **Deploy.** Your site is at `https://<project>.vercel.app`.
5. Set `CLIENT_ORIGIN` on Northflank to that exact URL (and any custom domain, comma-separated), then restart the service. If they don't match, the browser blocks every API call with a CORS error.

Notes:

- `VITE_API_URL` is baked in at build time; if the API URL changes, redeploy on Vercel.
- Preview deployments get their own URLs, which aren't in `CLIENT_ORIGIN`, so previews can't talk to the production API. That's intentional; add a preview URL to `CLIENT_ORIGIN` temporarily if you need to test one.

## Rotating secrets

- **JWT secret:** change `JWT_SECRET` on Northflank and restart. Everyone is logged out.
- **Database password:** Atlas → Database Access → edit user → new password, then update `MONGO_URI` on Northflank.

## Demo mode

With `DEMO_ENABLED=true` the API creates six fictional seed users on boot and exposes `POST /api/auth/demo`, which the "Explore the demo" button calls. Each demo visitor gets an isolated sandbox (their own copies of the sample groups, tasks and chats) that nobody else can see. Guests are deleted with all their data after 24 hours by a cleanup job that runs every 30 minutes. Demo sessions are rate-limited to 10 per hour per IP to protect the free database quota.
