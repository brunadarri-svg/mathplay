@echo off
setlocal
set "SITE_DIR=%~dp0"
set "PHP_EXE="

where php >nul 2>nul
if not errorlevel 1 set "PHP_EXE=php"
if not defined PHP_EXE for /d %%D in ("%SITE_DIR%..\..\..\bin\php\php-*") do if not defined PHP_EXE if exist "%%~fD\php.exe" set "PHP_EXE=%%~fD\php.exe"

if not defined PHP_EXE (
    echo O PHP nao foi encontrado. Inicie o Apache pelo Laragon ou adicione o PHP ao PATH.
    pause
    exit /b 1
)

start "Servidor local Mente Turbo" "%PHP_EXE%" -S 127.0.0.1:8788 -t "%SITE_DIR%"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8788/"
endlocal
