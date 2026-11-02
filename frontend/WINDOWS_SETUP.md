# Windows local setup

You can keep your existing Django/uv/PostgreSQL/OSGeo4W setup. The frontend needs Node.js separately; it does not need another Python environment.

## 1. Install Node.js

Use Node.js **22.12 or newer** (Node 24 LTS also works). Install the Windows x64 distribution from https://nodejs.org/ and reopen PowerShell.

```powershell
node --version
npm --version
```

## 2. Extract beside the backend

Example:

```text
D:\farm_management\
  farm-management-django-backend\backend\
  farm-frontend\
```

Do not copy the frontend into `.venv`.

## 3. Install frontend dependencies

```powershell
cd D:\farm_management\farm-frontend
npm ci
Copy-Item .env.example .env
notepad .env
```

Set:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
VITE_ENABLE_DEMO=true
```

The API base includes `/api/v1`. It is a public backend URL, not a secret. Never put database credentials, JWT tokens or Django secrets in a `VITE_` variable.

After changing `.env`, restart Vite. If `.env` already exists, edit it instead of copying over it.

## 4. Check Django's CORS configuration

In the existing **backend** `.env`, keep:

```dotenv
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Restart Django after changing backend settings. Keep the working GDAL/GEOS/OSGeo4W configuration unchanged.

If installation is not finished, first complete:

```powershell
cd D:\farm_management\farm-management-django-backend\backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py seed_system
```

## 5. Start Django in terminal 1

```powershell
cd D:\farm_management\farm-management-django-backend\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 127.0.0.1:8000
```

Your database must be running and PostGIS enabled. Redis/worker/beat are needed for the relevant scheduled jobs; the frontend does not replace those services.

## 6. Start React in terminal 2

```powershell
cd D:\farm_management\farm-frontend
npm run dev
```

Open **http://localhost:5173**.

Vite uses a fixed port so that CORS matches your backend configuration. If 5173 is occupied, stop the other process, or explicitly change the frontend port and add its exact origin to Django's CORS list.

## 7. First login

1. Choose **Create an account** to register through Django, or sign in with an existing API user.
2. A new user without a farm sees the **Create farm workspace** form.
3. The farm creator becomes its owner through the backend.
4. Add blocks/seasons, create a crop cycle, register assets and their matching details.
5. Plan work. Start it, enter any actual quantity differences, then submit/confirm.
6. Inspect stock, money and calculated costs after confirmation.

For a visual check before connecting Django, use **Explore the preview**. Its banner states that records are sample data. End that session with **Connect your backend**, then log in to Django.

Farm users and Django platform administrators are distinct concepts. A superuser still needs a farm membership for farm APIs. Worker's actions remain subject to assignment and the backend's permission checks.

## 8. Test the same stock workflow as Postman

Use a new test farm:

1. Create a **stock-class asset** for Urea, then its **Stock item** detail using the canonical kg unit. Starting quantity is zero.
2. Create a cash account under **Money → Accounts**.
3. Choose **Farm work → Plan work**. Select the **Procurement** template.
4. Add a **Purchase stock** resource line: 100 kg, price per entered unit 30.
5. Add a **Money paid** line: 3000, the cash account, and the asset-purchase money category. Use quantity 1 and the piece unit.
6. Remove the crop target row for this untargeted purchase, then plan/start/confirm it.
7. Plan crop-nutrition work using **Use stock**, quantity 18 kg. Select a valid crop/block target, or remove the target row when the selected category permits it.
8. Start and confirm it. Inventory should show 82 kg remaining; the operation should recognise 540 resource cost.

The backend is the authority for quantities, reservations, label checks and costs. A 403 means membership permission was denied; a 409 means conflict/stale version and requires a review, not repeated blind retries.

## Build and preview

```powershell
npm run build
npm run preview -- --port 5173
```

Stop the development server first because preview uses the same port. The compiled files are in `dist/`. A hosted deployment must serve unknown app paths through `index.html` so deep links work.

## Responsive checks

Open http://localhost:5173/responsive-check.html while the development server is running. This developer-only harness provides 375px, 768px and 1280px iframe viewports of the actual application. Preview mode can be used there as well.

To check on a physical phone on the same trusted Wi-Fi:

- Start Django with `python manage.py runserver 0.0.0.0:8000`.
- Use the laptop's LAN IP in `VITE_API_BASE_URL`, for example `http://192.168.1.50:8000/api/v1`.
- Add that IP to `DJANGO_ALLOWED_HOSTS` and `http://192.168.1.50:5173` to `CORS_ALLOWED_ORIGINS`.
- Open `http://192.168.1.50:5173` on the phone. Its `localhost` would refer to the phone itself.
- Allow the necessary development ports through Windows Firewall only on the intended private network.

Use HTTPS and appropriate deployment settings for public hosting. The local dev server is intended for development.

## Troubleshooting

| Symptom | Check |
|---|---|
| Cannot reach farm server | Django process, API URL, firewall and browser Network tab |
| CORS error | Exact frontend origin/port in backend CORS settings; restart Django |
| Sign-in returns 401 | Email/password and whether the user exists in this backend database |
| Valid login, empty farm list | Create a farm or obtain an active membership |
| 403 on an action | Backend role permission/block scope/worker assignment |
| 409 on save | Close/reopen the record to fetch its current version and review the changes |
| Empty shared choices | Run `python manage.py seed_system` and refresh |
| Stock cannot be entered directly | Use a procurement/adjustment operation; cache fields are protected |
| CSV or file download denied | Export/target access permissions and API token validity |
| Unavailable calculation/action | Review the backend implementation status; the frontend cannot supply missing server rules |

When reporting a failure, include the request URL, HTTP status and JSON error from the browser Network tab, omitting tokens/passwords.
