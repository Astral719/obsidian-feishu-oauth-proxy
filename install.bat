@echo off
chcp 65001 >nul
echo ========================================
echo Feishu Share Plugin - Obsidian Install
echo ========================================
echo.

REM Check if build files exist
if not exist "main.js" (
    echo [ERROR] main.js not found, please run npm run build first
    pause
    exit /b 1
)

if not exist "manifest.json" (
    echo [ERROR] manifest.json not found
    pause
    exit /b 1
)

echo [INFO] Please enter your Obsidian vault path
echo Example: C:\Users\YourName\Documents\MyVault
set /p VAULT_PATH="Vault path: "

if "%VAULT_PATH%"=="" (
    echo [ERROR] Path cannot be empty
    pause
    exit /b 1
)

REM Check if vault path exists
if not exist "%VAULT_PATH%" (
    echo [ERROR] Vault path does not exist: %VAULT_PATH%
    pause
    exit /b 1
)

REM Set plugin directory path
set PLUGIN_DIR=%VAULT_PATH%\.obsidian\plugins\obsidian-feishu-share

echo.
echo [INFO] Target plugin directory: %PLUGIN_DIR%

REM Create plugin directory
if not exist "%PLUGIN_DIR%" (
    echo [INFO] Creating plugin directory...
    mkdir "%PLUGIN_DIR%"
)

REM Copy files
echo [INFO] Copying plugin files...
copy "main.js" "%PLUGIN_DIR%\" >nul
copy "manifest.json" "%PLUGIN_DIR%\" >nul

REM Check if copy was successful
if exist "%PLUGIN_DIR%\main.js" (
    echo [SUCCESS] main.js copied successfully
) else (
    echo [ERROR] Failed to copy main.js
)

if exist "%PLUGIN_DIR%\manifest.json" (
    echo [SUCCESS] manifest.json copied successfully
) else (
    echo [ERROR] Failed to copy manifest.json
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open Obsidian
echo 2. Go to Settings - Community plugins
echo 3. Turn off Safe mode if enabled
echo 4. Find "Feishu Share" plugin and enable it
echo 5. Follow the test guide for configuration
echo.
pause
