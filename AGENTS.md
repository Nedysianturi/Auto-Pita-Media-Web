# Auto PitaMedia Studio - Agent Guidelines & Context

Dokumen ini adalah panduan resmi untuk setiap **Agent AI Antigravity** yang melanjutkan pengembangan proyek ini.

---

## 🎯 Ringkasan Proyek
**Auto PitaMedia Studio** adalah aplikasi desktop/web otomatisasi penerbitan konten video Reels, foto tunggal, dan carousel multi-foto ke platform **Facebook Page** dan **Instagram Professional/Creator** untuk dua niche utama:
1. **PitaMisteri.tv** (Horor & Misteri)
2. **Pitarekaman** / Pitarekaman.tv (Rekaman & Arsip Audio-Visual)

Semua operasi berjalan secara **100% mandiri di komputer lokal pengguna (Windows)** menggunakan basis data **SQLite**, didukung integrasi **Google Gemini AI** untuk copywriting, dan sinkronisasi **Google Sheets** untuk pelaporan/audit.

---

## 📂 Lokasi Folder Kerja & Repositori
- **Workspace Lokal:** `C:\Users\Cipad\.gemini\antigravity-ide\scratch\pitamedia-studio`
- **GitHub Repository:** `https://github.com/Nedysianturi/Auto-Pita-Media-Web.git` (Branch: `main`)
- **Port Server Web:** `http://localhost:3000`
- **File Database:** `data.sqlite` (SQLite terintegrasi via `node:sqlite`)

---

## 🏗️ Arsitektur & File Utama
1. **`server.js` (Backend Node.js v24)**
   - **Database:** SQLite native (`node:sqlite`). Tabel: `niches`, `accounts`, `media`, `posts`, `schedules`, `jobs`, `performance`, `settings`, `licenses`, `ai_settings`, `meta_schedules`.
   - **File Watcher:** Memantau folder video master fisik pengguna (`C:\Users\Cipad\Downloads\IntisariClips\Master Videos\...`).
   - **Media Formats:**
     - `VIDEO`: Video Reels dengan opsi BGM/SFX mixing dan Outro CTA stitching via `ffmpeg`.
     - `IMAGE`: Foto tunggal (`.jpg`, `.jpeg`, `.png`, `.webp`) dipublikasikan langsung ke Facebook feed & Instagram container via Meta CDN staging (`uploadPhotoToMetaCdn`).
     - `CAROUSEL`: Slide multi-foto (hingga 10 slide) didefinisikan via subfolder atau dipilih manual via Web UI. Dipublikasikan via `attached_media` (Facebook) dan container Carousel Instagram.
   - **Publishing Pipeline:** Meta Graph API v20.0 (Facebook Video/Photo API & Instagram Graph API).
   - **AI Engine:** Google Gemini AI API (`@google/genai` atau REST API) untuk generate judul, caption, hashtag, dan hook.
   - **Performance & Cache:**
     - `_cachedHwid`: HWID fingerprint di-cache di memori agar tidak menjalankan PowerShell berulang kali.
     - `autoSyncLocalFolders` & `autoScheduleUnscheduledMedia`: Dibatasi *throttle* jeda waktu agar API dashboard merespons instan (<250 ms).
     - `temp_mixed/thumbs`: Cache disk untuk frame thumbnail video sehingga respon gambar secepat 3 ms.
   - **Sistem Lisensi 1-PC Lock:**
     - Algoritma hashing hardware (UUID, CPU ID, MachineGuid).
     - Developer Master License: Pemilik = `kennedi`, Email = `Cipadata@gmail.com`.

2. **`public/index.html` (Frontend Single Page Application)**
   - Tampilan UI berbasis Glassmorphism modern, responsive, dan bersih.
   - Fitur Tab:
     1. **Dashboard & Operasional:** Ringkasan statistik, filter format media, tombol Aksi Cepat.
     2. **Pustaka Media:** Koleksi video Reels, foto, carousel slide, pemilihan frame sampul video visual, manual caption editor.
     3. **Kelola Jadwal & Antrean:** Slot jadwal tayang, kalender posting, antrean aktif, riwayat terbit.
     4. **Kalender Meta Creator Studio:** Sinkronisasi jadwal posting dari Meta.
     5. **Analitik & Insights:** Grafik performa, views, likes, comments, shares, impresi.
     6. **Pengaturan:** 1 Unified Master Control Banner, Lisensi & Developer Hub, AI & Google Sheets Sync, Database Backup & Storage Cleaner.

---

## 🔒 Aturan Krusial & Pantangan Pengembang (Do's & Don'ts)
1. **JANGAN merusak pipeline Video Reels yang sudah berjalan lancar:**
   - Seluruh muxing audio BGM, SFX, dan Outro CTA pada video Reels harus tetap utuh.
2. **Kunci Caption Manual (`manual_locked = 'TRUE'`):**
   - Jika caption ditulis manual di Web UI atau berasal dari file `.txt`, sistem dilarang menimpanya dengan AI atau sync otomatis.
3. **Tanpa Tunnel / Cloudflare / Layanan Pihak Ketiga:**
   - Foto dan Carousel di-upload langsung ke Meta CDN menggunakan fungsi `uploadPhotoToMetaCdn()` internal via token Facebook Page.
4. **Git Sync:**
   - Selalu commit dan push perubahan penting ke branch `main`.

---

## 🚀 Cara Menjalankan Aplikasi
1. Buka terminal di `C:\Users\Cipad\.gemini\antigravity-ide\scratch\pitamedia-studio`
2. Jalankan perintah:
   ```bash
   node server.js
   ```
3. Buka browser di `http://localhost:3000`
