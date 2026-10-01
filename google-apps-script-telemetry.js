/**
 * ==============================================================================
 * PITAMEDIA STUDIO - GOOGLE APPS SCRIPT MASTER TELEMETRY WEBHOOK
 * ==============================================================================
 * Skrip ini dipasang di Google Spreadsheet BARU milik Anda (Khusus Pemilik/Pengembang)
 * untuk mencatat setiap pembeli yang melakukan aktivasi (Nama, Email, Lisensi, HWID).
 * 
 * PANDUAN PEMASANGAN (Hanya Sekali):
 * 1. Buka https://sheets.google.com/ dan buat Spreadsheet Baru.
 *    Beri judul: "Database Pembeli & Lisensi PitaMedia Studio"
 * 2. Klik menu: Ekstensi (Extensions) > Apps Script.
 * 3. Hapus semua kode default di editor, lalu Tempel (Paste) seluruh kode di bawah ini.
 * 4. Klik ikon Disket (Simpan) di bagian atas.
 * 5. Klik tombol biru "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web App).
 *    - Deskripsi: "Master License Telemetry Webhook"
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone) -> (Wajib agar aplikasi pembeli bisa mengirim data).
 * 7. Klik "Terapkan" (Deploy), lalu klik "Berikan Akses" (Authorize access) dengan akun Google Anda.
 * 8. Salin URL Aplikasi Web yang diberikan (diawali https://script.google.com/macros/s/...).
 * 9. Tempelkan URL tersebut ke tab Pengaturan di PitaMedia Studio (Bagian: Master Webhook Telemetry).
 * ==============================================================================
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Aktivasi Pembeli");
    
    // Jika sheet belum ada, buat otomatis beserta judul kolomnya
    if (!sheet) {
      sheet = ss.insertSheet("Aktivasi Pembeli");
      var headers = [
        "Waktu Aktivasi (WIB)", 
        "Nama Pembeli", 
        "Email Pembeli", 
        "Machine ID Komputer", 
        "Tipe Lisensi", 
        "Kunci Lisensi", 
        "Status", 
        "Batas Kadaluwarsa", 
        "Sistem Operasi", 
        "Versi App"
      ];
      sheet.appendRow(headers);
      
      // Beri gaya visual profesional pada Header
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground("#4338ca");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // Format Waktu WIB
    var nowWib = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    var expFormatted = data.expires_at === "PERMANENT" ? "PERMANEN (Selamanya)" : data.expires_at;
    
    var newRow = [
      nowWib,
      data.customer_name || "-",
      data.customer_email || "-",
      data.hwid || "-",
      data.plan || "LIFETIME",
      data.license_key || "-",
      data.status || "ACTIVE",
      expFormatted,
      data.os_info || "-",
      data.app_version || "2.5.0"
    ];
    
    sheet.appendRow(newRow);
    
    // Auto-fit kolom agar rapi dibaca
    for (var i = 1; i <= newRow.length; i++) {
      sheet.autoResizeColumn(i);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data pembeli berhasil dicatat di Master Google Sheet!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("PitaMedia Studio Master Telemetry Webhook is ONLINE and READY!");
}
