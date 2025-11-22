# 📂 ✨ Society Maintenance Web App

Lightweight React + TypeScript single-page app built with Vite, using Firebase Authentication and Firestore for data and hosting. UI is implemented with MUI (Material UI).

Purpose: manage monthly maintenance, payments, notices, contacts and basic finance for small housing societies. The app has two roles: `admin` and `resident`.

---

## Quick start (development)

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from the example:

```bash
cp .env.example .env
# fill in values
```

3. Run dev server:

```bash
npm run dev
```

The app runs on `http://localhost:5173` by default (Vite).

---

## Build & deploy (production)

- Build:

```bash
npm run build
```

- The build output is written to `dist/` (Firebase Hosting expects `dist` based on `firebase.json`).

- To deploy to Firebase Hosting (you must have `firebase-tools` installed and configured):

```bash
firebase deploy --only hosting
```

Note: set the `VITE_FB_*` environment variables (see `.env.example`) in your CI or local environment. In GitHub Actions, add them as repository secrets.

---

## Environment variables

The app reads Firebase config from Vite env vars (prefix `VITE_`) in `src/firebase.ts`:

- `VITE_FB_API_KEY`
- `VITE_FB_AUTH_DOMAIN`
- `VITE_FB_PROJECT_ID`
- `VITE_FB_STORAGE_BUCKET`
- `VITE_FB_MESSAGING_SENDER_ID`
- `VITE_FB_APP_ID`

Use `.env.example` as a template for local development.

---

## Key files & patterns

- `src/firebase.ts` — Firebase initialization (Auth + Firestore).
- `src/auth/AuthProvider.tsx` — auth state, profile loading, change password flow.
- `src/auth/guards.tsx` — route guards: `RequireAuth`, `RequireAdmin`, `RequireResident`, `RoleRedirect`.
- `src/store.tsx` — central app context: live `onSnapshot` listeners and explicit `load*` functions; preferred place to add new Firestore interactions.
- `src/Bootstrap.tsx` — preloads data after login via loaders (dues, expenses, notices, payments, profiles).
- `src/App.tsx` — route definitions and role-based areas.

Firestore collections used by the app: `dues`, `payments`, `notices`, `expenses`, `profiles`.

---

## CI

A GitHub Actions workflow is included at `.github/workflows/ci.yml` to run `npm ci` and `npm run build` on `push`/`pull_request` to `main`. Provide the `VITE_FB_*` secrets in repository settings for CI builds.

---

## Notes & troubleshooting

- No unit tests are included in the repository. Use the dev server and browser console to reproduce issues.
- When changing Firestore schema, update `src/store.tsx` and any page code that reads/writes the affected collections.
- Keep the `@` import alias (configured in `vite.config.ts` and `tsconfig.json`) when adding new imports.