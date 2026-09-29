' PitaMedia Studio 24/7 Silent Auto-Restart Watchdog Service
' Berjalan mandiri di sistem Windows tanpa jendela hitam (silent)
' Jika server mati atau crash, otomatis dihidupkan ulang dalam 2 detik.

Set WshShell = CreateObject("WScript.Shell")
strDir = "C:\Users\Cipad\.gemini\antigravity-ide\scratch\pitamedia-studio"
WshShell.CurrentDirectory = strDir

Do
    ' Jalankan node server.js 100% tersembunyi (0 = hidden, True = tunggu sampai proses selesai)
    WshShell.Run "node server.js", 0, True
    ' Jika server berhenti/tertutup, jeda 2 detik lalu hidupkan kembali otomatis
    WScript.Sleep 2000
Loop
