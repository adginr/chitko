# Deploying chitko to your own server

Model: `git pull` → `npm ci` → migrate DB → `npm run build` → restart.
The server runs the app itself (via `@sveltejs/adapter-node`); no separate
build artifact needs to be shipped by hand.

Local development uses `pnpm` (see `pnpm-lock.yaml`), but servers use `npm`
(see `package-lock.json`) — pnpm's built-in supply-chain policy blocks
installing recently-published packages and can't be disabled from a
committed config file (see Troubleshooting below), so `npm` is the more
reliable choice for unattended/repeated installs on a server. Both
lockfiles are kept in the repo and maintained independently; never let two
package managers manage the same `node_modules` folder (delete it first if
switching).

## First-time setup (Linux)

1. Install Node (matching your local version) and `npm` on the server.
2. Clone the repo:
   ```bash
   git clone git@github.com:adginr/chitko.git
   cd chitko
   ```
3. Create `.env` (not committed — copy `.env.example` and adjust if needed):
   ```
   DATABASE_URL=local.db
   ```
4. Install dependencies and apply the database schema:
   ```bash
   npm ci
   npm run db:migrate
   ```
5. Build:
   ```bash
   npm run build
   ```
6. Set up the systemd service so it survives reboots/crashes:
   ```bash
   sudo cp deploy/chitko.service /etc/systemd/system/chitko.service
   sudo nano /etc/systemd/system/chitko.service   # fill in User= and WorkingDirectory=
   sudo systemctl daemon-reload
   sudo systemctl enable --now chitko
   ```
7. Point your reverse proxy (nginx/caddy) at `http://127.0.0.1:3000` if you
   want a domain/HTTPS in front of it.

## First-time setup (Windows)

1. Install Node and npm on the server.
2. Clone the repo:
   ```powershell
   git clone git@github.com:adginr/chitko.git
   cd chitko
   ```
3. Create `.env` (copy `.env.example`, contents: `DATABASE_URL=local.db`).
4. Install dependencies, migrate, and build:
   ```powershell
   npm ci
   npm run db:migrate
   npm run build
   ```
5. Run it:
   ```powershell
   node build
   ```
   Windows has no systemd equivalent built in — to keep it running across
   reboots/crashes, wrap it with [pm2](https://pm2.keymetrics.io/) or
   [NSSM](https://nssm.cc/) rather than running `node build` in a raw
   terminal.
6. Access over the network requires `HOST`/`PORT` env vars or `--host`/
   `--port` flags to `npm run preview` (for previewing a build) — remember
   the `--` separator: `npm run preview -- --host 0.0.0.0 --port 8085`.
   `node build` itself listens on `PORT` (default 3000) and `HOST`
   (default `0.0.0.0`) env vars, no flags needed.

## Updating

Linux:
```bash
./scripts/deploy.sh
# or, if not using systemd:
DEPLOY_RESTART_CMD="pm2 restart chitko" ./scripts/deploy.sh
```

Windows:
```powershell
.\scripts\deploy.ps1
# or, to also restart automatically:
.\scripts\deploy.ps1 -RestartCommand "pm2 restart chitko"
```

Both pull, run `npm ci`, apply any new migrations, and rebuild.

## Schema changes

`local.db` on the server holds real data, so production deploys apply
**versioned migrations** (`npm run db:migrate`), never `db:push --force`
(which can silently run destructive statements with no history).

When you change `src/lib/server/db/schema.ts` locally:

```bash
pnpm db:generate   # writes a new file under drizzle/
git add drizzle/
git commit -m "..."
git push
```

Then run the deploy script on the server as usual — it picks up the new
migration automatically. (`db:push` is still fine for local dev iteration.)

## Troubleshooting

### "minimumReleaseAge" / supply-chain policy error (pnpm only)

If you use pnpm anywhere and hit:

```
The lockfile contains entries that the active policies reject...
was published at ..., within the minimumReleaseAge cutoff (...)
```

pnpm has a built-in policy that refuses to install packages published very
recently (a guard against just-published/compromised versions). It can't
be fixed by anything committed to the repo — pnpm deliberately ignores
that setting when it comes from a project-local `.npmrc`. Either wait a
day or two and re-run `pnpm install`, or override it for one install:
`pnpm install --config.minimum-release-age=0`. This is why servers use
npm instead (see the top of this file).

### `crypto.randomUUID is not a function` in the browser

`crypto.randomUUID()` is only available in secure contexts (HTTPS or
`localhost`). If you're loading the app over plain `http://` via a LAN IP
or non-localhost hostname, this used to throw when adding a task — fixed
in the app itself (commit `5e2580e`), so make sure you're on a current
build.

## Backups

`local.db` is not tracked by git. Back it up separately, e.g.:

```bash
sqlite3 local.db ".backup backup-$(date +%F).db"
```
