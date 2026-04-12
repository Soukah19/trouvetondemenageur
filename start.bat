@echo off
echo ========================================
echo   TrouveTonDemenageur - Clean Start
echo ========================================
echo.

echo [1/5] Cleaning old files...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo    - Cleared Vite cache
)
if exist dist (
    rmdir /s /q dist
    echo    - Cleared dist folder
)
echo    ✓ Cleanup complete
echo.

echo [2/5] Checking Node.js version...
node --version
echo.

echo [3/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo    ✗ Installation failed!
    pause
    exit /b 1
)
echo    ✓ Dependencies installed
echo.

echo [4/5] Starting development server...
echo.
echo ========================================
echo   Server starting on http://localhost:5173
echo   Press Ctrl+C to stop
echo ========================================
echo.

call npm run dev

pause
