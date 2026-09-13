# Colordoku

A color-based puzzle game. Place and rotate pieces on the board so that no color repeats in any row or column.

**[Play it here](https://eba14.github.io/Colordoku/)**

## Tech stack

- **JavaScript (JSX)** — application code
- **HTML** — entry point (`index.html`)
- **CSS** with custom properties — theming (including dark mode), no CSS framework
- **React** + **Vite** — UI library and build tooling
- **Supabase** — auth (email/password + Google OAuth), Postgres database with row-level security, used for saved progress and best times
- **GitHub Actions** — CI/CD, auto-deploys to GitHub Pages on every push to `main`

## Modes

| Mode   | Grid | Colors | Pieces      |
|--------|------|--------|-------------|
| Easy   | 4×4  | 4      | 4 (2×2)     |
| Medium | 6×6  | 6      | 4 (3×3)     |
| Hard   | 6×6  | 6      | 9 (2×2)     |
| Expert | 9×9  | 9      | 9 (3×3)     |

## Getting started

```bash
npm install
npm run dev
```

Opens the game in your browser at `http://localhost:5173`.

```bash
npm run build   # production build to dist/
npm run lint    # eslint
```

## Project structure

- `src/logic/` — puzzle generation and solving (`generatePuzzle.js`, `solver.js`, `validateBoard.js`), independent of React
- `src/components/` — `Board`, `Piece`, `Timer`, `ModeSelector`, `Auth`
- `src/lib/` — Supabase client and data-access functions (auth, saved progress, best times)
- `supabase/schema.sql` — database schema to run in your own Supabase project

<details>
<summary><strong>Supabase setup (save progress + best times)</strong></summary>

> **This section is only for someone running their own copy of this code.** If you're just playing the game at [the link above](https://eba14.github.io/Colordoku/), sign-in and saved progress already work out of the box — there is nothing for you to configure. The steps below are for setting up a *separate* Supabase project for your own fork/deployment.

Signing in, saved progress, and best times are optional — the game works fully offline without any of this configured.

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to SQL Editor → New query, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the `best_times` and `game_progress` tables, grants the `authenticated` role access to them, and sets up row-level security so each user can only read/write their own rows.
3. In Project Settings → API, copy the Project URL and the publishable/anon key.
4. Copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
   ```
5. Restart the dev server. A "Sign In to save progress" link will appear on the menu.

By default, Supabase requires email confirmation before sign-in works — for local testing you can disable that under Authentication → Sign In / Providers → Email.

### Enabling "Continue with Google"

The app already has a Google sign-in button wired up, but it needs a Google OAuth app and a matching Supabase config before it'll work — both are one-time setup on your end:

1. **Google Cloud Console** → [console.cloud.google.com](https://console.cloud.google.com) → create/select a project → APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Application type: **Web application**.
   - Authorized JavaScript origins: `http://localhost:5173` (and your production URL, once deployed).
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback` (find `<your-project-ref>` in your Supabase project URL).
   - Save, then copy the **Client ID** and **Client Secret**.
2. **Supabase dashboard** → Authentication → Sign In / Providers → Google → toggle it on → paste the Client ID and Client Secret → Save.
3. That's it — no code or `.env` changes needed. Google sign-in reuses the same `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` from above.

**Note:** the OAuth consent screen may show your Supabase project's raw domain instead of "Colordoku" for an unverified/Testing-status app — that's expected Google behavior for apps that haven't gone through full verification, and doesn't affect functionality.

</details>
