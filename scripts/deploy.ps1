# Pull, install, migrate, build, and restart chitko on a Windows server.
# For Linux, use scripts/deploy.sh instead.
#
# Restart step: Windows has no systemd, so this just runs whatever command
# you use to manage the running process (pm2, NSSM, a scheduled task, etc).
# Override it with -RestartCommand, e.g.:
#   .\scripts\deploy.ps1 -RestartCommand "pm2 restart chitko"
# Leave it unset to skip the restart step and do it yourself.

param(
	[string]$RestartCommand = ""
)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "==> git pull"
git pull --ff-only
if ($LASTEXITCODE -ne 0) { throw "git pull failed" }

Write-Host "==> npm ci"
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }

Write-Host "==> applying database migrations"
npm run db:migrate
if ($LASTEXITCODE -ne 0) { throw "npm run db:migrate failed" }

Write-Host "==> build"
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

if ($RestartCommand -ne "") {
	Write-Host "==> restarting service"
	Invoke-Expression $RestartCommand
} else {
	Write-Host "==> skipping restart (no -RestartCommand given) — restart the app process yourself"
}

Write-Host "==> done"
