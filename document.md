Analyzed compose.yaml:L1-65
Analyzed init-db.sh:L1-9
Ran check env files
Analyzed .env.example:L1-11

Here is a breakdown of how [`backend/compose.yaml`](file:///d:/Vedant/farm_management/backend/compose.yaml) is configured, with a focus on how environment variables and PostgreSQL database credentials are read and shared.

---

### 1. High-Level Architecture

* **YAML Anchor (`x-app: &app`)**: Defines shared configuration (`build`, `env_file`, base environment, volumes) once and reuses it across `migrate`, `web`, `worker`, and `beat` using `<<: *app`.
* **Dependency Chain**:
  1. `db` (PostGIS) & `redis` start and run health checks.
  2. `migrate` runs migrations/seeding once DB and Redis report `service_healthy`.
  3. `web`, `worker`, and `beat` start only after `migrate` achieves `service_completed_successfully`.

---

### 2. How Environment Variables Are Read

Docker Compose handles variables in two distinct stages:

```mermaid
flowchart LR
    A[Host Environment / .env] -->|1. String Interpolation \${VAR:-default}| B[Docker Compose Parser]
    B -->|2. Passed into container environment| C[Containers: db, web, worker...]
    A -->|3. Direct injection via env_file: .env| C
```

1. **Compose-Level Interpolation (`${VAR:-default}`)**:
   Docker Compose automatically reads variables from the backend `.env` file (or your host shell).
   * **Syntax**: `${VARIABLE_NAME:-fallback_value}`
   * **Behavior**: If `VARIABLE_NAME` is defined in `.env` (or exported in shell), Compose substitutes that value. If unset or blank, it uses the fallback after `:-`.

2. **Container Injection Precedence**:
   * `env_file: .env` injects generic settings (`DJANGO_SECRET_KEY`, `DEBUG`, etc.) into the container.
   * Values declared in the `environment:` section **override** anything in `env_file`. For example, `DATABASE_URL` in `compose.yaml` overrides any localhost `DATABASE_URL` in `.env`.

---

### 3. PostgreSQL Database Variables Explained

The database setup separates **administrative provisioning** from **application access**:

#### A. Database Container (`db`)
Lines 14–17:
```yaml
environment:
  POSTGRES_DB: farm_management
  POSTGRES_PASSWORD: ${POSTGRES_ADMIN_PASSWORD:-local_admin_change_me}
  FARM_DB_PASSWORD: ${FARM_DB_PASSWORD:-farm_local_password}
```
* **`POSTGRES_DB`**: Tells the official PostgreSQL image to initialize a database named `farm_management`.
* **`POSTGRES_PASSWORD`**: Sets the password for the PostgreSQL superuser (`postgres`). Defaults to `local_admin_change_me` if not set in `.env`.
* **`FARM_DB_PASSWORD`**: A custom variable injected into the container for the init script. Defaults to `farm_local_password`.
* **Initialization Script ([`init-db.sh`](file:///d:/Vedant/farm_management/backend/docker/init-db.sh#L1-L9))**:
  Mounted into `/docker-entrypoint-initdb.d/10-farm.sh` and runs **only on initial container creation** (when `pgdata` volume is empty):
  ```sql
  CREATE ROLE farm_app LOGIN PASSWORD :'app_password';
  GRANT CONNECT ON DATABASE farm_management TO farm_app;
  GRANT USAGE, CREATE ON SCHEMA public TO farm_app;
  ```
  It reads `$FARM_DB_PASSWORD` to create an unprivileged `farm_app` role.

#### B. App Containers (`web`, `migrate`, `worker`, `beat`)
Lines 7:
```yaml
DATABASE_URL: postgresql://farm_app:${FARM_DB_PASSWORD:-farm_local_password}@db:5432/farm_management
```
* Notice how it uses the same interpolation `${FARM_DB_PASSWORD:-farm_local_password}`.
* This ensures that whatever password was assigned to the `farm_app` role in the DB service is automatically used by Django and Celery to connect.
* The connection string points to host `db` and default internal port `5432` across Docker's internal network.

---

### 4. Port Mapping & Networking

* **Host Access**: `ports: ["127.0.0.1:5433:5432"]` on `db` binds port `5432` inside the container to `5433` on your local machine (`127.0.0.1`). This prevents collisions if you have a local PostgreSQL running on `5432`.
* **Container Access**: Containers communicate over Docker's internal DNS using service names, so Django connects to `db:5432` directly, ignoring the host's `5433` port mapping.

> [!NOTE]
> If you ever change `FARM_DB_PASSWORD` or `POSTGRES_ADMIN_PASSWORD` in `.env` after having already run `docker compose up`, PostgreSQL will **not** automatically update existing credentials because the `init-db.sh` script only executes on an empty volume (`pgdata`). You would need to alter the role password manually with `ALTER ROLE ...` or remove the volume with `docker compose down -v`.