@echo off
title Pasang Auto-Start Windows - Auto PitaMedia Studio
color 0A
echo ========================================================
echo   MEMASANG AUTO-START WINDOWS (24/7 BACKGROUND SERVICE)
echo ========================================================
echo.
echo Sedang mendaftarkan script Watchdog ke folder Startup Windows...

set "TARGET_DIR=%~dp0"
set "VBS_SCRIPT=%TARGET_DIR%PitaMedia-Daemon-Watchdog.vbs"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_DIR%\PitaMedia-AutoStart.lnk"

(
echo Set ws = CreateObject("WScript.Shell"^)
echo Set s = ws.CreateShortcut("%SHORTCUT_PATH%"^)
echo s.TargetPath = "wscript.exe"
echo s.Arguments = """%VBS_SCRIPT%"""
echo s.WorkingDirectory = "%TARGET_DIR%"
echo s.WindowStyle = 7
echo s.Save
) > "%TEMP%\create_pitamedia_lnk.vbs"

cscript //nologo "%TEMP%\create_pitamedia_lnk.vbs"
del /f /q "%TEMP%\create_pitamedia_lnk.vbs" 2>nul

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [SUKSES] Pintasan Startup berhasil terpasang!
    echo Lokasi: %SHORTCUT_PATH%
    echo.
    echo Sekarang, setiap kali komputer Anda dinyalakan atau direstart:
    echo Auto PitaMedia Studio akan OTOMATIS berjalan di latar belakang (tanpa jendela hitam)!
    echo.
) else (
    echo.
    echo [GAGAL] Gagal membuat pintasan. Pastikan izin administrator tersedia.
)

pause
