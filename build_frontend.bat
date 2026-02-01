@echo off
echo Building Frontend...
cd frontend
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)
echo Running Vite Build...
call npm run build
cd ..
echo.
if %errorlevel% equ 0 (
    echo Frontend build successful! Assets are in frontend/dist
) else (
    echo Build failed.
)
pause
