# 🚀 Auto PitaMedia Studio Web

Aplikasi otomatisasi publikasi video cerdas dan studio multi-platform untuk **Facebook Reels, Instagram Reels, dan TikTok**. Dilengkapi dengan pemindai folder lokal otomatis, penjadwalan cerdas berbasis *Golden Retention Hours* (Slot Jam Emas), generator caption berbasis AI (Google Gemini), dan sistem proteksi anti-duplikasi konten.

---

## 🌟 Fitur Utama

1. **Sistem Proteksi Anti-Duplikasi (Hard Reject & Skip Otomatis):**
   - Mencegah postingan ganda antar platform (Facebook, Instagram, TikTok).
   - Penolakan otomatis pada tingkat modal dan backend jika video sudah terbit lengkap.
   - Filter parsial: hanya menjadwalkan ke akun/platform yang belum pernah menerbitkan video tersebut.
   - *Pre-Flight Verification* sesaat sebelum video dikirim ke API platform.

2. **Pemilih Detik Frame Cover / Thumbnail Video:**
   - Pratinjau langsung 9:16 di browser.
   - Slider presisi detik `0.5s` s/d `5.0s`.
   - Preset cepat: `✨ Auto Menjual (1.8s)` (titik retensi hook visual), `1.0s`, `2.5s`, dan `3.5s`.
   - Terintegrasi langsung dengan Meta Reels API (`thumb_offset`) dan TikTok API (`video_cover_timestamp_ms`).

3. **Antrean Publikasi & Manajemen Sampah:**
   - Tombol `🗑️ Hapus` di setiap baris antrean.
   - Tombol `🧹 Bersihkan yang Dibatalkan` untuk membersihkan seluruh antrean gagal/dibatalkan dalam 1 klik.
   - Filter fokus pada antrean aktif (`READY` / `UPLOADING`).

4. **Multi-Akun & Multi-Niche:**
   - Dukungan menghubungkan banyak akun Facebook Page, Instagram Professional/Creator, dan TikTok.
   - Multi-Credential Fallback System untuk TikTok API.
   - Pemantau folder video master otomatis (*local folder watcher*).

5. **AI Caption Generator (Google Gemini):**
   - Pembuatan hook, caption bercerita, dan rekomendasi hashtag otomatis per niche.
   - Kunci caption manual untuk menjaga teks yang sudah disunting.

---

## 🛠️ Instalasi & Menjalankan Aplikasi

### 1. Kebutuhan Sistem
- [Node.js](https://nodejs.org/) versi 18 atau lebih baru (disarankan Node.js 22 LTS).

### 2. Klon Repositori
```bash
git clone https://github.com/Nedysianturi/Auto-Pita-Media-Web.git
cd Auto-Pita-Media-Web
```

### 3. Instal Dependensi
```bash
npm install
```

### 4. Jalankan Server
```bash
npm start
```
Buka browser Anda dan akses:
👉 **http://localhost:3000**

---

## 📁 Struktur Proyek
- `server.js` - Backend Express, SQLite Database Sync, Meta & TikTok API handlers, folder watcher, background scheduler.
- `public/` - Antarmuka pengguna responsif (HTML, Vanilla CSS, JavaScript).
  - `index.html` - Dashboard utama, modal jadwal, canvas cover selector, video player, analitik.
  - `logo.png`, `app_icon.ico` - Aset visual.
- `package.json` - Konfigurasi dependensi project.
- `Buka-AutoPitaMedia.bat` / `Buka-PitaMedia.vbs` - Launcher sekali klik untuk pengguna Windows.

---

## 📄 Lisensi
Dikelola oleh Tim PitaMedia Studio.
