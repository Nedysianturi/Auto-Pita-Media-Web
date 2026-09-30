const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data.sqlite');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// === TikTok Multi-Credential Fallback System ===
// Jika satu app gagal, otomatis pakai yang berikutnya
const TIKTOK_APPS = [
  { key: 'sbaw4rectma8d8iefp', secret: 'KeitRlQQrpNCvEi1pXBm8z60hrgOXJ8d', label: 'App-1' },
  { key: 'sbaw70fqk3n60cnoxe', secret: 'W2UwF6oRcnYFXjQoIprpoO4SUowzAPHE', label: 'App-2' },
  { key: 'sbawfqgcpq8a1k6fwe', secret: 'I3Z8eTgGrD64FCL8cmk5BBbJUdlz8vzJ', label: 'App-3' }
];

function getTikTokApp(index = 0) {
  const i = Math.max(0, Math.min(index, TIKTOK_APPS.length - 1));
  return TIKTOK_APPS[i];
}

function getNextTikTokAppIndex(currentIndex) {
  return (currentIndex + 1) % TIKTOK_APPS.length;
}

try { db.exec("ALTER TABLE accounts ADD COLUMN tt_app_index INTEGER DEFAULT 0"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE niches ADD COLUMN mode_jadwal TEXT DEFAULT 'GOLDEN_SLOTS'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN cover_offset_ms INTEGER DEFAULT 1800"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN cover_offset_ms INTEGER DEFAULT 1800"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE media ADD COLUMN cover_offset_ms INTEGER DEFAULT 1800"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN bgm_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN bgm_category TEXT DEFAULT 'AUTO'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN bgm_volume REAL DEFAULT 0.15"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN sfx_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN sfx_category TEXT DEFAULT 'AUTO'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN sfx_volume REAL DEFAULT 0.60"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN bgm_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN bgm_category TEXT DEFAULT 'AUTO'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN bgm_volume REAL DEFAULT 0.15"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN sfx_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN sfx_category TEXT DEFAULT 'AUTO'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN sfx_volume REAL DEFAULT 0.60"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE niches ADD COLUMN default_bgm_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE niches ADD COLUMN default_bgm_category TEXT DEFAULT 'AUTO'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE niches ADD COLUMN default_sfx_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE niches ADD COLUMN default_sfx_category TEXT DEFAULT 'AUTO'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN outro_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE jobs ADD COLUMN outro_text TEXT"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN outro_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE posts ADD COLUMN outro_text TEXT"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE niches ADD COLUMN default_outro_enabled TEXT DEFAULT 'TRUE'"); } catch(e) { /* sudah ada */ }
try { db.exec("ALTER TABLE niches ADD COLUMN default_outro_text TEXT"); } catch(e) { /* sudah ada */ }

db.exec(`
  CREATE TABLE IF NOT EXISTS niches (
    niche_id TEXT PRIMARY KEY,
    nama TEXT,
    folder_path TEXT,
    aktif TEXT DEFAULT 'TRUE',
    mode_caption TEXT DEFAULT 'MANUAL',
    auto_jadwal TEXT DEFAULT 'TRUE',
    auto_publikasi TEXT DEFAULT 'TRUE',
    interval_menit INTEGER DEFAULT 90,
    jam_awal TEXT DEFAULT '08:00',
    jam_akhir TEXT DEFAULT '20:00',
    batas_harian INTEGER DEFAULT 20,
    instruksi_ai TEXT DEFAULT '',
    mode_jadwal TEXT DEFAULT 'GOLDEN_SLOTS',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS accounts (
    akun_id TEXT PRIMARY KEY,
    niche_id TEXT,
    platform TEXT,
    nama_akun TEXT,
    platform_user_id TEXT,
    token TEXT,
    aktif TEXT DEFAULT 'TRUE',
    privacy_level TEXT DEFAULT '',
    tt_consent TEXT DEFAULT 'FALSE',
    tt_app_index INTEGER DEFAULT 0,
    verified_at TEXT
  );

  CREATE TABLE IF NOT EXISTS media (
    media_id TEXT PRIMARY KEY,
    niche_id TEXT,
    file_path TEXT,
    nama_file TEXT,
    mime_type TEXT,
    file_size INTEGER DEFAULT 0,
    deskripsi TEXT DEFAULT '',
    caption_mode TEXT DEFAULT 'MANUAL',
    caption_manual TEXT DEFAULT '',
    status TEXT DEFAULT 'SIAP',
    cover_offset_ms INTEGER DEFAULT 1800,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    konten_id TEXT PRIMARY KEY,
    media_id TEXT,
    caption_utama TEXT DEFAULT '',
    caption_ai TEXT DEFAULT '',
    hashtags TEXT DEFAULT '',
    status TEXT DEFAULT 'DRAFT',
    cover_offset_ms INTEGER DEFAULT 1800,
    manual_locked TEXT DEFAULT 'FALSE',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS schedules (
    jadwal_id TEXT PRIMARY KEY,
    konten_id TEXT,
    niche_id TEXT,
    tanggal_jam_wib TEXT,
    akun_ids_csv TEXT,
    status TEXT DEFAULT 'READY',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS jobs (
    job_id TEXT PRIMARY KEY,
    jadwal_id TEXT,
    konten_id TEXT,
    media_id TEXT,
    niche_id TEXT,
    akun_id TEXT,
    platform TEXT,
    scheduled_at TEXT,
    status TEXT DEFAULT 'READY',
    attempts INTEGER DEFAULT 0,
    platform_publish_id TEXT,
    post_url TEXT,
    last_error TEXT,
    cover_offset_ms INTEGER DEFAULT 1800,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS performance (
    perf_id TEXT PRIMARY KEY,
    niche_id TEXT,
    akun_id TEXT,
    platform TEXT,
    nama_video TEXT,
    posted_at TEXT,
    views_24h INTEGER DEFAULT 0,
    views_3d INTEGER DEFAULT 0,
    views_7d INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    source TEXT DEFAULT 'AUTO',
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS meta_schedules (
    meta_row_id TEXT PRIMARY KEY,
    niche_id TEXT,
    akun_id TEXT,
    platform TEXT,
    meta_post_id TEXT,
    scheduled_at TEXT,
    message TEXT,
    source TEXT,
    synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    kunci TEXT PRIMARY KEY,
    nilai TEXT
  );

  CREATE TABLE IF NOT EXISTS ai_settings (
    kunci TEXT PRIMARY KEY,
    nilai TEXT
  );
`);

console.log('[DB] Connected to SQLite database:', DB_PATH);

