#!/usr/bin/env pwsh
# One command to run CORRIDOR end to end:
#   - Docker stack (Postgres + pgvector, MinIO, FastAPI backend)
#   - host LLM routing sidecar (bridges the backend to the Claude CLI)
#   - frontend dev server (Vite)
# Usage:  ./run.ps1     Stop:  docker compose down   (and close the sidecar window)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Test-Docker {
    docker info *> $null
    return $LASTEXITCODE -eq 0
}

Write-Host "CORRIDOR launcher" -ForegroundColor Cyan

# 1. Docker Desktop
if (-not (Test-Docker)) {
    Write-Host "Docker not responding, starting Docker Desktop..." -ForegroundColor Yellow
    $dd = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dd) { Start-Process $dd }
    $tries = 0
    while (-not (Test-Docker)) {
        if ($tries -ge 60) { throw "Docker did not become ready in time." }
        Start-Sleep -Seconds 3
        $tries++
    }
}
Write-Host "Docker is running." -ForegroundColor Green

# 2. Backend stack (builds the backend image on first run)
Write-Host "Starting db, minio, backend..." -ForegroundColor Yellow
docker compose up -d --remove-orphans
if ($LASTEXITCODE -ne 0) { throw "docker compose up failed." }

# 3. LLM routing sidecar on the host (live scenario routing via Claude CLI)
if (Get-Command claude -ErrorAction SilentlyContinue) {
    Write-Host "Starting LLM routing sidecar on :8077..." -ForegroundColor Yellow
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "python `"$root\tools\llm_sidecar.py`"" -WorkingDirectory $root
} else {
    Write-Host "claude CLI not found; scenario routing will use the keyword fallback." -ForegroundColor DarkYellow
}

# 4. Frontend dev server (host)
Set-Location "$root\frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "  Frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend  : http://localhost:8000/health" -ForegroundColor Green
Write-Host "  Signals  : http://localhost:8000/signals/status" -ForegroundColor Green
Write-Host "  MinIO    : http://localhost:9001" -ForegroundColor Green
Write-Host "  Stop     : docker compose down  (then close the sidecar window)" -ForegroundColor DarkGray
Write-Host ""

npm run dev
