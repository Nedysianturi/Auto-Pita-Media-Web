@echo off
title Hapus Auto-Start Windows - Auto PitaMedia Studio
color 0C
echo ========================================================
echo   MENGHAPUS AUTO-START WINDOWS
echo ========================================================
echo.

set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_DIR%\PitaMedia-AutoStart.lnk"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [SUKSES] Pintasan Startup berhasil dihapus.
    echo Aplikasi tidak akan lagi otomatis berjalan saat komputer baru menyala.
) else (
    echo [INFO] Pintasan Startup tidak ditemukan atau sudah dihapus sebelumnya.
)

echo.
pause