// Video Streaming Endpoint (HTTP 206 Partial Content)
app.get('/api/media/stream/:mediaId', (req, res) => {
  try {
    const media = db.prepare('SELECT file_path, mime_type FROM media WHERE media_id = ?').get(req.params.mediaId);
    if (!media || !media.file_path || !fs.existsSync(media.file_path)) {
      return res.status(404).send('File video tidak ditemukan di komputer.');
    }
    const stat = fs.statSync(media.file_path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(media.file_path, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': media.mime_type || 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': media.mime_type || 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(media.file_path).pipe(res);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Helper Utilities
function isoNow() {
  return new Date().toISOString();
}

function getSetting(key, defaultValue = '') {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setSetting(key, value, keterangan = '') {
  db.prepare('INSERT OR REPLACE INTO settings (key, value, keterangan) VALUES (?, ?, ?)')
    .run(key, String(value), keterangan);
}

// Auto-Sync Local Folders (Runs automatically on every data request and in background)
function autoSyncLocalFolders() {
  try {
    const niches = db.prepare('SELECT niche_id, nama, folder_path, mode_caption FROM niches').all();
    const videoExts = new Set(['.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v']);

    for (const niche of niches) {
      const folderPath = (niche.folder_path || '').trim();
      if (!folderPath || !fs.existsSync(folderPath)) continue;

      const stats = fs.statSync(folderPath);
      if (!stats.isDirectory()) continue;

      const files = fs.readdirSync(folderPath);
      const diskFilenames = new Set();

      for (const filename of files) {
        const ext = path.extname(filename).toLowerCase();
        if (!videoExts.has(ext)) continue;
        diskFilenames.add(filename);

        const fullPath = path.join(folderPath, filename);

        // Check if exists
        const existing = db.prepare('SELECT media_id, file_path FROM media WHERE niche_id = ? AND (nama_file = ? OR file_path = ?)').get(niche.niche_id, filename, fullPath);
        if (existing) {
          if (existing.file_path !== fullPath) {
            db.prepare('UPDATE media SET file_path = ? WHERE media_id = ?').run(fullPath, existing.media_id);
          }
          continue; // NEVER overwrite existing captions!
        }

        const fileStat = fs.statSync(fullPath);
        const mediaId = 'VID-' + crypto.randomUUID().slice(0, 8).toUpperCase();
        const kontenId = 'CNT-' + crypto.randomUUID().slice(0, 8).toUpperCase();

        // Check if there is an existing caption for this filename to restore
        const existingPost = db.prepare(`
          SELECT p.* FROM posts p 
          JOIN media m ON p.media_id = m.media_id 
          WHERE m.nama_file = ? AND p.caption_utama IS NOT NULL AND p.caption_utama != ''
        `).get(filename);

        const captionToUse = existingPost ? existingPost.caption_utama : filename.replace(/\.[^/.]+$/, '');
        const hashtagsToUse = existingPost ? (existingPost.hashtags || '') : '';
        const lockedToUse = existingPost ? (existingPost.manual_locked || 'TRUE') : 'FALSE';

        db.prepare(`
          INSERT INTO media (media_id, niche_id, file_path, nama_file, mime_type, file_size, deskripsi, caption_mode, caption_manual, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          mediaId, niche.niche_id, fullPath, filename, 'video/mp4', fileStat.size,
          '', niche.mode_caption || 'MANUAL', captionToUse, 'SIAP', isoNow()
        );

        db.prepare(`
          INSERT INTO posts (konten_id, media_id, niche_id, mode_caption, caption_utama, caption_facebook, caption_instagram, caption_tiktok, hashtags, emoji, manual_locked, status, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          kontenId, mediaId, niche.niche_id, niche.mode_caption || 'MANUAL',
          captionToUse, '', '', '', hashtagsToUse, '', lockedToUse, 'READY', isoNow()
        );
      }

      // Hapus media di DB yang sudah tidak ada di disk
      const dbMedia = db.prepare('SELECT media_id, nama_file, file_path FROM media WHERE niche_id = ?').all(niche.niche_id);
      for (const m of dbMedia) {
        if (!diskFilenames.has(m.nama_file) && (!m.file_path || !fs.existsSync(m.file_path))) {
          db.prepare('DELETE FROM media WHERE media_id = ?').run(m.media_id);
          db.prepare("DELETE FROM posts WHERE media_id = ? AND manual_locked != 'TRUE'").run(m.media_id);
          db.prepare("DELETE FROM jobs WHERE media_id = ? AND status NOT IN ('PUBLISHED', 'UPLOADING')").run(m.media_id);
        }
      }
    }
  } catch (err) {
    console.error('[AUTO SYNC ERROR]', err.message);
  }
}

// === Auto-Scheduling Engine ===
function parseTime(timeStr, defaultHour, defaultMin) {
  if (!timeStr) return { hour: defaultHour, min: defaultMin };
  const parts = String(timeStr).trim().split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  return {
    hour: isNaN(h) ? defaultHour : h,
    min: isNaN(m) ? defaultMin : m
  };
}

function padZero(n) { return String(n).padStart(2, '0'); }

function getWibDate(date) {
  const utc = date.getTime();
  const wibTime = new Date(utc + 7 * 60 * 60 * 1000);
  return {
    year: wibTime.getUTCFullYear(),
    month: wibTime.getUTCMonth() + 1,
    day: wibTime.getUTCDate(),
    hour: wibTime.getUTCHours(),
    min: wibTime.getUTCMinutes()
  };
}

function fromWib(year, month, day, hour, min) {
  return new Date(Date.UTC(year, month - 1, day, hour - 7, min, 0));
}

function formatWibString(year, month, day, hour, min) {
  return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hour)}:${padZero(min)}`;
}

function hasValidCaption(caption, fileName) {
  if (!caption) return false;
  const c = String(caption).trim();
  if (c.length < 10) return false;
  const raw = String(fileName || '').trim();
  const base = raw.replace(/\.[^/.]+$/, '').trim();
  if (c === raw || c === base) return false;
  return true;
}

// === BGM / Trending Audio Mixing Engine ===
function getBgmCatalogInfo() {
  const audioBase = path.join(__dirname, 'assets', 'audio');
  const catalog = {
    misteri: [],
    podcast: [],
    inspiratif: [],
    ceria: []
  };

  try {
    if (fs.existsSync(audioBase)) {
      Object.keys(catalog).forEach(cat => {
        const catDir = path.join(audioBase, cat);
        if (fs.existsSync(catDir)) {
          catalog[cat] = fs.readdirSync(catDir)
            .filter(f => f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.wav') || f.toLowerCase().endsWith('.m4a'));
        }
      });
    }
  } catch (e) {
    console.error('[BGM CATALOG ERROR]', e.message);
  }

  return catalog;
}

function pickAudioTrackForMedia(media, categoryPreference = 'AUTO') {
  const audioBase = path.join(__dirname, 'assets', 'audio');
  if (!fs.existsSync(audioBase)) return null;

  let targetCat = categoryPreference ? String(categoryPreference).toLowerCase() : 'auto';
  if (targetCat === 'auto' || !['misteri', 'podcast', 'inspiratif', 'ceria'].includes(targetCat)) {
    const raw = (String((media && media.nama_file) || '') + ' ' + String((media && media.niche_id) || '')).toLowerCase();
    if (raw.includes('misteri') || raw.includes('rjl5') || raw.includes('horor') || raw.includes('hantu') || raw.includes('malam') || raw.includes('jin') || raw.includes('pocong') || raw.includes('sajen')) {
      targetCat = 'misteri';
    } else if (raw.includes('komedi') || raw.includes('lucu') || raw.includes('hiburan') || raw.includes('ngakak') || raw.includes('bambu')) {
      targetCat = 'ceria';
    } else if (raw.includes('inspirasi') || raw.includes('sedih') || raw.includes('haru') || raw.includes('perjuangan') || raw.includes('ibu') || raw.includes('tangis') || raw.includes('keguguran') || raw.includes('diusir')) {
      targetCat = 'inspiratif';
    } else {
      targetCat = 'podcast';
    }
  }

  const catDir = path.join(audioBase, targetCat);
  if (!fs.existsSync(catDir)) return null;

  const files = fs.readdirSync(catDir).filter(f => f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.wav') || f.toLowerCase().endsWith('.m4a'));
  if (!files.length) return null;

  const chosen = files[Math.floor(Math.random() * files.length)];
  return {
    category: targetCat,
    name: chosen,
    path: path.join(catDir, chosen)
  };
}

// === SFX / Hook Sound Effects Catalog Engine ===
function getSfxCatalogInfo() {
  const sfxBase = path.join(__dirname, 'assets', 'sfx');
  const catalog = {
    misteri: [],
    podcast: [],
    inspiratif: [],
    ceria: []
  };

  try {
    if (fs.existsSync(sfxBase)) {
      Object.keys(catalog).forEach(cat => {
        const catDir = path.join(sfxBase, cat);
        if (fs.existsSync(catDir)) {
          catalog[cat] = fs.readdirSync(catDir)
            .filter(f => f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.wav') || f.toLowerCase().endsWith('.m4a'));
        }
      });
    }
  } catch (e) {
    console.error('[SFX CATALOG ERROR]', e.message);
  }

  return catalog;
}

function pickSfxTrackForMedia(media, categoryPreference = 'AUTO') {
  const sfxBase = path.join(__dirname, 'assets', 'sfx');
  if (!fs.existsSync(sfxBase)) return null;

  let targetCat = categoryPreference ? String(categoryPreference).toLowerCase() : 'auto';
  if (targetCat === 'auto' || !['misteri', 'podcast', 'inspiratif', 'ceria'].includes(targetCat)) {
    const raw = (String((media && media.nama_file) || '') + ' ' + String((media && media.niche_id) || '')).toLowerCase();
    if (raw.includes('misteri') || raw.includes('rjl5') || raw.includes('horor') || raw.includes('hantu') || raw.includes('malam') || raw.includes('jin') || raw.includes('pocong') || raw.includes('sajen')) {
      targetCat = 'misteri';
    } else if (raw.includes('komedi') || raw.includes('lucu') || raw.includes('hiburan') || raw.includes('ngakak') || raw.includes('bambu')) {
      targetCat = 'ceria';
    } else if (raw.includes('inspirasi') || raw.includes('sedih') || raw.includes('haru') || raw.includes('perjuangan') || raw.includes('ibu') || raw.includes('tangis') || raw.includes('keguguran') || raw.includes('diusir')) {
      targetCat = 'inspiratif';
    } else {
      targetCat = 'podcast';
    }
  }

  const catDir = path.join(sfxBase, targetCat);
  if (!fs.existsSync(catDir)) return null;

  const files = fs.readdirSync(catDir).filter(f => f.toLowerCase().endsWith('.mp3') || f.toLowerCase().endsWith('.wav') || f.toLowerCase().endsWith('.m4a'));
  if (!files.length) return null;

  const chosen = files[Math.floor(Math.random() * files.length)];
  return {
    category: targetCat,
    name: chosen,
    path: path.join(catDir, chosen)
  };
}

// ==========================================
// 🛡️ INTERNAL ANTI-SHADOWBAN DICTIONARY (KAMUS SENSOR KATA TERLARANG)
// Mencegah akun terkena shadowban, batasan jangkauan, atau strike
// pada algoritma Facebook Reels, Instagram Reels, dan TikTok
// ==========================================
const ANTI_SHADOWBAN_DICTIONARY = [
  // 1. Kekerasan, Kematian, Pembunuhan & Bahaya Fisik (Multi-kata didahulukan)
  { pattern: /\bgantung\s+diri\b/gi, replacement: 'mengakhiri hidup' },
  { pattern: /\bbunuh\s+diri\b/gi, replacement: 'mengakhiri hidup' },
  { pattern: /\bpelecehan\s+seksual\b/gi, replacement: 'tindakan tidak pantas' },
  { pattern: /\bserangan\s+jantung\b/gi, replacement: 'kondisi darurat medis' },
  { pattern: /\bputus\s+urat\s+nadi\b/gi, replacement: 'luka parah' },
  { pattern: /\bmenumpahkan\s+darah\b/gi, replacement: 'menyebabkan luka' },
  { pattern: /\bair\s+keras\b/gi, replacement: 'cairan kimia berbahaya' },
  { pattern: /\bopen\s+bo\b/gi, replacement: 'open b*' },

  // Tindakan & Kematian
  { pattern: /\bpembunuhan\s+berencana\b/gi, replacement: 'kasus tragis terencana' },
  { pattern: /\bpembunuhan\b/gi, replacement: 'kasus tragis' },
  { pattern: /\bmembunuh\b/gi, replacement: 'menghabisi' },
  { pattern: /\bdibunuh\b/gi, replacement: 'dihabisi' },
  { pattern: /\bpembunuh\b/gi, replacement: 'pelaku' },
  { pattern: /\bbunuh\b/gi, replacement: 'b*nuh' },

  { pattern: /\bmutilasi\b/gi, replacement: 'm*tilasi' },
  { pattern: /\bdimutilasi\b/gi, replacement: 'tindakan keji' },
  { pattern: /\bdibacok\b/gi, replacement: 'diserang' },
  { pattern: /\bmbacok\b/gi, replacement: 'menyerang' },
  { pattern: /\bbacok\b/gi, replacement: 'b*cok' },
  { pattern: /\bditusuk\b/gi, replacement: 'diserang senjata tajam' },
  { pattern: /\bmenusuk\b/gi, replacement: 'melukai' },
  { pattern: /\btusuk\b/gi, replacement: 't*suk' },
  { pattern: /\bdisiksa\b/gi, replacement: 'dianiaya' },
  { pattern: /\bmenyiksa\b/gi, replacement: 'menganiaya' },
  { pattern: /\bpenyiksaan\b/gi, replacement: 'penganiayaan' },
  { pattern: /\bsiksa\b/gi, replacement: 's*ksa' },
  { pattern: /\bdiracun\b/gi, replacement: 'diberi zat berbahaya' },
  { pattern: /\bracun\b/gi, replacement: 'r*cun' },

  { pattern: /\btewas\b/gi, replacement: 't*was' },
  { pattern: /\bkematian\b/gi, replacement: 'kepergian' },
  { pattern: /\bmati\b/gi, replacement: 'meninggal' },
  { pattern: /\bmayat\b/gi, replacement: 'jasad' },
  { pattern: /\bjenazah\b/gi, replacement: 'jasad' },
  { pattern: /\bbangkai\b/gi, replacement: 'jasad' },
  { pattern: /\bberdarah\b/gi, replacement: 'terluka' },
  { pattern: /\bdarah\b/gi, replacement: 'd*rah' },

  // Senjata
  { pattern: /\bsenjata\s+api\b/gi, replacement: 'senpi' },
  { pattern: /\bsenjata\b/gi, replacement: 's*njata' },
  { pattern: /\bpistol\b/gi, replacement: 'p*stol' },
  { pattern: /\bsenapan\b/gi, replacement: 's*napan' },
  { pattern: /\bpeluru\b/gi, replacement: 'p*luru' },
  { pattern: /\bcelurit\b/gi, replacement: 'sajam' },
  { pattern: /\bparang\b/gi, replacement: 'sajam' },
  { pattern: /\bbom\b/gi, replacement: 'b*m' },
  { pattern: /\bledakan\b/gi, replacement: 'dentuman keras' },

  // 2. Seksualitas, Asusila & Pelecehan
  { pattern: /\bpemerkosaan\b/gi, replacement: 'tindakan asusila' },
  { pattern: /\bmemerkosa\b/gi, replacement: 'melecehkan' },
  { pattern: /\bdiperkosa\b/gi, replacement: 'dilecehkan' },
  { pattern: /\bperkosa\b/gi, replacement: 'p*rkosa' },
  { pattern: /\bpelecehan\b/gi, replacement: 'tindakan tak pantas' },
  { pattern: /\bcabul\b/gi, replacement: 'tindakan asusila' },
  { pattern: /\btelanjang\b/gi, replacement: 'tanpa busana' },
  { pattern: /\bmesum\b/gi, replacement: 'asusila' },
  { pattern: /\bporno\b/gi, replacement: 'p*rno' },
  { pattern: /\bbokep\b/gi, replacement: 'konten dewasa' },
  { pattern: /\bprostitusi\b/gi, replacement: 'pr*stitusi' },
  { pattern: /\bpelacur\b/gi, replacement: 'p*lacur' },
  { pattern: /\blontek?\b/gi, replacement: 'l*nte' },
  { pattern: /\bperek\b/gi, replacement: 'p*rek' },

  // 3. Narkoba & Zat Ilegal
  { pattern: /\bnarkoba\b/gi, replacement: 'n*rkoba' },
  { pattern: /\bnarkotika\b/gi, replacement: 'zat terlarang' },
  { pattern: /\bsabu-sabu\b/gi, replacement: 'zat terlarang' },
  { pattern: /\bsabu\b/gi, replacement: 's*bu' },
  { pattern: /\bganja\b/gi, replacement: 'g*nja' },
  { pattern: /\bheroin\b/gi, replacement: 'h*roin' },
  { pattern: /\bekstasi\b/gi, replacement: 'ekst*si' },
  { pattern: /\bmiras\b/gi, replacement: 'minuman terlarang' },

  // 4. Mistis & Horor Ekstrem
  { pattern: /\bsantet\b/gi, replacement: 's*ntet' },
  { pattern: /\bguna-guna\b/gi, replacement: 'ilmu gaib' },
  { pattern: /\bpesugihan\b/gi, replacement: 'ritual terlarang' },
  { pattern: /\btumbal\b/gi, replacement: 't*mbal' },
  { pattern: /\bkerasukan\b/gi, replacement: 'gangguan gaib' },

  // 5. Ujaran Kasar / Profanitas
  { pattern: /\banjing\b/gi, replacement: 'anj*ng' },
  { pattern: /\bbabi\b/gi, replacement: 'b*bi' },
  { pattern: /\bbangsat\b/gi, replacement: 'b*ngsat' },
  { pattern: /\bbajingan\b/gi, replacement: 'b*jingan' },
  { pattern: /\bkontol\b/gi, replacement: 'k*ntol' },
  { pattern: /\bmemek\b/gi, replacement: 'm*mek' },
  { pattern: /\bitil\b/gi, replacement: 'i*il' },
  { pattern: /\bjembut\b/gi, replacement: 'j*mbut' },
  { pattern: /\bpantek\b/gi, replacement: 'p*ntek' },
  { pattern: /\bpepek\b/gi, replacement: 'p*pek' },
  { pattern: /\bkampret\b/gi, replacement: 'k*mpret' },
  { pattern: /\bbrengsek\b/gi, replacement: 'br*ngsek' },
  { pattern: /\bgoblok\b/gi, replacement: 'g*blok' },
  { pattern: /\btolol\b/gi, replacement: 't*lol' },
  { pattern: /\bidiot\b/gi, replacement: 'i*iot' }
];

function sanitizeCaptionAntiShadowban(text) {
  if (!text || typeof text !== 'string') return text;
  let sanitized = text;
  for (const item of ANTI_SHADOWBAN_DICTIONARY) {
    sanitized = sanitized.replace(item.pattern, item.replacement);
  }
  return sanitized;
}

function detectSensitiveWords(text) {
  if (!text || typeof text !== 'string') return [];
  const found = [];
  for (const item of ANTI_SHADOWBAN_DICTIONARY) {
    if (item.pattern.test(text)) {
      found.push(item.pattern.source.replace(/\\b/g, ''));
    }
  }
  return Array.from(new Set(found));
}

function getDefaultOutroText(nicheNameOrId) {
  const str = String(nicheNameOrId || '').toLowerCase();
  if (str.includes('rekaman') || str.includes('podcast')) {
    return '🔔 Suka video ini? Follow @Pitarekaman.tv untuk obrolan seru lainnya!';
  }
  return '🔔 Suka cerita ini? Follow @PitaMisteri.tv untuk kisah berikutnya!';
}

function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const proc = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    let out = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.on('close', code => {
      const dur = parseFloat(out.trim());
      resolve(Number.isFinite(dur) && dur > 0 ? dur : 0);
    });
    proc.on('error', () => resolve(0));
  });
}

async function mixVideoWithAudio(videoPath, bgmAudioPath = null, volumeMusic = 0.15, sfxAudioPath = null, volumeSfx = 0.60, outroText = null) {
  const tempDir = path.join(__dirname, 'temp_mixed');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const outExt = path.extname(videoPath) || '.mp4';
  const outputPath = path.join(tempDir, `mixed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${outExt}`);

  const volBgm = Math.max(0.02, Math.min(0.5, parseFloat(volumeMusic) || 0.15));
  const volSfx = Math.max(0.1, Math.min(1.0, parseFloat(volumeSfx) || 0.60));

  const hasBgm = bgmAudioPath && fs.existsSync(bgmAudioPath);
  const hasSfx = sfxAudioPath && fs.existsSync(sfxAudioPath);
  const hasOutro = !!(outroText && String(outroText).trim());

  if (!hasBgm && !hasSfx && !hasOutro) {
    return null;
  }

  let duration = 0;
  let drawtextFilter = '';
  if (hasOutro) {
    duration = await getVideoDuration(videoPath);
    const startT = Math.max(0, duration - 3.2).toFixed(2);
    // Bersihkan emoji agar tidak merender kotak kosong di font Windows, lalu escape karakter khusus FFmpeg drawtext
    const cleanText = String(outroText).replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim() || 'Suka video ini? Follow channel kami untuk kisah berikutnya!';
    const safeText = cleanText
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "'\\\\''")
      .replace(/:/g, '\\:')
      .replace(/%/g, '%%');

    const fontFile = 'C\\:/Windows/Fonts/segoeuib.ttf';
    drawtextFilter = `drawtext=fontfile='${fontFile}':text='${safeText}':fontcolor=white:fontsize=34:box=1:boxcolor=black@0.85:boxborderw=18:x=(w-text_w)/2:y=h-680:enable='gte(t,${startT})'`;
  }

  const { spawn } = require('child_process');
  const args = ['-y', '-i', videoPath];

  let audioFilter = '';
  if (hasBgm && hasSfx) {
    args.push('-stream_loop', '-1', '-i', bgmAudioPath);
    args.push('-i', sfxAudioPath);
    audioFilter = `[0:a]volume=1.0[v];[1:a]volume=${volBgm}[m];[2:a]volume=${volSfx}[s];[v][m][s]amix=inputs=3:duration=first:dropout_transition=2[aout]`;
  } else if (hasBgm) {
    args.push('-stream_loop', '-1', '-i', bgmAudioPath);
    audioFilter = `[0:a]volume=1.0[v];[1:a]volume=${volBgm}[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
  } else if (hasSfx) {
    args.push('-i', sfxAudioPath);
    audioFilter = `[0:a]volume=1.0[v];[1:a]volume=${volSfx}[s];[v][s]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
  }

  if (hasOutro && audioFilter) {
    // Both outro overlay and audio mixing
    const filterComplex = `[0:v]${drawtextFilter}[vout];${audioFilter}`;
    args.push(
      '-filter_complex', filterComplex,
      '-map', '[vout]',
      '-map', '[aout]',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '20',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outputPath
    );
  } else if (hasOutro && !audioFilter) {
    // Outro overlay only, audio copied directly
    args.push(
      '-vf', drawtextFilter,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '20',
      '-c:a', 'copy',
      outputPath
    );
  } else if (!hasOutro && audioFilter) {
    // Audio mixing only, video copied directly (ultra fast)
    args.push(
      '-filter_complex', audioFilter,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      outputPath
    );
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let errOutput = '';
    proc.stderr.on('data', d => { errOutput += d.toString(); });
    proc.on('close', code => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${errOutput.slice(-200)}`));
      }
    });
    proc.on('error', err => reject(err));
  });
}


