# Argus Constructores — backend

```bash
./mvnw spring-boot:run      # :8080, context path /api; needs PostgreSQL (docker compose up -d)
./mvnw test                 # needs Docker (Testcontainers)
./mvnw test -Dtest=AuthControllerTest#wrongPasswordIsUnauthorized
./mvnw clean package
```

Configuration comes from environment variables, or from the repo-root `.env` during local
development (see `../.env.example`): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`
(required, ≥ 32 bytes), `ADMIN_USERNAME` / `ADMIN_PASSWORD` (first admin). Add
`--spring.profiles.active=dev` for request and security tracing.
