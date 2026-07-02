# Pull, install, migrate, build, and (re)start chitko on a Windows server.
# For Linux, use scripts/deploy.sh instead.
#
# Start/restart step: if you manage the process with pm2, NSSM, a scheduled
# task, etc, pass -RestartCommand and this script will run that instead,
# e.g.:
#   .\scripts\deploy.ps1 -RestartCommand "pm2 restart chitko"
# Otherwise (default) this script starts "npm start" itself as a detached
# background process, stopping any previous instance it started (tracked
# via .chitko.pid). Logs go to chitko.log in the repo root.

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
	$pidFile = ".chitko.pid"

	if (Test-Path $pidFile) {
		$oldPid = Get-Content $pidFile
		$oldProcess = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
		if ($oldProcess) {
			Write-Host "==> stopping previous instance (pid $oldPid)"
			Stop-Process -Id $oldPid -Force
		}
		Remove-Item $pidFile
	}

	Write-Host "==> starting app (npm start)"
	# Start-Process needs the real executable, not "npm" - on Windows npm is
	# a .cmd shim, and Start-Process (unlike normal invocation) does not
	# resolve PATHEXT the way the shell does.
	$npmPath = (Get-Command npm).Source
	$process = Start-Process $npmPath -ArgumentList "start" -NoNewWindow -PassThru `
		-RedirectStandardOutput "chitko.log" -RedirectStandardError "chitko.err.log"
	$process.Id | Out-File -FilePath $pidFile -Encoding ascii
	Write-Host "==> started (pid $($process.Id)), logs: chitko.log / chitko.err.log"
}

Write-Host "==> done"
