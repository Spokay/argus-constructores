# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Public website for **Argus Constructores** (showcase of construction projects) plus an admin
area to add / remove the projects shown. Monorepo scaffolded with `spokay-app-starter create
fullstack`, then OIDC removed in favour of a self-contained login:

- `frontend/` — Angular 22 SPA.
- `backend/` — Spring Boot 4.1 / Java 25, package `com.argusconstructores.api`, context path
  `/api`, port 8080, PostgreSQL + Flyway.
- `compose.yaml` — local PostgreSQL. Secrets in the git-ignored root `.env` (template:
  `.env.example`), read by both compose and the backend.

No root build: always `cd` into a subproject. UI will follow a design system prepared on
Claude Design (not applied yet).

## Commands

```bash
docker compose up -d                  # PostgreSQL, from repo root

# backend
cd backend
./mvnw spring-boot:run
./mvnw test                           # Testcontainers: Docker must be running
./mvnw test -Dtest=ClassName#method   # single test

# frontend
cd frontend
npm start            # http://localhost:4200, proxies /api -> :8080
npm run test:ci      # Karma headless, single run (npm test = watch)
npm run lint         # import order is enforced
npm run typecheck
npm run build
```

## Auth (cross-cutting)

- `POST /api/auth/login` checks the `user_account` table (bcrypt) and returns an HS256 JWT
  `{accessToken, expiresAt}` (8h, no refresh). The backend is both issuer and resource
  server: `SecurityConfiguration` builds `JwtEncoder`/`JwtDecoder` from `JWT_SECRET`.
- Roles travel in the `roles` claim (`TokenService.ROLES_CLAIM`), mapped to `ROLE_*`.
  `/admin/**` requires `ROLE_ADMIN`; `/auth/login` is public; everything else authenticated —
  new public endpoints (project listing) must be permitted explicitly.
- No sign-up: `AdminAccountSeeder` creates the first admin from `ADMIN_USERNAME` /
  `ADMIN_PASSWORD` only when the table is empty.
- Frontend `src/app/auth/`: `AuthService` keeps the session in localStorage, `authInterceptor`
  adds the bearer only to URLs under `resourceServer.baseUrl`, `authGuard` protects `/admin`.
  `errorHandlingInterceptor` logs out and goes to `/login` on any 401.

## Projects (cross-cutting)

- Backend package `project/`: `PublicProjectController` (`GET /projects/**`, anonymous, published
  only — a hidden project or its images answer 404) and `AdminProjectController`
  (`/admin/projects`: CRUD, `PUT /order`, images). New projects are created hidden and last.
- Order: `position` column, rewritten whole by `PUT .../order` with every id exactly once
  (otherwise 400). Same rule for a project's images; the first image is the cover.
- Images are `bytea` in `project_image`, one file per multipart request (field `file`, 10 MB).
  The type is detected from magic bytes (`ImageType`: JPEG/PNG/WebP, else 415), never from
  the client's Content-Type. Listings use the `ImageSummary` projection so bytes are never
  loaded with a list; deleting a project cascades in the database.
- Frontend: `core/project.service.ts` (public; `imageUrl` for a plain `<img src>`) and
  `core/admin-project.service.ts` (`imageBlob` goes through HttpClient because hidden
  projects' images need the bearer token).
- **No UI yet on purpose**: pages wait for the Claude Design design system import.

## Architecture

- **Runtime config (frontend)**: `public/assets/app-config.json` loaded by `AppConfigService`
  in an app initializer; never hardcode API URLs in TS. API services extend `BaseService`.
- **Error contract**: every backend failure is RFC 9457 `application/problem+json`, including
  401/403 raised in the security chain (routed to `exception/GlobalExceptionHandler`). New
  error statuses: copy `ResourceNotFoundException` (an `ErrorResponseException`).
- **Request correlation**: frontend sends `X-Request-Id`; backend `RequestIdFilter` puts it in
  MDC as `traceId` and returns it in error bodies.
- **Logging (frontend)**: only `LoggerService` writes to console (`no-console` lint rule).
- **Schema**: Flyway migrations in `backend/src/main/resources/db/migration`; Hibernate runs
  with `ddl-auto=validate`, so an entity change needs a migration.
- **Backend tests**: integration tests use `@ActiveProfiles("test")` +
  `@Import(TestcontainersConfiguration.class)` (shared context and container);
  `application-test.properties` supplies the JWT secret and seeded admin (`admin` / `admin-password`).
- Frontend component specs use `provideTestingEnvironment()` (`src/testing/test-providers.ts`).

## Repo notes

- Husky hooks and `.github/workflows` still live per subproject (template layout); Git and
  GitHub only read them at the root — move them up when setting up CI/hooks.
- Decisions (ADR): `$BRAIN/10-projets/argus-constructores/decisions/`.
