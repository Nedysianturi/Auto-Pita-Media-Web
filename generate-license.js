/**
 * PITAMEDIA STUDIO - LICENSE KEY GENERATOR (OWNER TOOL)
 * 
 * Gunakan skrip ini untuk membuat Lisensi Resmi 1-PC untuk pembeli.
 * 
 * Cara Penggunaan:
 *   node generate-license.js <MACHINE_ID> [TIPE_PAKET] [NAMA_PEMBELI]
 * 
 * Contoh:
 *   node generate-license.js PM-DAAB-3B00-4B71-11E4 LIFETIME "Budi Santoso"
 *   node generate-license.js PM-DAAB-3B00-4B71-11E4 ANNUAL "Studio Kreatif"
 */

const crypto = require('crypto');

const LICENSE_SECRET = process.env.PITAMEDIA_LICENSE_SECRET || 'PitaMediaStudioMasterSecret2026SaltKeyLock';

const args = process.argv.slice(2);
const hwid = (args[0] || '').trim().toUpperCase();
const plan = (args[1] || 'LIFETIME').trim().toUpperCase();
const customerName = args[2] || 'Pembeli Resmi';

if (!hwid) {
  console.log('\n======================================================');
  console.log('🎫 PITAMEDIA STUDIO LICENSE GENERATOR (CLI)');
  console.log('======================================================');
  console.log('Error: Harap masukkan Machine ID komputer pembeli!\n');
  console.log('Contoh Penggunaan:');
  console.log('  node generate-license.js PM-DAAB-3B00-4B71-11E4 LIFETIME "Budi Santoso"\n');
  process.exit(1);
}

// Generate Signature
const sig = crypto.createHmac('sha256', LICENSE_SECRET)
  .update(`${hwid}:${plan}`)
  .digest('hex')
  .toUpperCase();

const licenseKey = `PITA-${plan}-${sig.slice(0, 4)}-${sig.slice(4, 8)}-${sig.slice(8, 12)}`;

console.log('\n================================================================');
console.log('🎉 LISENSI RESMI PITAMEDIA STUDIO BERHASIL DIBUAT!');
console.log('================================================================');
console.log(`👤 Nama Pembeli    : ${customerName}`);
console.log(`💻 Machine ID (PC) : ${hwid}`);
console.log(`📦 Tipe Paket      : ${plan} (1 Komputer Terkunci)`);
console.log(`🔑 KUNCI LISENSI   : ${licenseKey}`);
console.log('================================================================');
console.log('\n📋 FORMAT PESAN UNTUK DIKIRIM KE PEMBELI (WhatsApp / Email):');
console.log('----------------------------------------------------------------');
console.log(`Halo Kak ${customerName}, terima kasih atas pembelian PitaMedia Studio!`);
console.log(`Berikut adalah lisensi resmi Anda yang terkunci untuk komputer Anda:\n`);
console.log(`• Machine ID Komputer : ${hwid}`);
console.log(`• Tipe Lisensi        : ${plan} (1 Komputer)`);
console.log(`• Kode Lisensi        : ${licenseKey}\n`);
console.log(`Petunjuk Aktivasi:`);
console.log(`1. Buka aplikasi PitaMedia Studio di browser Anda.`);
console.log(`2. Masukkan Kode Lisensi di atas pada jendela aktivasi.`);
console.log(`3. Klik tombol "Aktivasi Sekarang".`);
console.log(`(Catatan: Lisensi ini hanya bisa digunakan di komputer dengan Machine ID di atas).\n`);
console.log('================================================================\n');