function getPublishedMediaInfo(mediaId, namaFile) {
  const platforms = new Set();
  const accounts = new Set();
  try {
    const rawFile = String(namaFile || '').trim();
    const baseName = rawFile.replace(/\.[^/.]+$/, '').trim();

    // 1. Cek di tabel jobs (status = 'PUBLISHED')
    const jobRows = db.prepare(`
      SELECT DISTINCT platform, akun_id 
      FROM jobs 
      WHERE status = 'PUBLISHED'
        AND (
          media_id = ? 
          OR media_id IN (SELECT media_id FROM media WHERE nama_file = ? OR nama_file LIKE ?)
        )
    `).all(mediaId, rawFile, `%${baseName}%`);
    jobRows.forEach(r => {
      if (r.platform) platforms.add(r.platform.toUpperCase());
      if (r.akun_id) accounts.add(r.akun_id);
    });

    // 2. Cek di tabel performance (riwayat upload & analitik)
    const perfRows = db.prepare(`
      SELECT DISTINCT platform, akun_id 
      FROM performance 
      WHERE nama_video = ? 
         OR nama_video = ? 
         OR nama_video LIKE ?
    `).all(rawFile, mediaId, `%${baseName}%`);
    perfRows.forEach(r => {
      if (r.platform) platforms.add(r.platform.toUpperCase());
      if (r.akun_id) accounts.add(r.akun_id);
    });

    // 3. Cek di meta_schedules
    try {
      const metaRows = db.prepare(`
        SELECT DISTINCT platform, akun_id 
        FROM meta_schedules 
        WHERE (message LIKE ? OR message LIKE ?)
      `).all(`%${baseName}%`, `%${rawFile}%`);
      metaRows.forEach(r => {
        if (r.platform) platforms.add(r.platform.toUpperCase());
        if (r.akun_id) accounts.add(r.akun_id);
      });
    } catch(e) {}

  } catch(e) {
    console.error('[getPublishedMediaInfo ERROR]', e.message);
  }

  const platformArr = Array.from(platforms);
  const accountArr = Array.from(accounts);
  const hasFb = platformArr.includes('FACEBOOK');
  const hasIg = platformArr.includes('INSTAGRAM');
  const hasTt = platformArr.includes('TIKTOK');

  return {
    platforms: platformArr,
    accounts: accountArr,
    hasFacebook: hasFb,
    hasInstagram: hasIg,
    hasTikTok: hasTt,
    isCompleteTriPlatform: hasFb && hasIg && hasTt
  };
}

function getPublishedPlatformsForMedia(mediaId, namaFile) {
  return getPublishedMediaInfo(mediaId, namaFile).platforms;
}

function isMediaFullyPublished(mediaId, namaFile, targetAccounts = []) {
  const pub = getPublishedMediaInfo(mediaId, namaFile);
  // Jika sudah lengkap terbit di Facebook, Instagram, dan TikTok
  if (pub.hasFacebook && pub.hasInstagram && pub.hasTikTok) return true;
  // Jika akun target untuk niche ini semuanya sudah terbit
  if (targetAccounts.length > 0) {
    const unposted = targetAccounts.filter(a => !pub.platforms.includes(a.platform.toUpperCase()) && !pub.accounts.includes(a.akun_id));
    if (unposted.length === 0) return true;
  }
  // Jika Facebook dan Instagram sudah terbit dan belum ada akun TikTok terdaftar
  if (pub.hasFacebook && pub.hasInstagram && !targetAccounts.some(a => a.platform === 'TIKTOK')) {
    return true;
  }
  return false;
}

const GOLDEN_SLOTS = [
  { hour: 7, min: 15, label: 'Pagi (07:15 WIB)' },
  { hour: 11, min: 30, label: 'Siang (11:30 WIB)' },
  { hour: 16, min: 30, label: 'Sore (16:30 WIB)' },
  { hour: 19, min: 0, label: 'Malam Prime (19:00 WIB)' },
  { hour: 21, min: 15, label: 'Malam Santai/Horor (21:15 WIB)' }
];

function getNextGoldenSlot(baseDate) {
  const wib = getWibDate(baseDate);
  const curYear = wib.year;
  const curMonth = wib.month;
  const curDay = wib.day;
  const curMins = wib.hour * 60 + wib.min;

  for (const slot of GOLDEN_SLOTS) {
    const slotMins = slot.hour * 60 + slot.min;
    if (slotMins >= curMins) {
      const utc = fromWib(curYear, curMonth, curDay, slot.hour, slot.min);
      return { year: curYear, month: curMonth, day: curDay, hour: slot.hour, min: slot.min, utc };
    }
  }

  // Next day first slot
  const nextDay = new Date(fromWib(curYear, curMonth, curDay, 0, 0).getTime() + 24 * 60 * 60 * 1000);
  const nw = getWibDate(nextDay);
  const firstSlot = GOLDEN_SLOTS[0];
  const utc = fromWib(nw.year, nw.month, nw.day, firstSlot.hour, firstSlot.min);
  return { year: nw.year, month: nw.month, day: nw.day, hour: firstSlot.hour, min: firstSlot.min, utc };
}

