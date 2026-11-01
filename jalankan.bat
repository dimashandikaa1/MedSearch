@echo off
title Terjemah Medis Awam
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [!] Node.js belum terpasang.
  echo     Unduh versi LTS di https://nodejs.org lalu jalankan file ini lagi.
  echo.
  pause
  exit /b 1
)

if not exist ".env.local" (
  copy ".env.example" ".env.local" >nul
  echo.
  echo [1/3] File .env.local dibuat.
  echo       Notepad akan terbuka. Isi GEMINI_API_KEY, simpan, lalu TUTUP Notepad.
  echo.
  notepad ".env.local"
)

if not exist "node_modules" (
  echo.
  echo [2/3] Memasang dependensi, tunggu 1-3 menit...
  call npm install
  if errorlevel 1 (
    echo.
    echo [!] npm install gagal. Periksa koneksi internet lalu coba lagi.
    pause
    exit /b 1
  )
)

echo.
echo [3/3] Menjalankan server. Buka http://localhost:3000 di browser.
echo       Tekan Ctrl+C untuk berhenti.
echo.
call npm run dev
pause
