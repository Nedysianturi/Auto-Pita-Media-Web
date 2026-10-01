/**
 * PITAMEDIA STUDIO - LICENSE KEY GENERATOR (OWNER TOOL)
 * 
 * Gunakan skrip ini untuk membuat Lisensi Resmi 1-PC untuk pembeli.
 * Tersedia 2 Paket:
 *   1. LIFETIME - Akses Permanen Selamanya (1 Komputer)
 *   2. TRIAL    - Masa Uji Coba 7 Hari (1 Komputer)
 * 
 * Cara Penggunaan:
 *   node generate-license.js <MACHINE_ID> [LIFETIME/TRIAL] [NAMA_PEMBELI]
 * 
 * Contoh:
 *   node generate-license.js PM-DAAB-3B00-4B71-11E4 LIFETIME "Budi Santoso"
 *   node generate-license.js PM-DAAB-3B00-4B71-11E4 TRIAL "Calon Pembeli"
 */

const crypto = require('crypto');

const LICENSE_SECRET = process.env.PITAMEDIA_LICENSE_SECRET || 'PitaMediaStudioMasterSecret2026SaltKeyLock';

const args = process.argv.slice(2);
const hwid = (args[0] || '').trim().toUpperCase();
let plan = (args[1] || 'LIFETIME').trim().toUpperCase();
if (plan !== 'TRIAL') plan = 'LIFETIME'; // Hanya 2 opsi lisensi pembeli: LIFETIME dan TRIAL
const customerName = args[2] || 'Pembeli Resmi';

if (!hwid) {
  console.log('\n======================================================');
  console.log('🎫 PITAMEDIA STUDIO LICENSE GENERATOR (CLI)');
  console.log('======================================================');
  console.log('Error: Harap masukkan Machine ID komputer pembeli!\n');
  console.log('Format Perintah:');
  console.log('  node generate-license.js <MACHINE_ID> [LIFETIME/TRIAL] [NAMA_PEMBELI]\n');
  console.log('Contoh:');
  console.log('  node generate-license.js PM-DAAB-3B00-4B71-11E4 LIFETIME "Budi Santoso"');
  console.log('  node generate-license.js PM-DAAB-3B00-4B71-11E4 TRIAL "Calon Pembeli"\n');
  process.exit(1);
}

// Generate Signature
const sig = crypto.createHmac('sha256', LICENSE_SECRET)
  .update(`${hwid}:${plan}`)
  .digest('hex')
  .toUpperCase();

const licenseKey = `PITA-${plan}-${sig.slice(0, 4)}-${sig.slice(4, 8)}-${sig.slice(8, 12)}`;
const planLabel = plan === 'TRIAL' ? 'TRIAL (Masa Uji Coba 7 Hari)' : 'LIFETIME (Akses Permanen Selamanya)';

console.log('\n================================================================');
console.log('🎉 LISENSI RESMI PITAMEDIA STUDIO BERHASIL DIBUAT!');
console.log('================================================================');
console.log(`👤 Nama Pembeli    : ${customerName}`);
console.log(`💻 Machine ID (PC) : ${hwid}`);
console.log(`📦 Tipe Paket      : ${planLabel} (1 Komputer Terkunci)`);
console.log(`🔑 KUNCI LISENSI   : ${licenseKey}`);
console.log('================================================================');
console.log('\n📋 FORMAT PESAN UNTUK DIKIRIM KE PEMBELI (WhatsApp / Email):');
console.log('----------------------------------------------------------------');
console.log(`Halo Kak ${customerName}, terima kasih telah memilih PitaMedia Studio!`);
console.log(`Berikut adalah lisensi resmi Anda yang terikat khusus ke komputer Anda:\n`);
console.log(`• Machine ID Komputer : ${hwid}`);
console.log(`• Tipe Lisensi        : ${planLabel}`);
console.log(`• Kunci Lisensi       : ${licenseKey}\n`);
console.log(`Petunjuk Aktivasi:`);
console.log(`1. Buka aplikasi PitaMedia Studio di browser Anda.`);
console.log(`2. Masukkan Kunci Lisensi di atas pada pop-up aktivasi.`);
console.log(`3. Klik tombol "Aktivasi Sekarang".`);
console.log(`(Catatan: Lisensi ini hanya bisa digunakan di komputer dengan Machine ID di atas).\n`);
console.log('================================================================\n');
