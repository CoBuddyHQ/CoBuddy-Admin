-- Run automatically by docker-entrypoint-initdb.d on first postgres creation

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Optional: For strict append-only audit log - REVOKE update/delete after app user created.
-- Example (run as superuser AFTER creating the cobuddy login):
--   REVOKE UPDATE, DELETE ON audit_log FROM cobuddy;
--   REVOKE TRUNCATE ON audit_log FROM cobuddy;

-- Note: App user name matches docker-compose POSTGRES_USER=cobuddy
