Set WshShell = CreateObject("WScript.Shell")
Dim fso, scriptDir, parentDir, pythonPath
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
parentDir = fso.GetParentFolderName(scriptDir)
WshShell.CurrentDirectory = parentDir & "\Mark-XLVI"
pythonPath = parentDir & "\Mark-XLVI\.venv\Scripts\python.exe"
WshShell.Run chr(34) & pythonPath & chr(34) & " main.py --hide", 0, True
