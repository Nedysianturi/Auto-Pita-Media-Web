Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = "C:\Users\Cipad\.gemini\antigravity-ide\scratch\pitamedia-studio"
WshShell.CurrentDirectory = strDir

' Check if server is running on port 3000
Set oExec = WshShell.Exec("cmd /c netstat -ano | findstr :3000 | findstr LISTENING")
strOut = oExec.StdOut.ReadAll()

If InStr(strOut, "LISTENING") = 0 Then
    ' Start node server silently in background with NO black window (0 = hidden)
    WshShell.Run "node server.js", 0, False
    WScript.Sleep 1500
End If

' Find Chrome or Edge to launch in Native App Mode (Frameless window without URL bar or tabs)
strBrowser = ""
If fso.FileExists("C:\Program Files\Google\Chrome\Application\chrome.exe") Then
    strBrowser = """C:\Program Files\Google\Chrome\Application\chrome.exe"" --app=http://localhost:3000 --window-size=1366,850"
ElseIf fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
    strBrowser = """C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"" --app=http://localhost:3000 --window-size=1366,850"
Else
    strBrowser = "cmd /c start http://localhost:3000"
End If

WshShell.Run strBrowser, 1, False
