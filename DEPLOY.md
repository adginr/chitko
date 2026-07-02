# Deploying chitko to your own server

Model: `git pull` → `pnpm install` → migrate DB → `pnpm build` → restart.
The server runs the app itself (via `@sveltejs/adapter-node`); no separate
build artifact needs to be shipped by hand.

## First-time setup

1. Install Node (matching your local version) and `pnpm` on the server.
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
   pnpm install
   pnpm db:migrate
   ```
5. Build:
   ```bash
   pnpm build
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

## Updating

```bash
./scripts/deploy.sh
```

This pulls, reinstalls dependencies, applies any new migrations, rebuilds,
and restarts the `chitko` systemd service. Override the restart command if
you're not using systemd:

```bash
DEPLOY_RESTART_CMD="pm2 restart chitko" ./scripts/deploy.sh
```

## Schema changes

`local.db` on the server holds real data, so production deploys apply
**versioned migrations** (`pnpm db:migrate`), never `db:push --force`
(which can silently run destructive statements with no history).

When you change `src/lib/server/db/schema.ts` locally:

```bash
pnpm db:generate   # writes a new file under drizzle/
git add drizzle/
git commit -m "..."
git push
```

Then run `./scripts/deploy.sh` on the server as usual — it picks up the new
migration automatically. (`db:push` is still fine for local dev iteration.)

## Troubleshooting: "minimumReleaseAge" / supply-chain policy error

If `pnpm install` fails with something like:

```
The lockfile contains entries that the active policies reject...
was published at ..., within the minimumReleaseAge cutoff (...)
```

your pnpm has a built-in policy that refuses to install packages published
very recently (a guard against just-published/compromised versions). It
can't be fixed by anything committed to this repo — pnpm deliberately
ignores that setting when it comes from a project-local `.npmrc`, so a
cloned repo can't ship a file that silently disables it.

Two options on the affected machine:
- **Wait a day or two** and re-run `pnpm install` — once the pinned
  versions age past the policy's window, it passes with no changes needed.
- **Override it for this one install**:
  ```bash
  pnpm install --config.minimum-release-age=0
  ```

## Backups

`local.db` is not tracked by git. Back it up separately, e.g.:

```bash
sqlite3 local.db ".backup backup-$(date +%F).db"
```
