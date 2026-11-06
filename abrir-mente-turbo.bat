@echo off
setlocal
set "SITE_DIR=%~dp0"
set "PHP_EXE="
set "MYSQL_EXE="
set "MYSQL_DIR="
set "DB_PORT=3308"

where php >nul 2>nul
if not errorlevel 1 set "PHP_EXE=php"
if not defined PHP_EXE for /d %%D in ("%SITE_DIR%..\..\bin\php\php-*") do if not defined PHP_EXE if exist "%%~fD\php.exe" set "PHP_EXE=%%~fD\php.exe"

if not defined PHP_EXE (
    echo O PHP nao foi encontrado. Instale o PHP pelo Laragon ou adicione-o ao PATH.
    pause
    exit /b 1
)

if not exist "%SITE_DIR%config.local.php" (
    echo O arquivo config.local.php nao foi encontrado.
    echo Copie config.local.php.example para config.local.php e configure o MySQL.
    pause
    exit /b 1
)

for /d %%D in ("%SITE_DIR%..\..\bin\mysql\mysql-*") do if not defined MYSQL_EXE if exist "%%~fD\bin\mysqld.exe" (
    set "MYSQL_EXE=%%~fD\bin\mysqld.exe"
    set "MYSQL_DIR=%%~fD"
)

if not defined MYSQL_EXE (
    echo O MySQL do Laragon nao foi encontrado em "%SITE_DIR%..\..\bin\mysql".
    pause
    exit /b 1
)

if not exist "%MYSQL_DIR%\my.ini" (
    echo A configuracao my.ini do MySQL nao foi encontrada em "%MYSQL_DIR%".
    pause
    exit /b 1
)

netstat -ano -p tcp | findstr /R /C:":%DB_PORT% .*LISTENING" >nul
if errorlevel 1 (
    echo Iniciando o MySQL do Laragon na porta %DB_PORT%...
    start "MySQL Mente Turbo" "%MYSQL_EXE%" --defaults-file="%MYSQL_DIR%\my.ini"
)

echo Aguardando o servidor MySQL...
for /l %%I in (1,1,30) do (
    "%PHP_EXE%" -r "$c = require '%SITE_DIR%config.php'; try { new PDO('mysql:host='.$c['host'].';port='.$c['port'].';charset=utf8mb4', $c['user'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); } catch (Throwable $erro) { exit(1); }" >nul 2>nul
    if not errorlevel 1 goto banco_pronto
    "%PHP_EXE%" -r "usleep(1000000);"
)

echo O MySQL nao respondeu com a configuracao atual.
echo Confira a porta %DB_PORT%, o arquivo config.local.php e o log do MySQL.
pause
exit /b 1

:banco_pronto
echo Criando ou conferindo as tabelas do site...
"%PHP_EXE%" -r "$c = require '%SITE_DIR%config.php'; $sql = file_get_contents('%SITE_DIR%database/schema.sql'); try { $pdo = new PDO('mysql:host='.$c['host'].';port='.$c['port'].';charset=utf8mb4', $c['user'], $c['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]); foreach (explode(';', $sql) as $statement) { if (trim($statement) !== '') { $pdo->exec($statement); } } } catch (Throwable $erro) { fwrite(STDERR, $erro->getMessage()); exit(1); }"
if errorlevel 1 (
    echo Nao foi possivel preparar o banco de dados do site.
    echo Confira as credenciais em config.local.php e as permissoes do usuario MySQL.
    pause
    exit /b 1
)

echo Banco de dados conectado.
echo Verificando o servidor web...
"%PHP_EXE%" -r "$r = @file_get_contents('http://127.0.0.1:8788/api.php?action=session'); exit(is_string($r) && strpos($r, 'csrfToken') !== false ? 0 : 1);" >nul 2>nul
if errorlevel 1 (
    start "Servidor local Mente Turbo" "%PHP_EXE%" -S 127.0.0.1:8788 -t "%SITE_DIR%"
    for /l %%I in (1,1,20) do (
        "%PHP_EXE%" -r "$r = @file_get_contents('http://127.0.0.1:8788/api.php?action=session'); exit(is_string($r) && strpos($r, 'csrfToken') !== false ? 0 : 1);" >nul 2>nul
        if not errorlevel 1 goto servidor_pronto
        "%PHP_EXE%" -r "usleep(1000000);"
    )
    echo O servidor web nao iniciou corretamente na porta 8788.
    pause
    exit /b 1
)

:servidor_pronto
echo Servidor web pronto.
start "" "http://127.0.0.1:8788/"
endlocal