function autoScheduleUnscheduledMedia() {
  try {
    const isStopped = getSetting('STOP_GLOBAL', 'FALSE') === 'TRUE';
    if (isStopped) return;

    const niches = db.prepare("SELECT * FROM niches WHERE aktif = 'TRUE' AND auto_jadwal = 'TRUE'").all();

    for (const niche of niches) {
      const accounts = db.prepare("SELECT * FROM accounts WHERE niche_id = ? AND aktif = 'TRUE' AND token IS NOT NULL AND length(trim(token)) > 10").all(niche.niche_id);
      if (!accounts.length) continue;

      const allCandidates = db.prepare(`
        SELECT m.*, p.konten_id, p.caption_utama
        FROM media m
        JOIN posts p ON m.media_id = p.media_id
        WHERE m.niche_id = ?
          AND m.media_id NOT IN (SELECT DISTINCT media_id FROM jobs WHERE status != 'CANCELLED')
        ORDER BY m.rowid ASC
      `).all(niche.niche_id);

      // HANYA jadwalkan video yang SUDAH ADA caption nya (bukan cuma nama file mentah / kosong)
      const unscheduledMedia = allCandidates.filter(item => hasValidCaption(item.caption_utama, item.nama_file));
      if (!unscheduledMedia.length) continue;

      const maxSchedRow = db.prepare("SELECT MAX(scheduled_at) as max_sched FROM jobs WHERE niche_id = ? AND status != 'CANCELLED'").get(niche.niche_id);
      const latestScheduledIso = maxSchedRow ? maxSchedRow.max_sched : null;

      const modeJadwal = (niche.mode_jadwal || 'GOLDEN_SLOTS').toUpperCase();

      // MODE 1: SLOT JAM EMAS KHUSUS (07:15, 11:30, 16:30, 19:00, 21:15 WIB)
      if (modeJadwal === 'GOLDEN_SLOTS') {
        const now = new Date();
        let baseDate;
        if (latestScheduledIso) {
          const latestDate = new Date(latestScheduledIso);
          if (latestDate.getTime() > now.getTime()) {
            baseDate = new Date(latestDate.getTime() + 60 * 1000);
          } else {
            baseDate = new Date(now.getTime() + 15 * 60 * 1000);
          }
        } else {
          baseDate = new Date(now.getTime() + 15 * 60 * 1000);
        }

        for (const media of unscheduledMedia) {
          const publishedPlatforms = getPublishedPlatformsForMedia(media.media_id, media.nama_file);
          const neededAccounts = accounts.filter(acc => !publishedPlatforms.includes(acc.platform.toUpperCase()));

          if (!neededAccounts.length) {
            db.prepare("UPDATE media SET status = 'PUBLISHED' WHERE media_id = ?").run(media.media_id);
            console.log(`[AUTO-SCHEDULER SKIP] Video "${media.nama_file}" dilewati karena sudah lengkap terbit di ${publishedPlatforms.join(', ')}.`);
            continue;
          }

          const slot = getNextGoldenSlot(baseDate);
          const wibStr = formatWibString(slot.year, slot.month, slot.day, slot.hour, slot.min);
          const scheduledIso = slot.utc.toISOString();

          const jadwalId = 'SCH-' + crypto.randomUUID().slice(0, 8).toUpperCase();
          const akunIds = neededAccounts.map(a => a.akun_id);

          db.prepare(`
            INSERT INTO schedules (jadwal_id, konten_id, niche_id, tanggal_jam_wib, akun_ids_csv, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'READY', ?)
          `).run(jadwalId, media.konten_id, niche.niche_id, wibStr, akunIds.join(','), isoNow());

          for (const acc of neededAccounts) {
            const jobId = 'JOB-' + crypto.randomUUID().slice(0, 8).toUpperCase();
            db.prepare(`
              INSERT INTO jobs (job_id, jadwal_id, konten_id, media_id, niche_id, akun_id, platform, scheduled_at, status, attempts, updated_at, cover_offset_ms, bgm_enabled, bgm_category, bgm_volume, sfx_enabled, sfx_category, sfx_volume, outro_enabled, outro_text)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'READY', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(jobId, jadwalId, media.konten_id, media.media_id, niche.niche_id, acc.akun_id, acc.platform, scheduledIso, isoNow(), media.cover_offset_ms || 1800, niche.default_bgm_enabled || 'TRUE', niche.default_bgm_category || 'AUTO', 0.15, niche.default_sfx_enabled || 'TRUE', niche.default_sfx_category || 'AUTO', 0.60, niche.default_outro_enabled || 'TRUE', niche.default_outro_text || getDefaultOutroText(niche.nama || niche.niche_id));
          }

          db.prepare("UPDATE media SET status = 'TERJADWAL' WHERE media_id = ?").run(media.media_id);
          db.prepare("UPDATE posts SET status = 'SCHEDULED' WHERE konten_id = ?").run(media.konten_id);

          console.log(`[AUTO-SCHEDULER GOLDEN] Scheduled "${media.nama_file}" for ${niche.nama} at ${wibStr} WIB (${neededAccounts.length} platforms).`);

          baseDate = new Date(slot.utc.getTime() + 60 * 1000);
        }
        continue;
      }

      // MODE 2: INTERVAL BIASA
      const intervalMin = Math.max(15, parseInt(niche.interval_menit, 10) || 90);
      const startT = parseTime(niche.jam_awal, 8, 0);
      const endT = parseTime(niche.jam_akhir, 20, 0);
      const maxPerDay = Math.max(1, parseInt(niche.batas_harian, 10) || 20);

      const now = new Date();
      let baseDate;

      if (latestScheduledIso) {
        const latestDate = new Date(latestScheduledIso);
        if (latestDate.getTime() > now.getTime()) {
          baseDate = new Date(latestDate.getTime() + intervalMin * 60 * 1000);
        } else {
          baseDate = new Date(now.getTime() + 15 * 60 * 1000);
        }
      } else {
        baseDate = new Date(now.getTime() + 15 * 60 * 1000);
      }

      let wib = getWibDate(baseDate);
      let curYear = wib.year;
      let curMonth = wib.month;
      let curDay = wib.day;
      let curHour = wib.hour;
      let curMin = wib.min;

      curMin = Math.ceil(curMin / 5) * 5;
      if (curMin >= 60) {
        curHour += Math.floor(curMin / 60);
        curMin = curMin % 60;
      }

      const startMins = startT.hour * 60 + startT.min;
      const endMins = endT.hour * 60 + endT.min;
      const curMinsFromMidnight = curHour * 60 + curMin;

      if (curMinsFromMidnight < startMins) {
        curHour = startT.hour;
        curMin = startT.min;
      } else if (curMinsFromMidnight > endMins) {
        const nextDay = new Date(fromWib(curYear, curMonth, curDay, 0, 0).getTime() + 24 * 60 * 60 * 1000);
        const nw = getWibDate(nextDay);
        curYear = nw.year; curMonth = nw.month; curDay = nw.day;
        curHour = startT.hour; curMin = startT.min;
      }

      let dailyCount = 0;

      for (const media of unscheduledMedia) {
        const publishedPlatforms = getPublishedPlatformsForMedia(media.media_id, media.nama_file);
        const neededAccounts = accounts.filter(acc => !publishedPlatforms.includes(acc.platform.toUpperCase()));

        if (!neededAccounts.length) {
          db.prepare("UPDATE media SET status = 'PUBLISHED' WHERE media_id = ?").run(media.media_id);
          console.log(`[AUTO-SCHEDULER SKIP] Video "${media.nama_file}" dilewati karena sudah lengkap terbit di ${publishedPlatforms.join(', ')}.`);
          continue;
        }

        const curTotalMins = curHour * 60 + curMin;
        if (curTotalMins > endMins || dailyCount >= maxPerDay) {
          const nextDay = new Date(fromWib(curYear, curMonth, curDay, 0, 0).getTime() + 24 * 60 * 60 * 1000);
          const nw = getWibDate(nextDay);
          curYear = nw.year; curMonth = nw.month; curDay = nw.day;
          curHour = startT.hour; curMin = startT.min;
          dailyCount = 0;
        }

        const slotUtc = fromWib(curYear, curMonth, curDay, curHour, curMin);
        const wibStr = formatWibString(curYear, curMonth, curDay, curHour, curMin);
        const scheduledIso = slotUtc.toISOString();

        const jadwalId = 'SCH-' + crypto.randomUUID().slice(0, 8).toUpperCase();
        const akunIds = neededAccounts.map(a => a.akun_id);

        db.prepare(`
          INSERT INTO schedules (jadwal_id, konten_id, niche_id, tanggal_jam_wib, akun_ids_csv, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'READY', ?)
        `).run(
          jadwalId, media.konten_id, niche.niche_id, wibStr, akunIds.join(','), isoNow()
        );

        for (const acc of neededAccounts) {
          const jobId = 'JOB-' + crypto.randomUUID().slice(0, 8).toUpperCase();
          db.prepare(`
            INSERT INTO jobs (job_id, jadwal_id, konten_id, media_id, niche_id, akun_id, platform, scheduled_at, status, attempts, updated_at, cover_offset_ms, bgm_enabled, bgm_category, bgm_volume, sfx_enabled, sfx_category, sfx_volume, outro_enabled, outro_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'READY', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            jobId, jadwalId, media.konten_id, media.media_id, niche.niche_id, acc.akun_id, acc.platform, scheduledIso, isoNow(), media.cover_offset_ms || 1800, niche.default_bgm_enabled || 'TRUE', niche.default_bgm_category || 'AUTO', 0.15, niche.default_sfx_enabled || 'TRUE', niche.default_sfx_category || 'AUTO', 0.60, niche.default_outro_enabled || 'TRUE', niche.default_outro_text || getDefaultOutroText(niche.nama || niche.niche_id)
          );
        }

        db.prepare("UPDATE media SET status = 'TERJADWAL' WHERE media_id = ?").run(media.media_id);
        db.prepare("UPDATE posts SET status = 'SCHEDULED' WHERE konten_id = ?").run(media.konten_id);

        console.log(`[AUTO-SCHEDULER] Scheduled "${media.nama_file}" for ${niche.nama} at ${wibStr} WIB (${neededAccounts.length} platforms).`);

        dailyCount++;
        curMin += intervalMin;
        if (curMin >= 60) {
          curHour += Math.floor(curMin / 60);
          curMin = curMin % 60;
        }
      }
    }
  } catch (err) {
    console.error('[AUTO-SCHEDULER ERROR]', err.message);
  }
}

// 1. Dashboard Data
function getDashboardData() {
  autoSyncLocalFolders();
  autoScheduleUnscheduledMedia();
  const niches = db.prepare('SELECT * FROM niches').all();
  const accounts = db.prepare('SELECT * FROM accounts').all().map(a => ({
    ...a,
    tokenReady: Boolean(a.token && a.token.trim().length > 10)
  }));
  const rawMedia = db.prepare('SELECT * FROM media ORDER BY rowid DESC LIMIT 500').all();
  const media = rawMedia.map(m => {
    const pubInfo = getPublishedMediaInfo(m.media_id, m.nama_file);
    const nicheAccs = accounts.filter(a => {
      const isAccActive = a.aktif === 'TRUE' || a.aktif === true;
      const isMatchingNiche = String(a.niche_id || '').trim().toUpperCase() === String(m.niche_id || '').trim().toUpperCase();
      return isAccActive && isMatchingNiche;
    });
    const targetAccs = nicheAccs.length > 0 ? nicheAccs : accounts.filter(a => a.aktif === 'TRUE' || a.aktif === true);
    const isFullyPub = isMediaFullyPublished(m.media_id, m.nama_file, targetAccs);

    let currentStatus = m.status;
    if (isFullyPub && currentStatus !== 'PUBLISHED') {
      try {
        db.prepare("UPDATE media SET status = 'PUBLISHED' WHERE media_id = ?").run(m.media_id);
        currentStatus = 'PUBLISHED';
      } catch(e) {}
    }

    return {
      ...m,
      status: currentStatus,
      publishedPlatforms: pubInfo.platforms,
      publishedAccounts: pubInfo.accounts,
      isFullyPublished: isFullyPub
    };
  });
  const posts = db.prepare('SELECT * FROM posts ORDER BY rowid DESC LIMIT 500').all();
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY rowid DESC LIMIT 500').all();
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY scheduled_at ASC, rowid DESC LIMIT 500').all();
  // Ensure no duplicate technical VID- rows exist in performance table
  try {
    db.prepare("DELETE FROM performance WHERE nama_video LIKE 'VID-%'").run();
  } catch (e) {}
  const performance = db.prepare('SELECT * FROM performance ORDER BY rowid DESC LIMIT 500').all();
  const metaSchedules = db.prepare('SELECT * FROM meta_schedules ORDER BY scheduled_at ASC').all();
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const aiSettings = db.prepare('SELECT * FROM ai_settings').all();

  return {
    stopped: getSetting('STOP_GLOBAL', 'FALSE') === 'TRUE',
    niches: niches.map(n => ({
      ...n,
      aktif: n.aktif === 'TRUE' ? 'TRUE' : 'FALSE',
      auto_jadwal: n.auto_jadwal === 'TRUE' ? 'TRUE' : 'FALSE',
      auto_publikasi: n.auto_publikasi === 'TRUE' ? 'TRUE' : 'FALSE'
    })),
    accounts: accounts.map(a => ({
      ...a,
      aktif: a.aktif === 'TRUE' ? 'TRUE' : 'FALSE'
    })),
    media,
    posts,
    schedules,
    jobs,
    performance,
    driveSources: niches.map(n => ({
      niche_id: n.niche_id,
      folder_id: n.folder_path,
      status: 'AKTIF'
    })),
    uploadSessions: [],
    metaSchedules,
    settings: settingsRows,
    aiSettings,
    bgmCatalog: getBgmCatalogInfo(),
    sfxCatalog: getSfxCatalogInfo(),
    metaSync: {
      lastSync: getSetting('META_LAST_SYNC', ''),
      lastStatus: getSetting('META_LAST_STATUS', 'Belum disinkronkan'),
      lastError: getSetting('META_LAST_ERROR', '')
    },
    summary: {
      videos: media.length,
      queued: jobs.filter(j => j.status === 'READY').length,
      uploading: jobs.filter(j => j.status === 'UPLOADING').length,
      published: jobs.filter(j => j.status === 'PUBLISHED').length,
      metaScheduled: metaSchedules.length,
      attention: jobs.filter(j => ['BLOCKED', 'FAILED', 'UNKNOWN'].includes(j.status)).length
    }
  };
}

// 2. Scan Folder (Local Computer Folder or Drive Link)
function scanDrive(nicheId) {
  const niche = db.prepare('SELECT * FROM niches WHERE niche_id = ?').get(nicheId);
  if (!niche) throw new Error('Niche tidak ditemukan: ' + nicheId);

  const folderPath = (niche.folder_path || '').trim();
  if (!folderPath) {
    throw new Error('Path folder untuk niche ' + niche.nama + ' belum ditentukan.');
  }

  // Check if folderPath exists locally
  if (fs.existsSync(folderPath)) {
    const stats = fs.statSync(folderPath);
    if (!stats.isDirectory()) {
      throw new Error('Path yang ditentukan bukan sebuah folder: ' + folderPath);
    }

    const files = fs.readdirSync(folderPath);
    const videoExts = ['.mp4', '.mov', '.mkv', '.avi', '.webm', '.m4v'];
    const currentVideoFiles = new Set();
    let addedCount = 0;
    let removedCount = 0;

    for (const filename of files) {
      const ext = path.extname(filename).toLowerCase();
      if (!videoExts.includes(ext)) continue;
      currentVideoFiles.add(filename);

      const fullPath = path.join(folderPath, filename);
      const fileStat = fs.statSync(fullPath);

      // Check if file already exists in media
      const existing = db.prepare('SELECT media_id, file_path FROM media WHERE niche_id = ? AND (nama_file = ? OR file_path = ?)').get(nicheId, filename, fullPath);
      if (existing) {
        if (existing.file_path !== fullPath) {
          db.prepare('UPDATE media SET file_path = ? WHERE media_id = ?').run(fullPath, existing.media_id);
        }
        continue;
      }

      const mediaId = 'VID-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      const kontenId = 'CNT-' + crypto.randomUUID().slice(0, 8).toUpperCase();

      // Check if there is an existing caption for this filename to restore
      const existingPost = db.prepare(`
        SELECT p.* FROM posts p 
        JOIN media m ON p.media_id = m.media_id 
        WHERE m.nama_file = ? AND p.caption_utama IS NOT NULL AND p.caption_utama != ''
      `).get(filename);

      const captionToUse = existingPost ? existingPost.caption_utama : filename.replace(/\.[^/.]+$/, '');
      const hashtagsToUse = existingPost ? (existingPost.hashtags || '') : '';
      const lockedToUse = existingPost ? (existingPost.manual_locked || 'TRUE') : 'FALSE';

      db.prepare(`
        INSERT INTO media (media_id, niche_id, file_path, nama_file, mime_type, file_size, deskripsi, caption_mode, caption_manual, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mediaId, nicheId, fullPath, filename, 'video/mp4', fileStat.size,
        '', niche.mode_caption || 'MANUAL', captionToUse, 'SIAP', isoNow()
      );

      db.prepare(`
        INSERT INTO posts (konten_id, media_id, niche_id, mode_caption, caption_utama, caption_facebook, caption_instagram, caption_tiktok, hashtags, emoji, manual_locked, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        kontenId, mediaId, nicheId, niche.mode_caption || 'MANUAL',
        captionToUse, '', '', '', hashtagsToUse, '', lockedToUse, 'READY', isoNow()
      );

      addedCount++;
    }

    // Hapus file yang sudah dihapus secara fisik di komputer dari database
    const allMediaInNiche = db.prepare('SELECT media_id, nama_file, file_path FROM media WHERE niche_id = ?').all(nicheId);
    for (const m of allMediaInNiche) {
      if (!currentVideoFiles.has(m.nama_file) && (!m.file_path || !fs.existsSync(m.file_path))) {
        db.prepare('DELETE FROM media WHERE media_id = ?').run(m.media_id);
        db.prepare("DELETE FROM posts WHERE media_id = ? AND manual_locked != 'TRUE'").run(m.media_id);
        db.prepare("DELETE FROM jobs WHERE media_id = ? AND status NOT IN ('PUBLISHED', 'UPLOADING')").run(m.media_id);
        removedCount++;
      }
    }

    console.log(`[SCAN] Niche "${niche.nama}": Added ${addedCount}, Removed ${removedCount} missing videos.`);
    return getDashboardData();
  }

  // If path doesn't exist locally, check if it's a Drive URL or ID
  if (folderPath.includes('drive.google.com') || folderPath.length > 20) {
    console.log(`[SCAN] Niche "${niche.nama}" configured with Drive ID: ${folderPath}. (Existing imported media intact).`);
    return getDashboardData();
  }

  throw new Error(`Folder lokal komputer tidak ditemukan di: "${folderPath}". Pastikan folder tersebut ada.`);
}

// 3. AI Caption Generation with Gemini
async function generateCaption(mediaId, replaceManual = true) {
  const media = db.prepare('SELECT * FROM media WHERE media_id = ?').get(mediaId);
  if (!media) throw new Error('Video tidak ditemukan: ' + mediaId);

  const niche = db.prepare('SELECT * FROM niches WHERE niche_id = ?').get(media.niche_id);
  const post = db.prepare('SELECT * FROM posts WHERE media_id = ?').get(mediaId);

  let apiKey = getSetting('GEMINI_API_KEY', '');
  if (!apiKey) {
    // Try from environment
    apiKey = process.env.GEMINI_API_KEY || '';
  }
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum disetel. Masukkan API Key di pengaturan aplikasi.');
  }

  const aiSet = db.prepare('SELECT * FROM ai_settings WHERE niche_id = ?').get(media.niche_id);
  const model = (aiSet && aiSet.model) || getSetting('GEMINI_MODEL', 'gemini-1.5-flash');

  const promptText = `
Tonton dan analisis informasi video berikut untuk media sosial:
Judul file: ${media.nama_file}
Niche: ${niche ? niche.nama : 'Umum'}
Deskripsi: ${media.deskripsi || '-'}
Instruksi Niche: ${(niche && niche.instruksi_ai) || '-'}
Gaya Bahasa: ${(aiSet && aiSet.gaya_bahasa) || 'natural'}

Buat caption media sosial yang menarik, profesional, dan relevan dalam bahasa Indonesia.
Kembalikan HANYA format JSON valid dengan field berikut:
{
  "main": "Caption utama yang menarik",
  "facebook": "Versi caption Facebook",
  "instagram": "Versi caption Instagram dengan format estetik",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"
}
`;

  console.log(`[GEMINI] Generating caption for media ${mediaId} using model ${model}...`);

  async function callGemini(selectedModel) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selectedModel)}:generateContent?key=${apiKey}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.5
        }
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Gemini HTTP ${resp.status}: ${errText.slice(0, 250)}`);
    }
    const data = await resp.json();
    const raw = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!raw) throw new Error('Gemini tidak mengembalikan teks.');
    return JSON.parse(raw);
  }

  let result;
  try {
    result = await callGemini(model);
  } catch (err) {
    console.warn(`[GEMINI] First attempt with ${model} failed (${err.message}), retrying with gemini-1.5-flash...`);
    result = await callGemini('gemini-1.5-flash');
  }

  // Save to database with Anti-Shadowban automatic sanitization
  const cleanMain = sanitizeCaptionAntiShadowban(result.main || '');
  const cleanFb = sanitizeCaptionAntiShadowban(result.facebook || '');
  const cleanIg = sanitizeCaptionAntiShadowban(result.instagram || '');
  const cleanHash = sanitizeCaptionAntiShadowban(result.hashtags || '');

  db.prepare(`
    UPDATE posts SET
      mode_caption = 'AI',
      caption_utama = ?,
      caption_facebook = ?,
      caption_instagram = ?,
      hashtags = ?,
      manual_locked = 'FALSE',
      status = 'READY',
      updated_at = ?
    WHERE media_id = ?
  `).run(
    cleanMain,
    cleanFb,
    cleanIg,
    cleanHash,
    isoNow(),
    mediaId
  );

  db.prepare(`UPDATE media SET caption_mode = 'AI', status = 'SIAP' WHERE media_id = ?`).run(mediaId);

  console.log(`[GEMINI] Successfully generated AI caption for media ${mediaId} (Anti-Shadowban sanitized)`);
  return getDashboardData();
}

// 4. Save Post
function savePost(input) {
  const mediaId = input.mediaId || input.media_id;
  const media = db.prepare('SELECT * FROM media WHERE media_id = ?').get(mediaId);
  if (!media) throw new Error('Video tidak ditemukan: ' + mediaId);

  const caption = (input.caption || input.captionUtama || input.caption_utama || '').trim();
  if (!caption) throw new Error('Caption tidak boleh kosong.');

  const mode = input.mode || media.caption_mode || 'MANUAL';

  const cleanUtama = sanitizeCaptionAntiShadowban(caption);
  const cleanFb = input.facebook ? sanitizeCaptionAntiShadowban(input.facebook) : '';
  const cleanIg = input.instagram ? sanitizeCaptionAntiShadowban(input.instagram) : '';
  const cleanHash = input.hashtags ? sanitizeCaptionAntiShadowban(input.hashtags) : '';

  db.prepare(`
    UPDATE posts SET
      mode_caption = ?,
      caption_utama = ?,
      caption_facebook = ?,
      caption_instagram = ?,
      hashtags = ?,
      manual_locked = ?,
      status = 'READY',
      updated_at = ?
    WHERE media_id = ?
  `).run(
    mode,
    cleanUtama,
    cleanFb,
    cleanIg,
    cleanHash,
    (input.manual_locked === 'TRUE' || mode === 'MANUAL' || input.locked === 'TRUE') ? 'TRUE' : 'FALSE',
    isoNow(),
    mediaId
  );

  db.prepare(`
    UPDATE media SET
      caption_mode = ?,
      caption_manual = ?,
      status = 'SIAP'
    WHERE media_id = ?
  `).run(
    mode,
    mode === 'MANUAL' ? caption : media.caption_manual,
    mediaId
  );

  return getDashboardData();
}

// 5. Schedule Content
function saveScheduleWeb(input) {
  const mediaId = input.mediaId;
  const media = db.prepare('SELECT * FROM media WHERE media_id = ?').get(mediaId);
  if (!media) throw new Error('Video tidak ditemukan.');

  const post = db.prepare('SELECT * FROM posts WHERE media_id = ?').get(mediaId);
  if (!post || !post.caption_utama) throw new Error('Caption belum dibuat untuk video ini.');

  const akunIds = Array.isArray(input.akunIds) ? input.akunIds : (input.akun_ids || []);
  if (!akunIds.length) throw new Error('Pilih minimal satu akun tujuan.');

  // === VALIDASI KETAT ANTI-DUPLIKASI (FACEBOOK, INSTAGRAM, TIKTOK) ===
  const pubInfo = getPublishedMediaInfo(media.media_id, media.nama_file);
  const targetAccounts = akunIds.map(id => db.prepare('SELECT * FROM accounts WHERE akun_id = ?').get(id)).filter(Boolean);

  const validAccounts = [];
  const alreadyPublishedAccounts = [];

  for (const acc of targetAccounts) {
    const isPlatformDone = pubInfo.platforms.includes(acc.platform.toUpperCase());
    const isAccountDone = pubInfo.accounts.includes(acc.akun_id);

    if (isPlatformDone || isAccountDone) {
      alreadyPublishedAccounts.push(acc);
    } else {
      validAccounts.push(acc);
    }
  }

  // JIKA SEMUA AKUN / PLATFORM YANG DIPILIH SUDAH PERNAH TERBIT:
  if (validAccounts.length === 0) {
    const pubList = pubInfo.platforms.join(', ');
    const detailAcc = alreadyPublishedAccounts.map(a => `${a.nama_akun} (${a.platform})`).join(', ');
    throw new Error(
      `🚫 PENOLAKAN ANTI-DUPLIKASI: Video "${media.nama_file}" DITOLAK karena sudah pernah dipublikasikan di platform: [${pubList}] (${detailAcc}).\n\nSistem otomatis menolak penjadwalan/publikasi ulang untuk video yang sudah ada agar tidak terjadi posting ganda (konten duplikat).`
    );
  }

  // Jika ada sebagian akun yang sudah terbit, kita jadwalkan HANYA untuk akun yang BELUM pernah terbit
  const scheduledTimeStr = input.scheduledTime; // format: 'YYYY-MM-DD HH:mm'
  const scheduledDate = new Date(scheduledTimeStr.replace(' ', 'T') + ':00+07:00');
  const scheduledIso = scheduledDate.toISOString();

  const jadwalId = 'SCH-' + crypto.randomUUID().slice(0, 8).toUpperCase();
  const finalAkunIds = validAccounts.map(a => a.akun_id);

  const coverOffsetMs = Math.max(100, Math.min(10000, parseInt(input.coverOffsetMs || input.cover_offset_ms || (media ? media.cover_offset_ms : null) || 1800, 10)));
  const bgmEnabled = (input.bgmEnabled === false || input.bgm_enabled === 'FALSE' || input.bgmEnabled === 'false') ? 'FALSE' : 'TRUE';
  const bgmCategory = input.bgmCategory || input.bgm_category || 'AUTO';
  const bgmVolume = parseFloat(input.bgmVolume || input.bgm_volume || 0.15);
  const sfxEnabled = (input.sfxEnabled === false || input.sfx_enabled === 'FALSE' || input.sfxEnabled === 'false') ? 'FALSE' : 'TRUE';
  const sfxCategory = input.sfxCategory || input.sfx_category || 'AUTO';
  const sfxVolume = parseFloat(input.sfxVolume || input.sfx_volume || 0.60);
  const outroEnabled = (input.outroEnabled === false || input.outro_enabled === 'FALSE' || input.outroEnabled === 'false') ? 'FALSE' : 'TRUE';
  const outroText = (input.outroText !== undefined && input.outroText !== null && String(input.outroText).trim())
    ? String(input.outroText).trim()
    : (input.outro_text || getDefaultOutroText(media.niche_id));

  db.prepare(`
    INSERT INTO schedules (jadwal_id, konten_id, niche_id, tanggal_jam_wib, akun_ids_csv, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'READY', ?)
  `).run(
    jadwalId, post.konten_id, media.niche_id, scheduledTimeStr, finalAkunIds.join(','), isoNow()
  );

  // Buat antrean job HANYA untuk akun yang valid (belum terbit)
  for (const acc of validAccounts) {
    const jobId = 'JOB-' + crypto.randomUUID().slice(0, 8).toUpperCase();
    db.prepare(`
      INSERT INTO jobs (job_id, jadwal_id, konten_id, media_id, niche_id, akun_id, platform, scheduled_at, status, attempts, updated_at, cover_offset_ms, bgm_enabled, bgm_category, bgm_volume, sfx_enabled, sfx_category, sfx_volume, outro_enabled, outro_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'READY', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      jobId, jadwalId, post.konten_id, mediaId, media.niche_id, acc.akun_id, acc.platform, scheduledIso, isoNow(), coverOffsetMs, bgmEnabled, bgmCategory, bgmVolume, sfxEnabled, sfxCategory, sfxVolume, outroEnabled, outroText
    );
  }

  db.prepare("UPDATE media SET status = 'TERJADWAL', cover_offset_ms = ? WHERE media_id = ?").run(coverOffsetMs, mediaId);
  db.prepare("UPDATE posts SET status = 'SCHEDULED', cover_offset_ms = ?, bgm_enabled = ?, bgm_category = ?, bgm_volume = ?, sfx_enabled = ?, sfx_category = ?, sfx_volume = ?, outro_enabled = ?, outro_text = ? WHERE konten_id = ?").run(coverOffsetMs, bgmEnabled, bgmCategory, bgmVolume, sfxEnabled, sfxCategory, sfxVolume, outroEnabled, outroText, post.konten_id);

  if (alreadyPublishedAccounts.length > 0) {
    console.log(`[SCHEDULE FILTER] Video "${media.nama_file}": Melewatkan ${alreadyPublishedAccounts.length} akun yang sudah terbit (${alreadyPublishedAccounts.map(a => a.platform).join(',')}), menjadwalkan ke ${validAccounts.length} akun yang tersisa (Cover: ${coverOffsetMs}ms).`);
  } else {
    console.log(`[SCHEDULE] Created schedule ${jadwalId} with ${finalAkunIds.length} jobs (Cover: ${coverOffsetMs}ms).`);
  }

  return getDashboardData();
}

