-- Run with psql as the postgres administrator, on a new local installation.
-- This creates a separate database; it does not touch your RAG database.
CREATE ROLE farm_app LOGIN PASSWORD 'farm_local_password' CREATEDB;
CREATE DATABASE farm_management OWNER farm_app;
\connect farm_management
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
GRANT USAGE, CREATE ON SCHEMA public TO farm_app;
-- pytest clones this template so its non-superuser role does not need to install PostGIS.
\connect postgres
CREATE DATABASE farm_test_template OWNER postgres;
\connect farm_test_template
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
GRANT USAGE, CREATE ON SCHEMA public TO farm_app;
\connect postgres
ALTER DATABASE farm_test_template IS_TEMPLATE true;
