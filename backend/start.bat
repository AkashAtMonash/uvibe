@echo off
echo Starting UVibe v2 Python Backend...
echo.
cd /d "%~dp0"

REM Check if venv exists, create it if not
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate venv
call .venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt --quiet

REM Copy env file if not already done
if not exist ".env" (
    copy .env.example .env
    echo.
    echo  IMPORTANT: Edit backend\.env and add your OPENWEATHERMAP_API_KEY!
    echo.
)

REM Create models directory
if not exist "models" mkdir models

echo.
echo  UVibe Backend running at http://localhost:8000
echo  API docs available at   http://localhost:8000/docs
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
