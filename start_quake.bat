@echo off
cd /d "%~dp0"
node build-smtc.js
start "" "node_modules\electron\dist\electron.exe" .
