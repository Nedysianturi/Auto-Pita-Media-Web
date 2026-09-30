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

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%VBS_SCRIPT%\"'; $s.WorkingDirectory = '%TARGET_DIR%'; $s.WindowStyle = 7; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo.
    echo [SUKSES] Pintasan Startup berhasil dipasang!
    echo Lokasi: %SHORTCUT_PATH%
    echo.
    echo Sekarang, setiap kali komputer Anda dinyalakan atau direstart,
    echo Auto PitaMedia Studio akan OTOMATIS berjalan di latar belakang (tanpa jendela hitam)!
    echo.
) else (
    echo.
    echo [GAGAL] Gagal membuat pintasan. Pastikan Anda memiliki izin akses.
)

pause
