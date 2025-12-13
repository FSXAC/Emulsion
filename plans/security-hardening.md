# Backend Security Hardening Plan

## Context (from current code)
- FastAPI app served directly by uvicorn on `0.0.0.0:8200` with no reverse proxy or TLS (`scripts/start-production.sh` → `uvicorn app.main:app`).
- No authentication/authorization; all `/api` routes, `/docs`, `/openapi.json`, and `/health` are public (`backend/app/main.py`, routers in `backend/app/api`).
- CORS allows `"*"` and debug defaults to `True`, which also enables SQL echo logging (`backend/app/core/config.py`, `backend/app/core/database.py`).
- Pagination is removed when `search` is used, so unauthenticated callers can force full table scans (`list_film_rolls` in `backend/app/api/rolls.py`).
- SQLite database auto-creates in `backend/data/emulsion.db` with no file permission hardening or backups (`backend/app/core/config.py`, `init_db`).
- “Invalid HTTP request received” warnings likely come from scanners or HTTPS-to-HTTP hits because uvicorn is exposed directly.

## Goals
- Harden the FastAPI service for internet exposure, remove “Invalid HTTP request” noise, and minimize data/API leakage.
- Introduce auth, observability, and operational playbooks without slowing current feature work.

## Implementation Phases

### **HIGH PRIORITY**

#### Phase 15.1: Perimeter (TLS + proxy) ⭐
- [X] 15.1.1 Terminate TLS/HSTS at a reverse proxy (Caddy/Nginx/Traefik); expose only 80/443 and firewall-drop 8200 to stop invalid HTTP request warnings.
- [X] 15.1.2 Run uvicorn behind the proxy with `--proxy-headers` and `--forwarded-allow-ips` set to proxy IPs; add health endpoint path to proxy checks.
- [X] 15.1.3 Enforce request shaping: proxy `client_max_body_size` (or Caddy equivalent) plus uvicorn `--limit-concurrency` and `--timeout-keep-alive` to blunt slowloris/bruteforce attempts.

#### Phase 15.2: App configuration lockdown ⭐
- [ ] 15.2.1 Lock `cors_origins` to real domains via env; disable `allow_credentials` unless required.
- [ ] 15.2.2 Default `debug=False` in production, turn off SQL echo, and standardize INFO logging with request IDs.
- [ ] 15.2.3 Add `TrustedHostMiddleware` + security headers (HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy) and a baseline CSP (self + asset host).
- [ ] 15.2.4 Restrict `/docs` and `/openapi.json` to debug mode or behind auth/IP allowlist (only local IPs with 192.168.1.*); serve static assets via the proxy with gzip/brotli.

#### Phase 15.3: Authentication and authorization ⭐
- [ ] 15.3.1 Add single-user guard (API key header or HTTP Basic with hashed secret from env) wrapping all API routers; protect `/health` if exposed externally.
- [ ] 15.3.2 Add audit logging for auth failures and secret rotation path; return minimal error detail on auth errors.
- [ ] 15.3.3 If cookies are used, add CSRF tokens + origin checks; otherwise keep stateless Bearer/API key semantics.

#### Phase 15.4: Rate limiting and abuse controls ⭐
- [ ] 15.4.1 Add Redis-backed rate limiting (`fastapi-limiter`/`slowapi`) with stricter limits on auth and mutating routes.
- [ ] 15.4.2 Add fail2ban/IP block rules driven from proxy logs for repeated invalid requests.
- [ ] 15.4.3 Reintroduce pagination caps even when `search` is present; enforce a server-side max page size.

### **MEDIUM PRIORITY**

#### Phase 15.5: Logging, monitoring, and alerting
- [ ] 15.5.1 Standardize access/error logs with request IDs; scrub sensitive fields; optionally emit JSON logs.
- [ ] 15.5.2 Ship logs centrally and alert on 4xx/5xx spikes, auth failures, and rate-limit trips.
- [ ] 15.5.3 Add internal uptime/health checks (not public) and lightweight metrics (Prometheus/FastAPI middleware optional).

#### Phase 15.6: Data and runtime hardening
- [ ] 15.6.1 Lock SQLite perms to owner-only; run the service as a non-root user (systemd unit with limited capabilities).
- [ ] 15.6.2 Set encrypted, off-host backups with a tested restore drill and documented cadence.
- [ ] 15.6.3 Evaluate Postgres migration for durability/roles; if staying on SQLite, consider fs-level encryption and WAL tuning for resilience.

### **ONGOING**

#### Phase 15.7: Supply chain and tests
- [ ] 15.7.1 Add pip-audit/safety + bandit to CI; keep FastAPI/uvicorn/pydantic patched.
- [ ] 15.7.2 Establish monthly dependency updates and pinning; add SBOM if desired.
- [ ] 15.7.3 Add security tests: all routes require auth, CORS locked to allowed origins, docs disabled in prod.

#### Phase 15.8: Playbooks and documentation
- [ ] 15.8.1 Document incident response (rotate secrets, revoke tokens, block IPs) and backup-restore steps.
- [ ] 15.8.2 Document proxy/TLS renewal (ACME) and firewall rules so warnings don’t return.
- [ ] 15.8.3 Run periodic tabletop for auth bypass and backup restore readiness.
