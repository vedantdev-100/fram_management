#!/bin/sh
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=app_password="$FARM_DB_PASSWORD" --set=ON_ERROR_STOP=1 <<'SQL'
CREATE ROLE farm_app LOGIN PASSWORD :'app_password';
GRANT CONNECT ON DATABASE farm_management TO farm_app;
GRANT USAGE, CREATE ON SCHEMA public TO farm_app;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
SQL
