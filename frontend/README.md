# CloudNetOps — Frontend

Small React (Vite) frontend for the CloudNetOps stack. Implements:

- Login (JWT stored in `localStorage`)
- Dashboard (EC2/S3 counts, Grafana iframe)
- EC2 create/terminate
- S3 create/delete
- CloudWatch monitoring with charts (polling 10s)
- AI recommendation (POST `/ai/predict`)
- Prometheus metrics viewer (`GET /metrics`)
- Grafana iframe/button

Prerequisites
- Node 18+ and npm installed

Quick start (PowerShell)
```powershell
cd "C:\Users\Amir rjeb\Desktop\Cloudnetops\frontend"
npm install
npm run dev
```

Environment
- By default the frontend uses `http://localhost:5000` as backend. To override, create `.env` with:

```
VITE_API_BASE=http://localhost:5000
```

Login image
- By default the app will use local assets placed in `frontend/public/assets/` so no external URL is required. Two files are used:

	- `public/assets/cloud-blue.svg` (bannière de fond)
	- `public/assets/logo.svg` (petit logo près du formulaire)

 You can override with env vars in `.env` (optional):

```
VITE_LOGIN_IMAGE=/assets/login-bg.svg
```
VITE_LOGIN_IMAGE=/assets/cloud-blue.svg
VITE_LOGIN_LOGO=/assets/logo.svg
```

I added a pleasant cloud artwork at `frontend/public/assets/cloud-blue.svg` and a small logo at `frontend/public/assets/logo.svg`. Replace them with your production images if desired.

Notes
- The frontend expects the backend API routes described in the project: `/auth/login`, `/deploy/*`, `/monitor/*`, `/ai/predict`, `/metrics`.
- JWT is saved under `localStorage.cnops_token` and sent in `Authorization: Bearer ...` header.

Design / Theme (new)
- The frontend now uses a modern "sky-blue" theme and glass-like card panels (see `src/styles.css`).
- You can tweak the main tokens at the top of `src/styles.css` (variables like `--accent`, `--accent-2`, `--sky-700`, `--card-shadow`) to quickly adapt color and depth.
- A decorative hero SVG is used from `public/assets/bg-hero.svg`. Replace it with your own SVG or PNG for a custom hero background.
