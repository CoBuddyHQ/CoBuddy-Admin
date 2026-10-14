-- Run automatically by docker-entrypoint-initdb.d on first postgres creation

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ensure cobuddy_admin exists if created under different default DB
SELECT 'CREATE DATABASE cobuddy_admin' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cobuddy_admin')\gexec
\c cobuddy_admin
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;
