@echo off
echo ========================================
echo TASK MANAGER - FULL APPLICATION
echo ========================================
echo.
echo This will start your complete application:
echo - FastAPI Backend (port 8000)
echo - Web Frontend (port 3000)
echo.
echo Press any key to continue...
pause > nul

echo.
echo Step 1: Freeing ports...
echo Freeing port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Stopping process %%a...
    taskkill /PID %%a /F 2>nul
)

echo Freeing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Stopping process %%a...
    taskkill /PID %%a /F 2>nul
)

echo.
echo Step 2: Installing dependencies...
pip install fastapi uvicorn pydantic requests

echo.
echo Step 3: Starting FastAPI Backend...
start "Task Manager API" cmd /k "python start.py"

echo.
echo Step 4: Waiting for API to start...
echo Waiting 5 seconds...
timeout /t 5 /nobreak > nul

echo.
echo Step 5: Starting Web Frontend...
start "Task Manager Web" cmd /k "python start_web.py"

echo.
echo ========================================
echo APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Now you have:
echo - API: http://localhost:8000
echo - API docs: http://localhost:8000/docs
echo - Web app: http://localhost:3000
echo.
echo Test the application:
echo 1. Go to http://localhost:8000/docs to see all API endpoints
echo 2. Go to http://localhost:3000 to use the web app
echo 3. Try creating, editing, and deleting tasks
echo 4. Test dark theme, notifications, AI features
echo.
echo Your Task Manager is now running!
echo.
pause
