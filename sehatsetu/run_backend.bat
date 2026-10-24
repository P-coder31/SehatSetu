@echo off
echo Starting SehatSetu Backend on port 8000...
cd /d "%~dp0backend"
.venv\Scripts\python.exe -m uvicorn main:app --port 8000 --reload
pause
