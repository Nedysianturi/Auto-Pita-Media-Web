@echo off
title PitaMedia Studio - Launcher
color 0b
echo ========================================================
echo       🚀 MEMULAI PITAMEDIA STUDIO (DESKTOP MODE)
echo ========================================================
echo.

:: 1. Cek Instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Harap unduh dan pasang Node.js terlebih dahulu dari:
    echo 👉 https://nodejs.org/ (Pilih versi LTS)
    echo.
    pause
    exit /b
)

:: 2. Cek Folder Dependensi
if not exist "node_modules\" (
    echo [SETUP] Memasang pustaka modul aplikasi pertama kali...
    call npm install
    echo.
)

:: 3. Jalankan Server di Background
echo [START] Menyalakan server lokal PitaMedia Studio...
start "" /b node server.js

:: Tunggu 2 detik agar server siap
timeout /t 2 /nobreak >nul

:: 4. Buka Browser Otomatis
echo [BROWSER] Membuka dashboard aplikasi di browser...
start http://localhost:3000

echo.
echo ========================================================
echo  ✅ Aplikasi berhasil berjalan di: http://localhost:3000
echo  Jendela ini dapat Anda minimize (jangan ditutup).
echo ========================================================
echo.
pause
