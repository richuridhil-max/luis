@echo off
title LUISCART Premium E-Commerce Management Platform
echo ===============================================================
echo   LUISCART -- Premium E-Commerce Management & Admin Platform
echo ===============================================================
echo.

set NODE_EXEC=node
where node >nul 2>nul
if %errorlevel% neq 0 (
  if exist "C:\Users\VICTUS\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
    set NODE_EXEC="C:\Users\VICTUS\AppData\Roaming\Antigravity\bin\agy-node.cmd"
  )
)

echo Starting LUISCART Server on http://localhost:3001 ...
call %NODE_EXEC% server/server.js
pause
