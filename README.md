# LayerPrice — 3D Print Calculator (simple MVP)

## Run on Windows (no Netlify account needed)

Open a terminal inside the project folder and run:

```powershell
npm.cmd install
npm.cmd start
```

Open **http://localhost:4200/** for the public calculator or **http://localhost:4200/admin/login** for the administrator.

**Local development-only credentials:** username `admin`, password `admin123`. The local API runs on 127.0.0.1:3001 and Angular proxies `/api` requests to it. The first run uses demo PLA/PETG/ABS prices. Admin changes are saved in `.local-data/config.json` and stay after restarts. The `.local-data` folder is Git-ignored.

To customize local login credentials, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables *before* `npm.cmd start`. Never use demo credentials for a public deployment.

## Deploy from GitHub to Netlify

This project retains the Netlify production API at `netlify/functions/api.ts`, backed by Netlify Blobs. Push source code to GitHub and import the repo in Netlify. Use the included `netlify.toml` settings and configure these **production** environment variables in Netlify:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` (choose a strong password, **not** `admin123`)
- `SESSION_SECRET` (random secret with at least 32 characters)

Production persistence uses Netlify Blobs and is independent from your local `.local-data/config.json`. Local changes are **not** automatically published to production. After deployment, log into `/admin/login` and set production materials/prices. You may test Netlify integration with `npm.cmd run dev:netlify`, but for daily local work use only `npm.cmd start`.

GitHub Pages alone can host only static files; it cannot run the included Admin API. Use GitHub as a repository plus Netlify as a host for full functionality.

## Pricing

- Fixed mode: price per copy = sum(weight × material selling price) + print hours × hourly rate.
- Markup mode: price per copy = (sum(weight × material cost) + print hours × hourly rate) × (1 + markup / 100).
- Final total = price per copy × quantity.
- Material colors have no separate pricing.

The guest can view material prices and operating charges in the estimate but not the internal cost price. This project has no customer login, database, or STL uploader.

## Arabic / English
The header language switch changes all interface labels, validation messages and the document direction (Arabic RTL, English LTR). Arabic is the first-visit default. The choice is saved in browser localStorage. Common color names are translated for display only; custom material and color names remain as entered by the admin. Pricing, storage and authentication are unchanged. To keep existing locally saved prices when moving to this version, copy `.local-data/config.json` from the previous project into the same relative location here.

## Compact admin UI
The admin page now shows a compact pricing settings section and a materials table. Add/edit opens a dialog with removable color tags; saving a material immediately persists the complete updated material list through the existing API. Deletion requires confirmation. The pricing settings retain their separate Save button. On narrow screens the table becomes compact labeled rows. Both Arabic and English remain supported. Existing `.local-data/config.json` can be copied into this version unchanged.
