# Local setup first — no Docker required

These instructions run Django, PostgreSQL/PostGIS, Redis and Celery directly inside Ubuntu on **Windows WSL2**. This avoids the native Windows GDAL path configuration and Celery process limitations. You can access the API and Postman from Windows at `http://localhost:8000`.

Use a new database named `farm_management`. Do not run these initialization commands against your existing RAG/auth database.

## 1. Open Ubuntu in WSL2

If Ubuntu/WSL2 is already installed, open it and continue to step 2.

Otherwise, in an administrator PowerShell window:

```powershell
wsl --install -d Ubuntu-24.04
```

Restart Windows if requested, launch Ubuntu, and complete its Linux username/password setup. All remaining commands in this guide are **Ubuntu/bash commands**, not PowerShell.

## 2. Install local system dependencies

```bash
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3-pip \
  postgresql postgresql-contrib postgis postgresql-postgis \
  redis-server gdal-bin libgdal-dev libgeos-dev proj-bin libproj-dev libpq-dev unzip
sudo service postgresql start
sudo service redis-server start
```

Verify:

```bash
python3.12 --version
pg_lsclusters
redis-cli ping
gdalinfo --version
```

Redis should return `PONG`. `pg_lsclusters` shows the PostgreSQL port. The default used below is `5432`. If your local server uses a different port, use that port both for the initialization command and in `DATABASE_URL`.

## 3. Extract the backend and create the virtual environment

Extract the supplied ZIP. For example, if it is in your Windows Downloads folder:

```bash
mkdir -p ~/projects/farm-management
unzip /mnt/c/Users/YOUR_WINDOWS_USER/Downloads/farm-management-django-backend.zip \
  -d ~/projects/farm-management
cd ~/projects/farm-management/backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements/dev.txt
```

Replace `YOUR_WINDOWS_USER` with the actual folder name. Keeping the extracted project under the Linux home directory is faster than running it under `/mnt/c`.

## 4. Create the local PostgreSQL role, database and test template

For a **new installation**, run the provided initialization file once:

```bash
sudo -u postgres psql -p 5432 -v ON_ERROR_STOP=1 < scripts/local_db.sql
```

It creates:

| Item | Value |
|---|---|
| Application role | `farm_app` |
| Local development password | `farm_local_password` |
| Application database | `farm_management` |
| Isolated test template | `farm_test_template` |
| Extensions | `postgis`, `btree_gist` |

The role owns the application database and has `USAGE, CREATE` on its `public` schema. This addresses the `permission denied for schema public` problem you encountered previously. `CREATEDB` is included only to let pytest create its disposable test database.

If the role/database already exist, **do not delete them or rerun the creation file**. Check them, and apply only the missing extension/grant:

```bash
sudo -u postgres psql -p 5432 -d farm_management
```

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS btree_gist;
GRANT CONNECT ON DATABASE farm_management TO farm_app;
GRANT USAGE, CREATE ON SCHEMA public TO farm_app;
\q
```

The user executing migrations must own the existing Django tables if you are reusing a database. Prefer the new, separate database above.

## 5. Create `.env`

```bash
python scripts/make_env.py
nano .env
```

The script creates a random Django secret. Review these values:

```dotenv
DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://farm_app:farm_local_password@127.0.0.1:5432/farm_management
REDIS_URL=redis://127.0.0.1:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CELERY_TASK_ALWAYS_EAGER=False
USE_S3=False
```

Leave the generated `DJANGO_SECRET_KEY` in place. If changing the database password, change the PostgreSQL role password too. URL-encode special characters in the password component of `DATABASE_URL`.

Here, `127.0.0.1` means the Ubuntu environment where both Django and the database are running. You do **not** use `host.docker.internal` for this local setup. If using PostgreSQL installed on Windows instead, configure its actual reachable address and install PostGIS there; do not assume WSL's loopback points to it.

## 6. Apply committed migrations and seed reference data

```bash
python manage.py check
python manage.py migrate
python manage.py seed_system
```

Do not run `makemigrations` as an installation step. The project includes its migrations.

The seed command creates units (including acre and hectare), purpose tags, categories, starter event types, Brinjal, permission codes and depreciation policies. It intentionally supplies **no pesticide doses**; enter actual product label data through the API.

Optional platform admin login:

```bash
python manage.py createsuperuser
```

An admin user is not automatically a farm member. Create a farm through the API to become its owner.

## 7. Start the local processes

Terminal 1 — API:

```bash
cd ~/projects/farm-management/backend
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

Terminal 2 — background worker:

```bash
cd ~/projects/farm-management/backend
source .venv/bin/activate
celery -A config worker -l INFO --concurrency=2
```

Terminal 3 — scheduler (run only one beat process):

```bash
cd ~/projects/farm-management/backend
source .venv/bin/activate
celery -A config beat -l INFO --schedule=/tmp/farm-celerybeat
```

Basic CRUD/event tests work with the API and database. Redis and the worker/beat are needed for readiness and scheduled jobs. Farm dates use the farm timezone; timestamps are stored in UTC.

## 8. Test the running API

Open `http://localhost:8000/api/v1/docs/` in Windows.

In another activated Ubuntu terminal:

```bash
python scripts/smoke_test.py
```

This registers a new local test user, creates a test farm, buys 100 kg at ₹30/kg, records payment, consumes 18 kg and checks that 82 kg remain and the consumption cost is ₹540. It also retries event creation to check idempotency. The script leaves this test farm for inspection and prints its ID.

For your own login, use the signup/login requests in `docs/API_GUIDE.md`. In Swagger click **Authorize**, then paste the access token (the auth scheme supplies `Bearer`). In Postman use Authorization → Bearer Token.

## 9. Run the test suite

```bash
bash scripts/test_local.sh
```

The script sets `TEST_DATABASE_TEMPLATE=farm_test_template`. PostgreSQL creates and later removes a separate `test_farm_management` database. It does not use the live farm database for test data. Do not set an explicit test database name equal to your application database.

For just the numerical example:

```bash
TEST_DATABASE_TEMPLATE=farm_test_template pytest tests/test_golden.py -q
```

Validation performed in the generation environment is listed in `docs/IMPLEMENTATION_STATUS.md`; a PostgreSQL integration run is still required on your machine.

## Troubleshooting

- **Port 8000 occupied:** run `python manage.py runserver 0.0.0.0:8001`; set `API_URL=http://127.0.0.1:8001/api/v1` when running the smoke script.
- **PostgreSQL connection refused:** check `pg_lsclusters`, start PostgreSQL, and check `DATABASE_URL`'s port.
- **PostGIS extension cannot be created:** install PostGIS and create its extension as the PostgreSQL administrator using step 4; the normal app role is not a superuser.
- **GDAL/GEOS library missing:** install step 2's system packages in the same Ubuntu environment running Python. Do not use a Windows Python virtual environment from WSL.
- **401 from `/auth/me/`:** obtain an access token first and send `Authorization: Bearer <access>`.
- **403 on a farm action:** the token is valid but the membership lacks the needed permission or block scope. Creating a farm grants its creator the owner membership.
- **409 after PATCH/command:** fetch the current record and send its current `version`.
- **Test-template error:** ensure `farm_test_template` was created and the `farm_app` role has `CREATEDB`.
- **Redis conflicts with another project:** choose another logical DB, such as `/3`, in `REDIS_URL`; use the same URL for Django and Celery.

Stop Django/worker/beat with Ctrl+C. Keep the database and project folder for the next session. Docker can be tested separately after this local setup works.
