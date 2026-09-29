' PitaMedia Studio 24/7 Auto-Restart Watchdog Service
' Berjalan terus di latar belakang Windows tanpa jendela hitam (silent)
' Jika server mati atau crash, otomatis dihidupkan ulang dalam 3 detik.

Set WshShell = CreateObject("WScript.Shell")
strDir = "C:\Users\Cipad\.gemini\antigravity-ide\scratch\pitamedia-studio"
WshShell.CurrentDirectory = strDir

Do
    Set oExec = WshShell.Exec("cmd /c netstat -ano | findstr :3000 | findstr LISTENING")
    strOut = oExec.StdOut.ReadAll()
    
    If InStr(strOut, "LISTENING") = 0 Then
        ' Jalankan node server.js tersembunyi (0 = hidden) dan tunggu jika keluar
        WshShell.Run "node server.js", 0, True
    End If
    
    WScript.Sleep 3000
Loop
