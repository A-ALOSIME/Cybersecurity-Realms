@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8000
  py -m http.server 8000
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python is required to run the local server. Install Python or use a local server such as VS Code Live Server.
    pause
  ) else (
    start "" http://localhost:8000
    python -m http.server 8000
  )
)
