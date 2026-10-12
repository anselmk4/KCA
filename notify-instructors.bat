@echo off
echo ===============================================================
echo Diffusion de l'Annonce Produits Digitaux aux Formateurs Ansella
echo ===============================================================
echo.
REM Recherche de node dans le PATH ou dans le dossier cache
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    node scripts\notify-instructors.mjs
) else (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\notify-instructors.mjs
)
echo.
pause