// 6. Meta Graph API Publishing
async function publishJob(jobId) {
  const job = db.prepare('SELECT * FROM jobs WHERE job_id = ?').get(jobId);
  if (!job) throw new Error('Job tidak ditemukan: ' + jobId);

  const acc = db.prepare('SELECT * FROM accounts WHERE akun_id = ?').get(job.akun_id);
  if (!acc || !acc.token) throw new Error('Akun atau token tidak ditemukan untuk job ini.');

  const post = db.prepare('SELECT * FROM posts WHERE konten_id = ?').get(job.konten_id);
  const media = db.prepare('SELECT * FROM media WHERE media_id = ?').get(job.media_id);

  // Pre-flight Check Anti-Duplikasi: Batalkan otomatis jika video ternyata sudah pernah terbit di platform/akun ini
  const rawFile = media ? String(media.nama_file || '').trim() : '';
  const baseName = rawFile.replace(/\.[^/.]+$/, '').trim();

  const alreadyPubJob = db.prepare(`
    SELECT job_id, platform, status 
    FROM jobs 
    WHERE job_id != ? 
      AND status = 'PUBLISHED'
      AND akun_id = ?
      AND (media_id = ? OR media_id IN (SELECT media_id FROM media WHERE nama_file = ? OR nama_file LIKE ?))
    LIMIT 1
  `).get(jobId, job.akun_id, job.media_id, rawFile, `%${baseName}%`);

  const alreadyPubPerf = db.prepare(`
    SELECT perf_id, platform, nama_video 
    FROM performance 
    WHERE (nama_video = ? OR nama_video = ? OR nama_video LIKE ?)
      AND (akun_id = ? OR platform = ?)
    LIMIT 1
  `).get(rawFile, job.media_id, `%${baseName}%`, job.akun_id, job.platform);

  if (alreadyPubJob || alreadyPubPerf) {
    console.warn(`[PUBLISH MENOLAK DUPLIKASI] Job ${jobId} dibatalkan otomatis karena video "${rawFile}" sudah pernah terbit di ${job.platform} (${acc.nama_akun}).`);
    db.prepare("UPDATE jobs SET status = 'CANCELLED', last_error = 'Dibatalkan otomatis: Video sudah pernah terbit di platform ini.', updated_at = ? WHERE job_id = ?").run(isoNow(), jobId);
    return getDashboardData();
  }

  console.log(`[PUBLISH] Executing publish for job ${jobId} to ${job.platform} (${acc.nama_akun})...`);

  db.prepare("UPDATE jobs SET status = 'UPLOADING', updated_at = ? WHERE job_id = ?").run(isoNow(), jobId);

  let activeFilePath = media.file_path;
  let tempMixedFile = null;

  try {
    // === AUTO BGM, SFX HOOK & OUTRO FOLLOWER CTA ENHANCER ===
    const isBgm = job.bgm_enabled === 'TRUE' || job.bgm_enabled === true || job.bgm_enabled === 'true';
    const isSfx = job.sfx_enabled === 'TRUE' || job.sfx_enabled === true || job.sfx_enabled === 'true';
    const isOutro = job.outro_enabled === 'TRUE' || job.outro_enabled === true || job.outro_enabled === 'true' || job.outro_enabled === undefined;
    const outroTextToUse = isOutro ? (job.outro_text || getDefaultOutroText(niche ? (niche.nama || niche.niche_id) : media.niche_id)) : null;

    if (isBgm || isSfx || isOutro) {
      try {
        let selectedBgm = null;
        let selectedSfx = null;

        if (isBgm) {
          selectedBgm = pickAudioTrackForMedia(media, job.bgm_category);
        }
        if (isSfx) {
          selectedSfx = pickSfxTrackForMedia(media, job.sfx_category);
        }

        const bgmPath = selectedBgm ? selectedBgm.path : null;
        const sfxPath = selectedSfx ? selectedSfx.path : null;

        if (bgmPath || sfxPath || isOutro) {
          console.log(`[MEDIA ENHANCER] Memproses video ${media.nama_file}...`);
          if (bgmPath) console.log(`  🎵 BGM: "${selectedBgm.name}" (${selectedBgm.category}, vol: ${job.bgm_volume || 0.15})`);
          if (sfxPath) console.log(`  ⚡ SFX Hook: "${selectedSfx.name}" (${selectedSfx.category}, vol: ${job.sfx_volume || 0.60})`);
          if (isOutro) console.log(`  🔔 Outro Follower CTA: "${outroTextToUse}"`);

          const mixed = await mixVideoWithAudio(media.file_path, bgmPath, job.bgm_volume || 0.15, sfxPath, job.sfx_volume || 0.60, outroTextToUse);
          if (mixed && fs.existsSync(mixed)) {
            activeFilePath = mixed;
            tempMixedFile = mixed;
            console.log(`[MEDIA ENHANCER] Video sukses disempurnakan: ${tempMixedFile}`);
          }
        }
      } catch (mixErr) {
        console.warn('[MEDIA ENHANCER WARNING] Gagal memadukan audio/outro, melanjutkan dengan video asli:', mixErr.message);
      }
    }

    const rawCaption = (job.platform === 'FACEBOOK' ? (post.caption_facebook || post.caption_utama) : (post.caption_instagram || post.caption_utama)) +
      (post.hashtags ? '\n\n' + post.hashtags : '');
    const captionText = sanitizeCaptionAntiShadowban(rawCaption);

    let publishResult = null;

    if (job.platform === 'FACEBOOK') {
      const pageId = acc.platform_user_id;
      const filePath = activeFilePath;
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`File video tidak ditemukan di komputer: ${filePath || media.nama_file}`);
      }

      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      console.log(`[FB REELS UPLOAD] Starting upload session for ${media.nama_file} (${Math.round(fileSize/1024/1024)} MB)...`);

      // 1. Start Resumable Upload Session on Facebook Video Reels
      const initUrl = `https://graph.facebook.com/v21.0/${pageId}/video_reels`;
      const initResp = await fetch(initUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_phase: 'start',
          access_token: acc.token
        })
      });
      const initData = await initResp.json();
      if (initData.error) throw new Error('FB Reels Init: ' + (initData.error.message || JSON.stringify(initData.error)));

      const videoId = initData.video_id;
      const uploadUrl = initData.upload_url || `https://rupload.facebook.com/video-upload/v21.0/${videoId}`;

      // 2. Transfer binary file via rupload
      console.log(`[FB REELS UPLOAD] Transferring binary file...`);
      const fileBuffer = fs.readFileSync(filePath);
      const transferResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${acc.token}`,
          'offset': '0',
          'file_size': String(fileSize),
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      });
      const transferData = await transferResp.json();
      if (transferData.error) throw new Error('FB Reels Transfer: ' + (transferData.error.message || JSON.stringify(transferData.error)));

      // 3. Finish and Publish Reel
      console.log(`[FB REELS UPLOAD] Finishing Reels publish session...`);
      const finishUrl = `https://graph.facebook.com/v21.0/${pageId}/video_reels`;
      const finishResp = await fetch(finishUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upload_phase: 'finish',
          access_token: acc.token,
          video_id: videoId,
          video_state: 'PUBLISHED',
          description: captionText,
          thumb_offset: job.cover_offset_ms || 1800
        })
      });
      const finishData = await finishResp.json();
      if (finishData.error) throw new Error('FB Reels Finish: ' + (finishData.error.message || JSON.stringify(finishData.error)));

      // 4. Poll until Facebook finishes processing
      console.log(`[FB REELS UPLOAD] Waiting for Facebook Reels processing...`);
      let reelPermalink = `https://www.facebook.com/reel/${videoId}/`;
      for (let attempt = 1; attempt <= 15; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const statusResp = await fetch(`https://graph.facebook.com/v21.0/${videoId}?fields=status,permalink_url&access_token=${acc.token}`);
          const sData = await statusResp.json();
          const vStatus = sData.status ? sData.status.video_status : null;
          if (sData.permalink_url) {
            reelPermalink = sData.permalink_url.startsWith('http') ? sData.permalink_url : `https://www.facebook.com${sData.permalink_url}`;
          }
          if (vStatus === 'ready') {
            console.log(`[FB REELS UPLOAD] Reel is READY and live! URL: ${reelPermalink}`);
            break;
          }
          if (vStatus === 'error') {
            break;
          }
        } catch (e) {}
      }

      publishResult = {
        id: videoId,
        url: reelPermalink
      };

    } else if (job.platform === 'INSTAGRAM') {
      const igUserId = acc.platform_user_id;
      const filePath = activeFilePath;
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`File video tidak ditemukan di komputer: ${filePath || media.nama_file}`);
      }

      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      console.log(`[IG UPLOAD] Creating Reels container for ${media.nama_file} (${Math.round(fileSize/1024/1024)} MB, Cover: ${job.cover_offset_ms || 1800}ms)...`);

      // 1. Create Reels Container for Resumable Upload
      const initUrl = `https://graph.facebook.com/v21.0/${igUserId}/media`;
      const initResp = await fetch(initUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          upload_type: 'resumable',
          caption: captionText,
          share_to_feed: true,
          thumb_offset: job.cover_offset_ms || 1800,
          access_token: acc.token
        })
      });
      const initData = await initResp.json();
      if (initData.error) throw new Error('IG Container: ' + (initData.error.message || JSON.stringify(initData.error)));

      const containerId = initData.id;
      const uploadUri = initData.uri || `https://rupload.facebook.com/ig-api-upload/v21.0/${containerId}`;

      // 2. Transfer binary to rupload
      console.log(`[IG UPLOAD] Transferring video binary...`);
      const fileBuffer = fs.readFileSync(filePath);
      const transferResp = await fetch(uploadUri, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${acc.token}`,
          'offset': '0',
          'file_size': String(fileSize),
          'Content-Type': 'application/octet-stream'
        },
        body: fileBuffer
      });
      const transferData = await transferResp.json();
      if (transferData.error) throw new Error('IG Transfer: ' + (transferData.error.message || JSON.stringify(transferData.error)));

      // 3. Wait for container processing (poll status)
      console.log(`[IG UPLOAD] Processing Reels container ${containerId}...`);
      let isReady = false;
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusResp = await fetch(`https://graph.facebook.com/v21.0/${containerId}?fields=status_code&access_token=${acc.token}`);
        const statusData = await statusResp.json();
        console.log(`[IG UPLOAD] Container status: ${statusData.status_code || JSON.stringify(statusData)} (${i+1}/40)`);
        if (statusData.status_code === 'FINISHED') {
          isReady = true;
          break;
        }
        if (statusData.status_code === 'ERROR' || statusData.status_code === 'EXPIRED') {
          throw new Error('Instagram status: ' + (statusData.status_code || JSON.stringify(statusData)));
        }
      }

      if (!isReady) {
        throw new Error('Video sedang diproses (transcoding) oleh Instagram Meta. Silakan klik tombol Jalankan Antrean / Coba Lagi dalam 1 menit.');
      }

      // 4. Publish Container
      console.log(`[IG UPLOAD] Publishing Reels container...`);
      const pubResp = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: acc.token
        })
      });
      const pubData = await pubResp.json();
      if (pubData.error) throw new Error('IG Publish: ' + (pubData.error.message || JSON.stringify(pubData.error)));

      // 5. Get permalink
      let permalink = `https://www.instagram.com/`;
      try {
        const pResp = await fetch(`https://graph.facebook.com/v21.0/${pubData.id}?fields=permalink&access_token=${acc.token}`);
        const pData = await pResp.json();
        if (pData.permalink) permalink = pData.permalink;
      } catch (e) {}

      publishResult = {
        id: pubData.id,
        url: permalink
      };
    } else if (job.platform === 'TIKTOK') {
      const filePath = activeFilePath;
      if (!filePath || !fs.existsSync(filePath)) {
        throw new Error(`File video tidak ditemukan di komputer: ${filePath || media.nama_file}`);
      }
      const fileStats = fs.statSync(filePath);
      const fileSize = fileStats.size;

      console.log(`[TIKTOK UPLOAD] Initializing video upload for ${media.nama_file} (${Math.round(fileSize/1024/1024)} MB)...`);

      let privacyLevel = 'PUBLIC_TO_EVERYONE';
      try {
        const creatorResp = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${acc.token}`,
            'Content-Type': 'application/json; charset=UTF-8'
          }
        });
        const creatorData = await creatorResp.json();
        if (creatorData.data && Array.isArray(creatorData.data.privacy_level_options)) {
          const opts = creatorData.data.privacy_level_options;
          if (opts.includes('PUBLIC_TO_EVERYONE')) {
            privacyLevel = 'PUBLIC_TO_EVERYONE';
          } else if (opts.length > 0) {
            privacyLevel = opts[0];
          }
          console.log(`[TIKTOK PRIVACY] Selected privacy level: ${privacyLevel} from options:`, opts);
        }
      } catch (err) {
        console.warn('[TIKTOK CREATOR INFO]', err.message);
      }

      const initResp = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${acc.token}`,
          'Content-Type': 'application/json; charset=UTF-8'
        },
        body: JSON.stringify({
          post_info: {
            title: (post.caption_tiktok || post.caption_utama || '').slice(0, 2200),
            privacy_level: privacyLevel,
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
            video_cover_timestamp_ms: job.cover_offset_ms || 1800
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_size: fileSize,
            chunk_size: fileSize,
            total_chunk_count: 1
          }
        })
      });

      const initData = await initResp.json();
      if (initData.error && initData.error.code !== 'ok') {
        const currentAppIdx = acc.tt_app_index || 0;
        const currentApp = getTikTokApp(currentAppIdx);
        const nextIdx = getNextTikTokAppIndex(currentAppIdx);
        const nextApp = getTikTokApp(nextIdx);
        
        console.error(`[TIKTOK ERROR] Code: ${initData.error.code}, Msg: ${initData.error.message}`);
        
        if (initData.error.code === 'unaudited_client_can_only_post_to_private_accounts') {
          throw new Error(`TikTok Unaudited App (${currentApp.label}): Aplikasi belum lolos review TikTok, hanya boleh posting ke "Akun Privat". Silahkan ubah akun TikTok di HP ke "Akun Privat" sementara waktu, atau ajukan Review/Audit di TikTok Developer.`);
        }

        // Update account to suggest next app for re-auth
        try {
          db.prepare("UPDATE accounts SET tt_app_index = ? WHERE akun_id = ?").run(nextIdx, acc.akun_id);
        } catch(e) {}
        
        throw new Error(`TikTok Init Error [${initData.error.code || 'FAIL'}] (${currentApp.label}): ${initData.error.message || JSON.stringify(initData.error)} — Silahkan re-otorisasi.`);
      }

      const publishId = initData.data ? initData.data.publish_id : null;
      const uploadUrl = initData.data ? initData.data.upload_url : null;
      if (!uploadUrl) {
        throw new Error('TikTok tidak memberikan upload_url');
      }

      console.log(`[TIKTOK UPLOAD] Transferring video to TikTok storage...`);
      const fileBuffer = fs.readFileSync(filePath);
      const uploadResp = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': String(fileSize),
          'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`
        },
        body: fileBuffer
      });

      if (!uploadResp.ok && uploadResp.status !== 201 && uploadResp.status !== 200) {
        const uploadErrText = await uploadResp.text();
        throw new Error(`TikTok Upload Error: HTTP ${uploadResp.status} - ${uploadErrText}`);
      }

      console.log(`[TIKTOK UPLOAD] Upload completed! Publish ID: ${publishId}`);

      let tiktokUsername = acc.platform_user_id || '';
      if (acc.nama_akun && acc.nama_akun.includes('@')) {
        const match = acc.nama_akun.match(/@([a-zA-Z0-9._]+)/);
        if (match) tiktokUsername = match[1];
      }

      publishResult = {
        id: publishId || 'TIKTOK-' + Date.now(),
        url: tiktokUsername ? `https://www.tiktok.com/@${tiktokUsername}` : 'https://www.tiktok.com/'
      };
    }

    // Success
    db.prepare(`
      UPDATE jobs SET
        status = 'PUBLISHED',
        platform_publish_id = ?,
        post_url = ?,
        updated_at = ?
      WHERE job_id = ?
    `).run(publishResult.id, publishResult.url, isoNow(), jobId);

    // Add to Performance
    const perfId = 'PERF-' + crypto.randomUUID().slice(0, 8).toUpperCase();
    db.prepare(`
      INSERT OR REPLACE INTO performance (perf_id, niche_id, akun_id, platform, nama_video, posted_at, views_24h, views_3d, views_7d, likes, comments, shares, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 'AUTO_PUBLISHED', ?)
    `).run(
      perfId, job.niche_id, job.akun_id, job.platform, media.nama_file, isoNow(), isoNow()
    );

    // Update status media & konten jika semua target upload sudah selesai
    if (media) {
      try {
        const remaining = db.prepare("SELECT count(*) as cnt FROM jobs WHERE media_id = ? AND status NOT IN ('PUBLISHED', 'CANCELLED')").get(media.media_id);
        if (!remaining || remaining.cnt === 0) {
          db.prepare("UPDATE media SET status = 'PUBLISHED' WHERE media_id = ?").run(media.media_id);
          db.prepare("UPDATE posts SET status = 'PUBLISHED' WHERE konten_id = ?").run(job.konten_id);
          console.log(`[PUBLISH COMPLETE] Media "${media.nama_file}" kini berstatus PUBLISHED di seluruh antrean.`);
        }
      } catch(e) {}
    }

    console.log(`[PUBLISH] Job ${jobId} published successfully! URL: ${publishResult.url}`);
    return getDashboardData();

  } catch (err) {
    console.error(`[PUBLISH ERROR] Job ${jobId} failed:`, err.message);
    db.prepare(`
      UPDATE jobs SET
        status = 'FAILED',
        last_error = ?,
        attempts = attempts + 1,
        updated_at = ?
      WHERE job_id = ?
    `).run(err.message, isoNow(), jobId);
    throw err;
  } finally {
    if (tempMixedFile && fs.existsSync(tempMixedFile)) {
      try {
        fs.unlinkSync(tempMixedFile);
        console.log(`[BGM MIXER] Berhasil membersihkan temp file audio: ${tempMixedFile}`);
      } catch(e) {}
    }
  }
}

