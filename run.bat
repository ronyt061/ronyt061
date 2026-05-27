@echo off
setlocal EnableDelayedExpansion

REM ===========================================================================
REM  Lume — one-shot Windows runner.
REM
REM  Installs deps if missing, creates .env if missing, seeds the demo data,
REM  and starts the dev server. Re-running this is safe: each step is skipped
REM  if it's already done (except the seed, which always re-creates the demo
REM  dataset on purpose).
REM ===========================================================================

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [lume] node.js was not found on PATH.
  echo        Install Node 18+ from https://nodejs.org and try again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [lume] installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [lume] npm install failed.
    pause
    exit /b 1
  )
) else (
  echo [lume] dependencies already installed, skipping npm install.
)

if not exist ".env" (
  echo [lume] creating .env from .env.example
  copy /y ".env.example" ".env" >nul
)

echo [lume] seeding demo data...
call npm run seed
if errorlevel 1 (
  echo [lume] seed failed.
  pause
  exit /b 1
)

echo.
echo ================================================================
echo   Lume is starting on http://localhost:3000
echo   Sign in: agent@lume.dev / password
echo   Press Ctrl+C in this window to stop the server.
echo ================================================================
echo.

REM Open the browser shortly after the dev server has had time to bind.
start "" /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

call npm run dev

endlocal
