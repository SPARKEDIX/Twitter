<#
.SYNOPSIS
  Pushes every VITE_FIREBASE_* key from your local .env to Vercel and
  triggers a fresh production build.

.DESCRIPTION
  Vite inlines import.meta.env.VITE_* at BUILD time, so the variables must
  exist on Vercel before the build runs - setting them after a build has
  already happened has no effect until a new deployment.

  Requires the Vercel CLI to be authenticated for this project
  (run `npx vercel login` and `npx vercel link` once).

.EXAMPLE
  .\scripts\push-env-to-vercel.ps1
  .\scripts\push-env-to-vercel.ps1 -Target preview
#>
[CmdletBinding()]
param(
  [ValidateSet('production', 'preview', 'development')]
  [string]$Target = 'production',

  # Skip the final redeploy if you only want the variables uploaded.
  [switch]$NoDeploy
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$envFile = Join-Path (Get-Location) '.env'

if (-not (Test-Path $envFile)) {
  Write-Error "No .env found at $envFile. Copy .env.example to .env and fill it in first."
}

# Parse KEY=VALUE lines. Skips blanks, comments, and the optional empty values
# (e.g. VITE_FIREBASE_MEASUREMENT_ID) which Vercel accepts but need no upload.
$vars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*#' -or -not $line.Contains('=')) { continue }
  $key, $value = $line -split '=', 2
  $key = $key.Trim()
  $value = $value.Trim()
  if ($key.StartsWith('VITE_') -and $value) {
    $vars[$key] = $value
  }
}

if ($vars.Count -eq 0) {
  Write-Error 'No populated VITE_* variables found in .env.'
}

Write-Host "Found $($vars.Count) variable(s) to upload to '$Target':" -ForegroundColor Cyan
$vars.Keys | Sort-Object | ForEach-Object { Write-Host "  - $_" }
Write-Host ''

foreach ($key in ($vars.Keys | Sort-Object)) {
  Write-Host "Uploading $key..." -NoNewline
  # The CLI prompts for the value on stdin, so pipe it in. --yes suppresses the
  # confirmation prompt and any sensitive-value question.
  $vars[$key] | npx --yes vercel@latest env add $key $Target --yes | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'FAILED' -ForegroundColor Red
    Write-Error "Failed to add $key. Is the CLI logged in? (npx vercel login)"
  }
  Write-Host ' ok' -ForegroundColor Green
}

Write-Host ''
Write-Host "All $($vars.Count) variable(s) uploaded to '$Target'." -ForegroundColor Green

if (-not $NoDeploy) {
  Write-Host 'Triggering a fresh production build...' -ForegroundColor Cyan
  npx --yes vercel@latest redeploy --prod | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'Redeploy requested. Vite will inline the values into the new bundle.' -ForegroundColor Green
  } else {
    Write-Host 'Redeploy failed - trigger it manually from the Vercel dashboard.' -ForegroundColor Yellow
  }
}
