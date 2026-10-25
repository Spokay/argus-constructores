# Argus Constructores

Public site showcasing Argus Constructores' construction projects, with an admin area to
manage them.

| | |
|---|---|
| Frontend | `frontend/` — Angular, http://localhost:4200 |
| Backend | `backend/` — Spring Boot, http://localhost:8080/api |
| Database | PostgreSQL via `compose.yaml` |

## Run

```bash
cp .env.example .env          # then fill DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD
docker compose up -d          # PostgreSQL on :5432
cd backend && ./mvnw spring-boot:run
cd frontend && npm install && npm start
```

The first start creates the admin account from `ADMIN_USERNAME` / `ADMIN_PASSWORD`;
log in at http://localhost:4200/login.

## Test

```bash
cd backend && ./mvnw test          # needs Docker (Testcontainers)
cd frontend && npm run test:ci
```

## Deploy

Frontend on **Vercel**, API + PostgreSQL on the **VPS** (Docker Compose, deployed by Jenkins,
see `Spokay/deploy-templates`). Vercel rewrites `/api/*` to `https://argus-api.spokayhub.top`,
so the browser stays on one origin.

### API on the VPS (once)

1. GitHub repository secrets `REGISTRY_USER` / `REGISTRY_PASSWORD` (registry.spokayhub.top):
   every push to `main` that passes CI pushes `argus-constructores-api:<sha8>` and `:latest`.
2. Jenkins credential **`argus-constructores-env`** (*Secret file*, `.env` format):
   `DB_PASSWORD`, `JWT_SECRET` (≥ 32 bytes, `openssl rand -base64 48`), `ADMIN_USERNAME`,
   `ADMIN_PASSWORD`. No `VERSION`: the pipeline sets it.
3. Jenkins jobs `argus-constructores-deploy` / `argus-constructores-down`: *Pipeline script
   from SCM*, branch `main`, script paths `jenkins/deploy.Jenkinsfile` / `jenkins/down.Jenkinsfile`.
4. DNS `argus-api.spokayhub.top` → VPS, nginx-ui vhost with certificate,
   `set $upstream argus-api:8080;`. Allow request bodies of at least 11 MB
   (`client_max_body_size 11m;`) for photo uploads.

Deploy: run `argus-constructores-deploy` with `IMAGE_TAG` = the sha shown in the CI run summary.
Rollback: same job with the previous tag. The admin account is created on the first start
only; `ADMIN_PASSWORD` can be removed from the credential afterwards.

### Frontend on Vercel (once)

Import the repository, set **Root Directory** to `frontend` (build settings come from
`frontend/vercel.json`). No environment variable is needed. `/` redirects to `/es/`.

### After the first deploy

Check that `https://<site>/es/` and `/en/` load, log in at `/es/login`, then upload a photo of
about 8 MB: it must go through the Vercel rewrite. If Vercel rejects it (413), point the
frontend at the API directly instead (`resourceServer.baseUrl` + `cors.allowed-origins`).