// 7. Sync Insights from Meta Graph API (High-Speed Parallel Execution)
async function sinkronkanPerformaWeb() {
  console.log('[INSIGHTS] Syncing Meta Insights in parallel for all published jobs...');

  const accounts = db.prepare("SELECT * FROM accounts WHERE token IS NOT NULL AND token != ''").all();
  const publishedJobs = db.prepare("SELECT * FROM jobs WHERE status = 'PUBLISHED'").all();
  const allMedia = db.prepare('SELECT * FROM media').all();
  const mediaMap = new Map(allMedia.map(m => [m.media_id, m]));

  const syncPromises = publishedJobs.map(async (job) => {
    const acc = accounts.find(a => a.akun_id === job.akun_id);
    if (!acc || !acc.token || !job.platform_publish_id) return;
    const media = mediaMap.get(job.media_id);
    const videoName = media ? media.nama_file : job.media_id;

    try {
      let views = 0, likes = 0, comments = 0, shares = 0;

      if (job.platform === 'INSTAGRAM') {
        // 1. Basic Media Details (likes, comments, permalink)
        try {
          const itemUrl = `https://graph.facebook.com/v21.0/${job.platform_publish_id}?fields=id,like_count,comments_count,permalink,media_product_type&access_token=${acc.token}`;
          const itemResp = await fetch(itemUrl);
          const item = await itemResp.json();
          if (item && !item.error) {
            likes = Number(item.like_count || 0);
            comments = Number(item.comments_count || 0);
          }
        } catch (e) {}

        // 2. Query Reels Insights with official v21.0 metric=views
        try {
          const insViewsUrl = `https://graph.facebook.com/v21.0/${job.platform_publish_id}/insights?metric=views&access_token=${acc.token}`;
          const insResp = await fetch(insViewsUrl);
          const insData = await insResp.json();
          if (Array.isArray(insData?.data)) {
            for (const d of insData.data) {
              const val = d.total_value?.value ?? d.values?.[0]?.value ?? 0;
              if (Number(val) > views) views = Number(val);
            }
          }
        } catch (e) {}

        // 3. Fallback to reach if views metric returns 0
        if (views === 0) {
          try {
            const insReachUrl = `https://graph.facebook.com/v21.0/${job.platform_publish_id}/insights?metric=reach&access_token=${acc.token}`;
            const reachResp = await fetch(insReachUrl);
            const reachData = await reachResp.json();
            if (Array.isArray(reachData?.data)) {
              for (const d of reachData.data) {
                const val = d.total_value?.value ?? d.values?.[0]?.value ?? 0;
                if (Number(val) > views) views = Number(val);
              }
            }
          } catch (e) {}
        }

        // 4. Fallback to likes if insights not yet processed by Meta
        if (views === 0 && likes > 0) {
          views = likes;
        }

      } else if (job.platform === 'FACEBOOK') {
        // 1. Basic Video Details
        try {
          const vidUrl = `https://graph.facebook.com/v21.0/${job.platform_publish_id}?fields=id,views,likes.summary(true),comments.summary(true)&access_token=${acc.token}`;
          const resp = await fetch(vidUrl);
          const v = await resp.json();
          if (v && v.id) {
            views = Number(v.views || 0);
            likes = Number(v.likes?.summary?.total_count || 0);
            comments = Number(v.comments?.summary?.total_count || 0);
          }
        } catch (e) {}

        // 2. Fallback to video_insights if views is 0
        if (views === 0) {
          try {
            const viUrl = `https://graph.facebook.com/v21.0/${job.platform_publish_id}/video_insights?metric=total_video_views&access_token=${acc.token}`;
            const viResp = await fetch(viUrl);
            const viData = await viResp.json();
            if (Array.isArray(viData?.data) && viData.data[0]?.values?.[0]?.value) {
              views = Number(viData.data[0].values[0].value || 0);
            }
          } catch (e) {}
        }
      }

      // Check existing row by filename or media_id to strictly prevent duplicates
      const existing = db.prepare('SELECT * FROM performance WHERE platform = ? AND (nama_video = ? OR nama_video = ?)').get(job.platform, videoName, job.media_id);
      
      const postDate = new Date(job.updated_at || job.scheduled_at || Date.now());
      const ageHours = (Date.now() - postDate.getTime()) / (1000 * 60 * 60);

      let prevViews24 = existing ? Number(existing.views_24h || 0) : 0;
      let prevViews3d = existing ? Number(existing.views_3d || 0) : 0;
      let prevViews7d = existing ? Number(existing.views_7d || 0) : 0;
      const prevLikes = existing ? Number(existing.likes || 0) : 0;
      const prevComments = existing ? Number(existing.comments || 0) : 0;
      const prevShares = existing ? Number(existing.shares || 0) : 0;

      const finalLikes = likes > 0 ? likes : prevLikes;
      const finalComments = comments > 0 ? comments : prevComments;
      const finalShares = shares > 0 ? shares : prevShares;

      let finalViews24 = prevViews24;
      let finalViews3d = prevViews3d;
      let finalViews7d = prevViews7d;

      if (views > 0) {
        if (ageHours <= 36) {
          finalViews24 = Math.max(prevViews24, views);
          finalViews3d = Math.max(prevViews3d, views);
          finalViews7d = Math.max(prevViews7d, views);
        } else if (ageHours <= 96) {
          finalViews3d = Math.max(prevViews3d, views);
          finalViews7d = Math.max(prevViews7d, views);
        } else {
          finalViews7d = Math.max(prevViews7d, views);
        }
      }

      if (existing) {
        db.prepare(`
          UPDATE performance SET
            nama_video = ?,
            views_24h = ?,
            views_3d = ?,
            views_7d = ?,
            likes = ?,
            comments = ?,
            shares = ?
          WHERE perf_id = ?
        `).run(videoName, finalViews24, finalViews3d, finalViews7d, finalLikes, finalComments, finalShares, existing.perf_id);
      } else {
        const newPerfId = 'PERF-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        db.prepare(`
          INSERT INTO performance (perf_id, niche_id, akun_id, platform, nama_video, posted_at, views_24h, views_3d, views_7d, likes, comments, shares, source, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(newPerfId, job.niche_id, job.akun_id, job.platform, videoName, job.updated_at || isoNow(), finalViews24, finalViews3d, finalViews7d, finalLikes, finalComments, finalShares, 'AUTO_PUBLISHED', isoNow());
      }
    } catch (e) {
      console.warn(`[INSIGHTS] Failed syncing job ${job.job_id}:`, e.message);
    }
  });

  await Promise.all(syncPromises);

  setSetting('META_LAST_SYNC', isoNow(), 'Waktu sinkronisasi insight terakhir');
  setSetting('META_LAST_STATUS', 'Berhasil disinkronkan', 'Status insight');

  console.log('[INSIGHTS] Parallel insights sync complete!');
  return getDashboardData();
}

// 8. Sync Meta Creator Studio Schedules
async function syncMetaCalendar() {
  console.log('[META CALENDAR] Syncing Meta Creator Studio scheduled posts...');
  const accounts = db.prepare("SELECT * FROM accounts WHERE platform = 'FACEBOOK' AND aktif = 'TRUE' AND token IS NOT NULL").all();

  const fresh = [];
  const errors = [];
  const checkedAccounts = [];

  for (const acc of accounts) {
    try {
      let postCount = 0;

      // 1. Check scheduled_posts endpoint
      const pUrl = `https://graph.facebook.com/v21.0/${acc.platform_user_id}/scheduled_posts?fields=id,message,scheduled_publish_time,created_time&limit=25&access_token=${acc.token}`;
      const pResp = await fetch(pUrl);
      const pData = await pResp.json();
      if (pData.error) throw new Error(pData.error.message || JSON.stringify(pData.error));

      if (pData && pData.data) {
        for (const item of pData.data) {
          if (!item.scheduled_publish_time) continue;
          const schedIso = new Date(Number(item.scheduled_publish_time) * 1000).toISOString();
          fresh.push({
            meta_row_id: 'META-' + Buffer.from(`${acc.akun_id}|${item.id}`).toString('base64url').slice(0, 32),
            niche_id: acc.niche_id,
            akun_id: acc.akun_id,
            platform: 'FACEBOOK',
            meta_post_id: String(item.id),
            scheduled_at: schedIso,
            message: String(item.message || '').slice(0, 500),
            source: 'META_CREATOR_STUDIO',
            synced_at: isoNow()
          });
          postCount++;
        }
      }

      // 2. Check scheduled unpublished videos
      const vUrl = `https://graph.facebook.com/v21.0/${acc.platform_user_id}/videos?fields=id,title,description,scheduled_publish_time,status&limit=25&access_token=${acc.token}`;
      const vResp = await fetch(vUrl);
      const vData = await vResp.json();
      if (vData.error) throw new Error(vData.error.message || JSON.stringify(vData.error));
      if (vData && vData.data) {
        for (const v of vData.data) {
          const schedTime = v.scheduled_publish_time || (v.status?.publishing_phase?.publish_status === 'scheduled' ? v.status?.publishing_phase?.publish_time : null);
          if (!schedTime) continue;
          const schedIso = new Date(schedTime).toISOString();
          if (new Date(schedIso).getTime() < Date.now() - 3600000) continue;
          fresh.push({
            meta_row_id: 'META-' + Buffer.from(`${acc.akun_id}|${v.id}`).toString('base64url').slice(0, 32),
            niche_id: acc.niche_id,
            akun_id: acc.akun_id,
            platform: 'FACEBOOK',
            meta_post_id: String(v.id),
            scheduled_at: schedIso,
            message: String(v.title || v.description || '').slice(0, 500),
            source: 'META_CREATOR_STUDIO',
            synced_at: isoNow()
          });
          postCount++;
        }
      }

      checkedAccounts.push(`${acc.nama_akun} (${postCount} jadwal)`);
    } catch (err) {
      errors.push(`${acc.nama_akun}: ${err.message}`);
    }
  }

  // Save to database
  db.exec('DELETE FROM meta_schedules');
  const insertStmt = db.prepare('INSERT OR REPLACE INTO meta_schedules (meta_row_id, niche_id, akun_id, platform, meta_post_id, scheduled_at, message, source, synced_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (const s of fresh) {
    insertStmt.run(s.meta_row_id, s.niche_id, s.akun_id, s.platform, s.meta_post_id, s.scheduled_at, s.message, s.source, s.synced_at);
  }

  const syncStatusMsg = errors.length ? errors.join('; ') : `Selesai memeriksa ${checkedAccounts.join(', ')}`;
  setSetting('META_LAST_SYNC', isoNow(), 'Waktu sinkron Meta Creator Studio terakhir');
  setSetting('META_LAST_STATUS', syncStatusMsg, 'Status sinkron Meta');
  if (errors.length) setSetting('META_LAST_ERROR', errors.join('; '), 'Error sinkron Meta');
  else setSetting('META_LAST_ERROR', '', 'Error sinkron Meta');

  console.log(`[META CALENDAR] Synced ${fresh.length} schedules across ${checkedAccounts.length} accounts.`);
  return getDashboardData();
}

// 8. Background Scheduler Loop
setInterval(async () => {
  try {
    const isStopped = getSetting('STOP_GLOBAL', 'FALSE') === 'TRUE';
    if (isStopped) return;

    // Otomatis jadwalkan video yang sudah memiliki caption
    autoScheduleUnscheduledMedia();

    const nowIso = isoNow();
    const readyJobs = db.prepare(`
      SELECT j.* FROM jobs j
      JOIN niches n ON j.niche_id = n.niche_id
      WHERE j.status = 'READY'
        AND j.scheduled_at <= ?
        AND n.auto_publikasi = 'TRUE'
      LIMIT 1
    `).all(nowIso);

    for (const job of readyJobs) {
      console.log(`[SCHEDULER] Triggering due job: ${job.job_id}`);
      await publishJob(job.job_id);
    }
  } catch (e) {
    console.error('[SCHEDULER ERROR]:', e.message);
  }
}, 30000);

// Background Automatic Insights & Meta Schedules Sync (Every 10 minutes)
setInterval(async () => {
  try {
    const isStopped = getSetting('STOP_GLOBAL', 'FALSE') === 'TRUE';
    if (isStopped) return;
    // Direct Meta Graph API queries (100% Standalone)
    await sinkronkanPerformaWeb();
    await syncMetaCalendar();
  } catch (e) {
    console.warn('[BACKGROUND INSIGHTS SYNC] Warning:', e.message);
  }
}, 10 * 60 * 1000);

// 9. Sync From Google Sheet (Bidirectional Alignment)
async function syncGoogleSheet() {
  const sheetId = '10KkDyeiTMOAkLi1m0B0D7ZMyPc5V1VZqH6idWTZjMCE';
  console.log('[SHEET SYNC] Syncing data from Google Sheets...');

  function parseCsv(text) {
    const lines = [];
    let row = [''];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i+1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);
    return lines;
  }

  async function fetchCsv(gid) {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} from Google Sheet gid ${gid}`);
    const text = await res.text();
    return parseCsv(text);
  }

  // 1. Sync ANTREAN PUBLIKASI (gid: 989852816) -> jobs
  try {
    const jobRows = await fetchCsv('989852816');
    for (let i = 1; i < jobRows.length; i++) {
      const r = jobRows[i];
      if (!r || !r[0]) continue;
      db.prepare(`
        INSERT INTO jobs (job_id, jadwal_id, konten_id, media_id, niche_id, akun_id, platform, scheduled_at, status, platform_publish_id, post_url, attempts, last_error, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(job_id) DO UPDATE SET
          status = excluded.status,
          platform_publish_id = excluded.platform_publish_id,
          post_url = excluded.post_url,
          attempts = excluded.attempts,
          last_error = excluded.last_error,
          updated_at = excluded.updated_at
      `).run(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], parseInt(r[11]) || 1, r[12] || '', r[13] || isoNow());
    }
  } catch (e) {
    console.warn('[SHEET SYNC] Failed jobs:', e.message);
  }

  // 2. Sync PERFORMA KONTEN (gid: 1404426548) -> performance
  try {
    const perfRows = await fetchCsv('1404426548');
    for (let i = 1; i < perfRows.length; i++) {
      const r = perfRows[i];
      if (!r || !r[0]) continue;
      db.prepare(`
        INSERT INTO performance (perf_id, niche_id, akun_id, platform, nama_video, posted_at, views_24h, views_3d, views_7d, likes, comments, shares, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(perf_id) DO UPDATE SET
          views_24h = excluded.views_24h,
          views_3d = excluded.views_3d,
          views_7d = excluded.views_7d,
          likes = excluded.likes,
          comments = excluded.comments,
          shares = excluded.shares
      `).run(r[0], r[1], r[2], r[3], r[4], r[5], parseInt(r[6])||0, parseInt(r[7])||0, parseInt(r[8])||0, parseInt(r[9])||0, parseInt(r[10])||0, parseInt(r[11])||0, r[12]||'AUTO_PUBLISHED', r[13]||isoNow());
    }
  } catch (e) {
    console.warn('[SHEET SYNC] Failed performance:', e.message);
  }

  // 3. Sync KALENDER KONTEN (gid: 1398004175) -> schedules
  try {
    const schedRows = await fetchCsv('1398004175');
    for (let i = 1; i < schedRows.length; i++) {
      const r = schedRows[i];
      if (!r || !r[0]) continue;
      db.prepare(`
        INSERT INTO schedules (jadwal_id, konten_id, niche_id, tanggal_jam_wib, akun_ids_csv, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(jadwal_id) DO UPDATE SET
          status = excluded.status
      `).run(r[0], r[1], r[2], r[3], r[4], r[5], r[6]||isoNow());
    }
  } catch (e) {
    console.warn('[SHEET SYNC] Failed schedules:', e.message);
  }

  // 4. Sync DETAIL POSTINGAN (gid: 557896907) -> posts
  try {
    const postRows = await fetchCsv('557896907');
    for (let i = 1; i < postRows.length; i++) {
      const r = postRows[i];
      if (!r || !r[0]) continue;
      db.prepare(`
        INSERT INTO posts (konten_id, media_id, niche_id, mode_caption, caption_utama, caption_facebook, caption_instagram, caption_tiktok, hashtags, emoji, manual_locked, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(konten_id) DO UPDATE SET
          caption_utama = excluded.caption_utama,
          hashtags = excluded.hashtags,
          status = excluded.status,
          updated_at = excluded.updated_at
      `).run(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12]||isoNow());
    }
  } catch (e) {
    console.warn('[SHEET SYNC] Failed posts:', e.message);
  }

  console.log('[SHEET SYNC] Google Sheet sync completed successfully.');
  return getDashboardData();
}

// ================= TIKTOK OAUTH ENDPOINTS =================
app.get('/auth/tiktok/login', (req, res) => {
  const nicheId = req.query.nicheId || '';
  // Auto-detect: jika niche sudah punya akun TikTok, pakai tt_app_index dari DB
  let appIndex = parseInt(req.query.appIndex || '-1', 10);
  if (appIndex < 0 && nicheId) {
    try {
      const existAcc = db.prepare("SELECT tt_app_index FROM accounts WHERE platform = 'TIKTOK' AND niche_id = ?").get(nicheId);
      appIndex = existAcc ? (existAcc.tt_app_index || 0) : 0;
    } catch(e) { appIndex = 0; }
  }
  if (appIndex < 0) appIndex = 0;
  
  const ttApp = getTikTokApp(appIndex);
  const clientKey = ttApp.key;
  const redirectUri = 'https://autopitamedia.netlify.app/auth/tiktok/callback';
  const csrfState = JSON.stringify({ nicheId, clientKey, appIndex, nonce: Math.random().toString(36).substring(7) });
  const stateBase64 = Buffer.from(csrfState).toString('base64url');
  const scope = getSetting('TIKTOK_SCOPE', 'user.info.basic,user.info.profile,video.publish,video.upload');
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${stateBase64}`;
  
  console.log(`[TIKTOK OAUTH] Using ${ttApp.label} (index ${appIndex}) Key: ${clientKey} for niche ${nicheId}`);
  res.redirect(authUrl);
});


app.get('/auth/tiktok/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  if (error) {
    console.error('[TIKTOK OAUTH] Error:', error, error_description);
    return res.send(`<h2>Otorisasi TikTok Ditolak / Gagal</h2><p>${error_description || error}</p><br><a href="/?tab=accounts">Kembali ke Dashboard</a>`);
  }
  if (!code) {
    return res.send(`<h2>Error</h2><p>Kode otorisasi tidak ditemukan.</p><br><a href="/?tab=accounts">Kembali ke Dashboard</a>`);
  }

  let nicheId = '';
  let clientKey = '';
  let appIndex = 0;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    nicheId = parsed.nicheId || '';
    clientKey = parsed.clientKey || '';
    appIndex = parsed.appIndex || 0;
  } catch (e) {
    nicheId = state || '';
  }

  // Cari app yang sesuai dari TIKTOK_APPS
  const ttApp = getTikTokApp(appIndex);
  if (!clientKey) clientKey = ttApp.key;
  const clientSecret = ttApp.secret;
  const redirectUri = 'https://autopitamedia.netlify.app/auth/tiktok/callback';


  try {
    console.log('[TIKTOK OAUTH] Exchanging auth code for access token...');
    const tokenResp = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });
    const tokenData = await tokenResp.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error.message || JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token || (tokenData.data && tokenData.data.access_token);
    const openId = tokenData.open_id || (tokenData.data && tokenData.data.open_id);

    if (!accessToken) {
      throw new Error('TikTok tidak mengembalikan access_token: ' + JSON.stringify(tokenData));
    }

    // Ambil Info Akun TikTok
    let accountName = 'TikTok Creator';
    let username = '';
    try {
      const userResp = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const userData = await userResp.json();
      if (userData.data && userData.data.user) {
        const u = userData.data.user;
        username = u.username || '';
        accountName = u.display_name || u.username || 'TikTok Creator';
        if (username && !accountName.includes('@')) {
          accountName = `${accountName} (@${username})`;
        }
      }
    } catch (err) {
      console.warn('[TIKTOK USER INFO] Notice:', err.message);
    }

    // Simpan ke SQLite accounts (dengan tt_app_index untuk tracking credential)
    const existing = db.prepare("SELECT * FROM accounts WHERE platform = 'TIKTOK' AND platform_user_id = ?").get(openId);
    if (existing) {
      db.prepare(`
        UPDATE accounts SET
          niche_id = COALESCE(NULLIF(?, ''), niche_id),
          nama_akun = ?,
          token = ?,
          aktif = 'TRUE',
          tt_app_index = ?,
          verified_at = ?
        WHERE akun_id = ?
      `).run(nicheId, accountName, accessToken, appIndex, isoNow(), existing.akun_id);
    } else {
      const akunId = 'ACC-' + crypto.randomUUID().slice(0, 8).toUpperCase();
      db.prepare(`
        INSERT INTO accounts (akun_id, niche_id, platform, nama_akun, platform_user_id, token, aktif, tt_app_index, verified_at)
        VALUES (?, ?, 'TIKTOK', ?, ?, ?, 'TRUE', ?, ?)
      `).run(akunId, nicheId, accountName, openId, accessToken, appIndex, isoNow());
    }

    console.log(`[TIKTOK CONNECTED] Sukses via ${ttApp.label} (index ${appIndex}): ${accountName} (${openId})`);
    res.redirect('/?tab=accounts&connected=tiktok');
  } catch (err) {
    console.error('[TIKTOK TOKEN EXCHANGE ERROR]', err.message);
    res.send(`<h2>Gagal Otorisasi TikTok</h2><p>${err.message}</p><br><a href="/?tab=accounts">Kembali ke Dashboard</a>`);
  }
});

