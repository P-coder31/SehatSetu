@echo off
echo ====================================================
echo   Starting SehatSetu (FastAPI Backend + Next.js UI)
echo ====================================================
start "SehatSetu Backend (:8000)" cmd /k "%~dp0run_backend.bat"
start "SehatSetu Frontend (:3000)" cmd /k "%~dp0run_frontend.bat"
echo.
echo Services launched in separate terminal windows!
echo Backend API Docs: http://localhost:8000/docs
echo Frontend Web App: http://localhost:3000
echo.
