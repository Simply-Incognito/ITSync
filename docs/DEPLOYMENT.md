# Deploying ITSync

ITSync ships as two deployables:

| Component | Platform | Why |
| --- | --- | --- |
| `frontend/` (React + Vite) | Vercel | Static SPA, fast CDN, free |
| `backend/` (Express + GridFS) | Render (Docker) | Long-running Node process, streaming uploads, no 4.5 MB body limit |
| MongoDB | MongoDB Atlas | Managed replica set (required for transactions) |

> **Do not deploy the backend to Vercel.** Vercel Functions cap request bodies at
> 4.5 MB, which is below the 5 MB document limit, and GridFS uploads are unreliable
> on short-lived serverless instances. Keep the API on Render (or any container host).

---

## 1. MongoDB Atlas

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** → add a user with read/write access.
3. **Network Access** → allow `0.0.0.0/0` (or Render's static outbound IPs on a paid plan).
4. Copy the connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/itsync?retryWrites=true&w=majority
   ```
   Include the database name (`itsync`) before the `?`.

---

## 2. Backend on Render

### Option A — Blueprint (recommended)

1. Push this branch and merge it into `dev`.
2. In Render: **New → Blueprint**, select the repository. Render reads `render.yaml`.
3. Fill in the secret environment variables when prompted:

   | Variable | Value |
   | --- | --- |
   | `MONGODB_URI` | Atlas connection string |
   | `CORS_ORIGIN` | Your Vercel URL (comma-separated for several) |
   | `WEB_APP_URL` | Your Vercel URL |
   | `SMTP_*` | Mailtrap / production SMTP credentials (optional) |

4. Deploy. Render builds `backend/Dockerfile` and starts `node dist/server.js`.

### Option B — Manual Web Service

- **Environment:** Docker
- **Dockerfile path:** `backend/Dockerfile`
- **Docker context:** `backend`
- **Health check path:** `/api/v1/health`
- **Plan:** Free (spins down after ~15 minutes idle; first request may take ~50 s)

### Verify

```bash
curl https://<service>.onrender.com/api/v1/health
# {"status":"ok","service":"isiwes-api", ...}
```

OpenAPI docs: `https://<service>.onrender.com/api/v1/docs`

---

## 3. Frontend on Vercel

1. **Add New → Project** → import the repository.
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite (auto-detected)
4. Add an environment variable:

   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<service>.onrender.com/api/v1` |

5. Deploy.

`frontend/vercel.json` adds the SPA rewrite so deep links such as
`/organization/verification` resolve to `index.html`.

---

## 4. Wire CORS

After Vercel gives you a domain, update the Render environment variable:

```
CORS_ORIGIN=https://your-app.vercel.app
```

Redeploy the service (Render restarts automatically after an env change).
For Vercel preview deployments, either add each preview URL or point previews at
the production API only.

---

## 5. Post-deploy checklist

- [ ] `GET /api/v1/health` returns `200`
- [ ] `GET /api/v1/docs` loads the OpenAPI UI
- [ ] Register a student and an organization
- [ ] Upload a verification document (PDF/JPEG/PNG under 5 MB)
- [ ] Submit the organization for verification
- [ ] Log in from the Vercel domain (no CORS errors in the browser console)

---

## Local production preview

```bash
# Backend
cd backend
npm ci
npm run build
npm start

# Frontend
cd frontend
npm ci
npm run build
npm run preview
```

---

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Invalid environment configuration` on boot | A required env var is missing. `MONGODB_URI` is mandatory. |
| CORS error in the browser | `CORS_ORIGIN` does not match the Vercel origin exactly (scheme + host, no trailing slash). |
| 404 on refresh at `/student/dashboard` | `frontend/vercel.json` is missing or the Vercel root directory is not `frontend`. |
| `buffering timed out` | Atlas network access does not allow the Render host, or the URI is wrong. |
| Uploads fail with 413 | You are hitting a serverless body limit — the API must run on Render, not Vercel. |
| API slow on first request | Render free tier sleeps. Upgrade or add a keep-alive ping. |
