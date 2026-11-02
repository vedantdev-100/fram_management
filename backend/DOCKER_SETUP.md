# Optional Docker setup — after local testing

This is a separate local container environment, not a production deployment. It uses its own named database volume; it does not automatically copy the data from your local PostgreSQL database.

## Start

Install Docker Desktop with WSL2 integration, then open the backend directory in Ubuntu. If the local Django server already uses port 8000, stop it first.

Reuse the `.env` generated during local setup. Compose overrides `DATABASE_URL` to use `db:5432` and `REDIS_URL` to use `redis:6379/0` inside containers.

Optional local Docker passwords in `.env`:

```dotenv
FARM_DB_PASSWORD=farm_local_password
POSTGRES_ADMIN_PASSWORD=choose_a_local_admin_password
```

Start:

```bash
docker compose up --build -d
docker compose ps
docker compose logs migrate
docker compose logs --tail=100 web worker beat
```

The `migrate` one-shot service applies migrations, seeds reference data and collects static files. Web, worker and beat wait for it to finish successfully.

| Service | Access |
|---|---|
| Django API | `http://localhost:8000` |
| PostgreSQL from host | `127.0.0.1:5433` |
| PostgreSQL from containers | `db:5432` |
| Redis from containers | `redis:6379` |
| Local files | Docker `media` volume |

Redis is not exposed on a host port. Database and API host ports bind only to loopback.

## Check and test

```bash
docker compose exec web python manage.py check
docker compose exec web python manage.py createsuperuser
```

From your activated **local** Python environment:

```bash
python scripts/smoke_test.py
```

The container image installs runtime dependencies, not pytest. Run the test suite through the local setup or the included CI workflow.

## Stop and restart

```bash
docker compose down
docker compose up -d
```

`docker compose down` preserves database, Redis and file volumes. Do not add `-v` unless you deliberately want to delete the container environment's stored data.

Changing passwords in `.env` does not change a role already stored in a PostgreSQL volume. Update the database role password explicitly and then the app setting. The initialization script only runs when the database volume is empty.

## Moving local data later

Use `pg_dump`/`pg_restore` or `psql` against the correct source and destination databases, plus copy the local `media/` files. Confirm schema versions and create a backup first. Merely starting Compose is not a data migration.

The supplied Compose configuration deliberately uses development settings for local HTTP. Do not expose it publicly. Production settings exist, but TLS, backup storage, secrets and deployment-specific operations are outside this local setup guide.
