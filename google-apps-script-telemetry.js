/**
 * ==============================================================================
 * PITAMEDIA STUDIO - GOOGLE APPS SCRIPT MASTER TELEMETRY WEBHOOK
 * ==============================================================================
 * Skrip ini dipasang di Google Spreadsheet milik Anda (Khusus Pemilik/Pengembang)
 * untuk memisahkan data secara otomatis ke dalam 2 Tab Lembar Kerja:
 * 
 * 1. TAB "Developer"         : Khusus mencatat data & lisensi Anda sebagai Pengembang Utama.
 * 2. TAB "Aktivasi Pembeli"  : Khusus mencatat setiap pembeli yang aktivasi (Lifetime / Trial).
 * 
 * PANDUAN PEMBARUAN (Hanya 1 Menit):
 * 1. Buka Spreadsheet Google Sheets Anda (Database Pembeli & Lisensi PitaMedia Studio).
 * 2. Klik menu: Ekstensi (Extensions) > Apps Script.
 * 3. Hapus seluruh kode lama di Apps Script, lalu Tempel (Paste) kode baru di bawah ini.
 * 4. Klik ikon Disket (Simpan).
 * 5. Klik tombol biru "Kelola Penerapan" (Manage deployments) atau "Penerapan Baru" (New deployment).
 * 6. Jika membuat penerapan baru:
 *    - Jenis: "Aplikasi Web" (Web App).
 *    - Akses: "Siapa saja" (Anyone) -> (Wajib agar aplikasi pembeli bisa kirim data).
 *    - Klik Terapkan (Deploy).
 * ==============================================================================
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Deteksi apakah data ini milik DEVELOPER MASTER atau KONSUMEN / PEMBELI
    var isDev = (data.action === "log_developer") || 
                (String(data.plan || "").toUpperCase().indexOf("DEVELOPER") !== -1) || 
                (String(data.role || "").toUpperCase().indexOf("DEVELOPER") !== -1) ||
                (String(data.role || "").toUpperCase().indexOf("PENGEMBANG") !== -1) ||
                (String(data.target_sheet || "").toLowerCase() === "developer");
                
    var targetSheetName = isDev ? "Developer" : "Aktivasi Pembeli";
    var sheet = ss.getSheetByName(targetSheetName);
    
    var nowWib = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    // =========================================================================
    // 1. JIKA DATA DEVELOPER -> SIMPAN KE TAB "Developer"
    // =========================================================================
    if (isDev) {
      if (!sheet) {
        sheet = ss.insertSheet("Developer");
        var devHeaders = [
          "Waktu Sinkron (WIB)", 
          "Nama Pengembang (Owner)", 
          "Email Pengembang", 
          "Machine ID (HWID)", 
          "Tipe Lisensi", 
          "Kunci Lisensi Master", 
          "Status Lisensi", 
          "Akses Fitur", 
          "Sistem Operasi", 
          "Versi App"
        ];
        sheet.appendRow(devHeaders);
        
        var headerRange = sheet.getRange(1, 1, 1, devHeaders.length);
        headerRange.setBackground("#6d28d9"); // Royal Purple Developer
        headerRange.setFontColor("#ffffff");
        headerRange.setFontWeight("bold");
        headerRange.setHorizontalAlignment("center");
        sheet.setFrozenRows(1);
      }
      
      var devRow = [
        nowWib,
        data.customer_name || "kennedi",
        data.customer_email || "Cipadata@gmail.com",
        data.hwid || "-",
        data.plan || "👑 DEVELOPER MASTER",
        data.license_key || "-",
        data.status || "👑 ACTIVE",
        "AKSES PENUH PENGEMBANG (UNLIMITED)",
        data.os_info || "-",
        data.app_version || "2.5.0"
      ];
      sheet.appendRow(devRow);
      
      for (var i = 1; i <= devRow.length; i++) {
        sheet.autoResizeColumn(i);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheet: "Developer",
        message: "Data Pengembang berhasil dicatat di tab khusus 'Developer'!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // =========================================================================
    // 2. JIKA DATA PEMBELI -> SIMPAN KE TAB "Aktivasi Pembeli"
    // =========================================================================
    if (!sheet) {
      sheet = ss.insertSheet("Aktivasi Pembeli");
      var buyerHeaders = [
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
      sheet.appendRow(buyerHeaders);
      
      var bHeaderRange = sheet.getRange(1, 1, 1, buyerHeaders.length);
      bHeaderRange.setBackground("#1e40af"); // Ocean Blue Buyer
      bHeaderRange.setFontColor("#ffffff");
      bHeaderRange.setFontWeight("bold");
      bHeaderRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    var expFormatted = data.expires_at === "PERMANENT" ? "PERMANEN (Selamanya)" : data.expires_at;
    
    var buyerRow = [
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
    sheet.appendRow(buyerRow);
    
    for (var j = 1; j <= buyerRow.length; j++) {
      sheet.autoResizeColumn(j);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      sheet: "Aktivasi Pembeli",
      message: "Data pembeli berhasil dicatat di tab 'Aktivasi Pembeli'!"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("PitaMedia Studio Master Telemetry Webhook is ONLINE and READY! (Separated Tabs: Developer & Aktivasi Pembeli)");
}
