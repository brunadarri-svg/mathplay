@echo off
setlocal
set "SITE_DIR=%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo O Node.js nao foi encontrado.
    echo Inicie o Apache pelo Laragon e abra http://localhost/mathplay/mathzone/
    pause
    exit /b 1
)

start "Servidor local Mente Turbo" node "%SITE_DIR%servidor-local.js"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8787/"
endlocal