// API Action Router (compatible with Index.html callBackend)
app.post('/api/action', async (req, res) => {
  const { action, args = [] } = req.body;
  try {
    let result = null;

    switch (action) {
      case 'dashboard':
        result = getDashboardData();
        break;

      case 'syncGoogleSheet':
        result = await syncGoogleSheet();
        break;

      case 'scanDrive':
        result = scanDrive(args[0]);
        break;

      // Folder Management
      case 'addDriveFolder':
      case 'updateDriveFolderForNiche': {
        const payload = args[0] || {};
        const nicheId = payload.nicheId || payload.niche_id;
        let folderPath = (payload.folderId || payload.folder_path || payload.folder_id || '').trim();
        folderPath = folderPath.replace(/^["']|["']$/g, '');

        if (!nicheId) throw new Error('Pilih niche terlebih dahulu');
        if (!folderPath) throw new Error('Path folder tidak boleh kosong');

        db.prepare('UPDATE niches SET folder_path = ? WHERE niche_id = ?').run(folderPath, nicheId);
        console.log(`[NICHE] Folder updated for ${nicheId} -> "${folderPath}"`);

        // Automatically scan this folder right away!
        try {
          scanDrive(nicheId);
        } catch (e) {
          console.warn('[SCAN ON UPDATE] Notice:', e.message);
        }

        result = getDashboardData();
        break;
      }

      case 'deleteDriveFolder': {
        const payload = args[0] || {};
        const nicheId = payload.nicheId || payload.niche_id;
        if (nicheId) {
          db.prepare('UPDATE niches SET folder_path = "" WHERE niche_id = ?').run(nicheId);
        }
        result = getDashboardData();
        break;
      }

      // Niche Management
      case 'registerNiche': {
        const p = args[0] || {};
        const nicheId = 'NICHE-' + crypto.randomUUID().slice(0, 8).toUpperCase();
        let folderPath = (p.folderId || p.folder_id || p.folder_path || '').trim().replace(/^["']|["']$/g, '');
        db.prepare(`
          INSERT INTO niches (niche_id, nama, folder_path, aktif, mode_caption, auto_jadwal, auto_publikasi, interval_menit, jam_awal, jam_akhir, batas_harian, instruksi_ai, created_at)
          VALUES (?, ?, ?, 'TRUE', 'MANUAL', ?, ?, 90, '08:00', '20:00', 20, ?, ?)
        `).run(
          nicheId, p.name || 'Niche Baru', folderPath,
          p.autoJadwal !== false ? 'TRUE' : 'FALSE',
          p.autoPublikasi !== false ? 'TRUE' : 'FALSE',
          p.captionTemplate || '',
          isoNow()
        );
        if (folderPath && fs.existsSync(folderPath)) {
          try { scanDrive(nicheId); } catch(e){}
        }
        result = getDashboardData();
        break;
      }

      case 'updateNiche': {
        const p = args[0] || {};
        const nicheId = p.id || p.niche_id;
        let folderPath = (p.folderId || p.folder_id || p.folder_path || '').trim().replace(/^["']|["']$/g, '');
        const jamAwal = (p.jam_awal || p.jamAwal || '08:00').trim();
        const jamAkhir = (p.jam_akhir || p.jamAkhir || '23:00').trim();
        const intervalMenit = Math.max(15, parseInt(p.interval_menit || p.intervalMenit, 10) || 90);
        const batasHarian = Math.max(1, parseInt(p.batas_harian || p.batasHarian, 10) || 20);
        const modeJadwal = (p.mode_jadwal || p.modeJadwal || 'GOLDEN_SLOTS').toUpperCase();

        const defaultBgmEnabled = (p.default_bgm_enabled === 'FALSE' || p.defaultBgmEnabled === 'FALSE' || p.defaultBgmEnabled === false) ? 'FALSE' : 'TRUE';
        const defaultBgmCategory = p.default_bgm_category || p.defaultBgmCategory || 'AUTO';
        const defaultSfxEnabled = (p.default_sfx_enabled === 'FALSE' || p.defaultSfxEnabled === 'FALSE' || p.defaultSfxEnabled === false) ? 'FALSE' : 'TRUE';
        const defaultSfxCategory = p.default_sfx_category || p.defaultSfxCategory || 'AUTO';
        const defaultOutroEnabled = (p.default_outro_enabled === 'FALSE' || p.defaultOutroEnabled === 'FALSE' || p.defaultOutroEnabled === false) ? 'FALSE' : 'TRUE';
        const defaultOutroText = (p.default_outro_text !== undefined && p.default_outro_text !== null && String(p.default_outro_text).trim())
          ? String(p.default_outro_text).trim()
          : (p.defaultOutroText !== undefined && String(p.defaultOutroText).trim() ? String(p.defaultOutroText).trim() : getDefaultOutroText(p.name));

        db.prepare(`
          UPDATE niches SET
            nama = ?,
            folder_path = ?,
            instruksi_ai = ?,
            jam_awal = ?,
            jam_akhir = ?,
            interval_menit = ?,
            batas_harian = ?,
            mode_jadwal = ?,
            default_bgm_enabled = ?,
            default_bgm_category = ?,
            default_sfx_enabled = ?,
            default_sfx_category = ?,
            default_outro_enabled = ?,
            default_outro_text = ?
          WHERE niche_id = ?
        `).run(p.name, folderPath, p.captionTemplate || '', jamAwal, jamAkhir, intervalMenit, batasHarian, modeJadwal, defaultBgmEnabled, defaultBgmCategory, defaultSfxEnabled, defaultSfxCategory, defaultOutroEnabled, defaultOutroText, nicheId);

        if (folderPath && fs.existsSync(folderPath)) {
          try { scanDrive(nicheId); } catch(e){}
        }
        result = getDashboardData();
        break;
      }

      case 'deleteNiche': {
        const nicheId = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].nicheId);
        if (nicheId) {
          db.prepare('DELETE FROM niches WHERE niche_id = ?').run(nicheId);
          db.prepare('DELETE FROM media WHERE niche_id = ?').run(nicheId);
          db.prepare('DELETE FROM posts WHERE niche_id = ?').run(nicheId);
          db.prepare('DELETE FROM jobs WHERE niche_id = ?').run(nicheId);
        }
        result = getDashboardData();
        break;
      }

      // Account Management
      case 'registerAccount': {
        const p = args[0] || {};
        const akunId = 'ACC-' + crypto.randomUUID().slice(0, 8).toUpperCase();
        db.prepare(`
          INSERT INTO accounts (akun_id, niche_id, platform, nama_akun, platform_user_id, token, aktif, verified_at)
          VALUES (?, ?, ?, ?, ?, ?, 'TRUE', ?)
        `).run(
          akunId, p.nicheId || '', p.platform || 'FACEBOOK', p.name || '',
          p.platformUserId || '', p.accessToken || '', isoNow()
        );
        result = getDashboardData();
        break;
      }

      case 'updateAccount': {
        const p = args[0] || {};
        const akunId = p.accountId || p.akun_id;
        let tokenToSave = p.accessToken;

        if (tokenToSave) {
          try {
            const meAccResp = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenToSave}`);
            const meAccData = await meAccResp.json();
            if (Array.isArray(meAccData.data)) {
              const matched = meAccData.data.find(pg => pg.id === p.platform_user_id);
              if (matched && matched.access_token) {
                console.log(`[TOKEN AUTO-RESOLVE] Upgraded user token to Page Token for ${matched.name}`);
                tokenToSave = matched.access_token;
              }
            }
          } catch(e) {
            console.warn('[TOKEN AUTO-RESOLVE] Notice:', e.message);
          }

          db.prepare(`
            UPDATE accounts SET
              nama_akun = ?,
              platform_user_id = ?,
              token = ?
            WHERE akun_id = ?
          `).run(p.nama_akun, p.platform_user_id, tokenToSave, akunId);
        } else {
          db.prepare(`
            UPDATE accounts SET
              nama_akun = ?,
              platform_user_id = ?
            WHERE akun_id = ?
          `).run(p.nama_akun, p.platform_user_id, akunId);
        }
        result = getDashboardData();
        break;
      }

      case 'deleteSocialAccount': {
        const akunId = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].accountId);
        if (akunId) {
          db.prepare('DELETE FROM accounts WHERE akun_id = ?').run(akunId);
          db.prepare('DELETE FROM jobs WHERE akun_id = ?').run(akunId);
        }
        result = getDashboardData();
        break;
      }

      case 'testConnection':
      case 'testMetaAccountConnection': {
        const akunId = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].accountId);
        const acc = db.prepare('SELECT * FROM accounts WHERE akun_id = ?').get(akunId);
        if (!acc || !acc.token) throw new Error('Akun atau token tidak ada.');
        
        if (acc.platform === 'TIKTOK') {
          const testResp = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username', {
            headers: { 'Authorization': `Bearer ${acc.token}` }
          });
          const testData = await testResp.json();
          if (testData.error && testData.error.code !== 'ok') {
            throw new Error(`[${acc.nama_akun}] TikTok menolak: ${testData.error.message || JSON.stringify(testData.error)}`);
          }
          result = { success: true, nama_akun: acc.nama_akun, detail: testData.data?.user || testData };
          break;
        }

        const targetUrl = `https://graph.facebook.com/v21.0/${acc.platform_user_id}?fields=id,name,username&access_token=${acc.token}`;
        const testResp = await fetch(targetUrl);
        const testData = await testResp.json();
        if (testData.error) {
          throw new Error(`[${acc.nama_akun}] Meta menolak: ${testData.error.message}`);
        }
        result = { success: true, nama_akun: acc.nama_akun, detail: testData };
        break;
      }

      case 'schedulePost': {
        const p = args[0] || {};
        result = saveScheduleWeb({
          mediaId: p.mediaId,
          akunIds: p.accountIds || [],
          coverOffsetMs: p.coverOffsetMs || p.cover_offset_ms || 1800,
          bgmEnabled: p.bgmEnabled !== undefined ? p.bgmEnabled : true,
          bgmCategory: p.bgmCategory || 'AUTO',
          bgmVolume: p.bgmVolume !== undefined ? p.bgmVolume : 0.15,
          sfxEnabled: p.sfxEnabled !== undefined ? p.sfxEnabled : true,
          sfxCategory: p.sfxCategory || 'AUTO',
          sfxVolume: p.sfxVolume !== undefined ? p.sfxVolume : 0.60,
          outroEnabled: p.outroEnabled !== undefined ? p.outroEnabled : true,
          outroText: p.outroText || '',
          scheduledTime: new Date(p.when).toLocaleString('sv-SE').slice(0, 16)
        });
        break;
      }

      case 'sanitizeAntiShadowban': {
        const text = args[0] || '';
        result = {
          original: text,
          sanitized: sanitizeCaptionAntiShadowban(text),
          detected: detectSensitiveWords(text),
          totalKamus: ANTI_SHADOWBAN_DICTIONARY.length
        };
        break;
      }

      case 'toggleAutoJadwalWeb': {
        const [nicheId, val] = args;
        db.prepare('UPDATE niches SET auto_jadwal = ? WHERE niche_id = ?').run(val ? 'TRUE' : 'FALSE', nicheId);
        if (val) autoScheduleUnscheduledMedia();
        result = getDashboardData();
        break;
      }

      case 'toggleAutoPublikasiWeb': {
        const [nicheId, val] = args;
        db.prepare('UPDATE niches SET auto_publikasi = ? WHERE niche_id = ?').run(val ? 'TRUE' : 'FALSE', nicheId);
        result = getDashboardData();
        break;
      }

      case 'generateCaption':
        result = await generateCaption(args[0], args[1]);
        break;

      case 'savePost':
        result = savePost(args[0]);
        break;

      case 'saveScheduleWeb':
        result = saveScheduleWeb(args[0]);
        break;

      case 'retryJobWeb':
        result = await publishJob(args[0]);
        break;

      case 'sinkronkanPerformaWeb':
        result = await sinkronkanPerformaWeb();
        break;

      case 'syncMetaCalendar':
        result = await syncMetaCalendar();
        break;

      case 'deleteJobWeb': {
        const jobId = args[0];
        if (jobId) {
          const job = db.prepare('SELECT * FROM jobs WHERE job_id = ?').get(jobId);
          db.prepare('DELETE FROM jobs WHERE job_id = ?').run(jobId);
          if (job && job.jadwal_id) {
            const rem = db.prepare('SELECT count(*) as cnt FROM jobs WHERE jadwal_id = ?').get(job.jadwal_id);
            if (!rem || rem.cnt === 0) {
              db.prepare('DELETE FROM schedules WHERE jadwal_id = ?').run(job.jadwal_id);
            }
          }
          console.log(`[JOB DELETED] Job ${jobId} berhasil dihapus.`);
        }
        result = getDashboardData();
        break;
      }

      case 'cleanupCancelledJobsWeb': {
        const deleted = db.prepare("DELETE FROM jobs WHERE status = 'CANCELLED'").run();
        try {
          db.prepare("DELETE FROM schedules WHERE jadwal_id NOT IN (SELECT DISTINCT jadwal_id FROM jobs)").run();
        } catch(e) {}
        console.log(`[CLEANUP] Berhasil membersihkan ${deleted.changes || 0} job yang dibatalkan.`);
        result = getDashboardData();
        break;
      }

      case 'jalankanAntreanWeb': {
        const pending = db.prepare("SELECT job_id FROM jobs WHERE status = 'READY' LIMIT 1").get();
        if (pending) {
          result = await publishJob(pending.job_id);
        } else {
          result = getDashboardData();
        }
        break;
      }

      case 'openFileLocation':
      case 'openLocalFile': {
        const [mediaId, mode = 'folder'] = args; // default to folder
        const media = db.prepare('SELECT file_path, nama_file FROM media WHERE media_id = ?').get(mediaId);
        if (!media || !media.file_path || !fs.existsSync(media.file_path)) {
          throw new Error('File video fisik tidak ditemukan di komputer.');
        }
        const { spawn, exec } = require('child_process');
        if (mode === 'play') {
          const cleanPath = media.file_path.replace(/"/g, '');
          exec(`cmd.exe /c start "" "${cleanPath}"`);
          result = { success: true, mode: 'play', message: `Memutar "${media.nama_file}" di pemutar komputer...`, path: media.file_path };
        } else {
          const child = spawn('explorer.exe', ['/select,' + media.file_path], { detached: true, stdio: 'ignore' });
          child.unref();
          result = { success: true, mode: 'folder', message: 'Membuka folder lokasi file di File Explorer...', path: media.file_path };
        }
        break;
      }

      case 'scanAllVideos':
        autoSyncLocalFolders();
        result = getDashboardData();
        break;

      default:
        console.warn('[ROUTER] Unknown action:', action);
        result = getDashboardData();
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error(`[ERROR API] ${action}:`, err.message);
    res.status(400).json({ error: err.message });
  }
});

// Live Folder Watcher for real-time auto sync
function setupFolderWatchers() {
  try {
    const niches = db.prepare('SELECT niche_id, folder_path FROM niches').all();
    let debounceTimer = null;
    for (const n of niches) {
      if (n.folder_path && fs.existsSync(n.folder_path)) {
        try {
          fs.watch(n.folder_path, { persistent: false }, (eventType, filename) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              console.log('[WATCHER] Detected file change in folder:', n.folder_path);
              autoSyncLocalFolders();
            }, 300);
          });
          console.log('[WATCHER] Watching folder for changes:', n.folder_path);
        } catch (we) {
          console.warn('[WATCHER] Could not watch:', n.folder_path, we.message);
        }
      }
    }
  } catch (e) {
    console.warn('[WATCHER] Setup error:', e.message);
  }
}

// Start Server
app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🚀 Auto PitaMedia Studio Server running on:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`📁 Database: SQLite (data.sqlite)`);
  console.log('========================================================');
  setupFolderWatchers();
});
