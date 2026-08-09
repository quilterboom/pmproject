@echo off
REM Enable Windows virtualization for Docker Desktop (WSL2 / Hyper-V backend).
REM Right-click this file -> Run as administrator. Only enables features; safe.
REM After running, reboot, then start Docker Desktop.

NET SESSION >nul 2>&1
if not "%errorLevel%"=="0" (
  echo This script requires Administrator privileges.
  echo Requesting UAC elevation...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo [1/4] Enabling Virtual Machine Platform ...
dism /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

echo [2/4] Enabling Windows Subsystem for Linux ...
dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

echo [3/4] Enabling Hypervisor Platform ...
dism /online /enable-feature /featurename:HypervisorPlatform /all /norestart

echo [4/4] Setting hypervisorlaunchtype = auto ...
bcdedit /set hypervisorlaunchtype auto

echo.
echo Done. If WSL is not installed yet, run: wsl --install
echo Please REBOOT now, then start Docker Desktop.
pause
