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
