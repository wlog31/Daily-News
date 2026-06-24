@echo off
setlocal

cd /d "%~dp0"

echo Building article JSON files...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Please install Node.js, then run this file again.
  echo.
  pause
  exit /b 1
)

node scripts\build_article_data.js
set EXIT_CODE=%ERRORLEVEL%

echo.
if "%EXIT_CODE%"=="0" (
  echo Done.
  echo Output folder: %CD%\data\articles
) else (
  echo Failed with exit code %EXIT_CODE%.
)
echo.
pause
exit /b %EXIT_CODE%
