# Pushes the bot engine's server-side variables to Vercel.
#
# Reads every value from the local `.env` so the key never has to be typed, and
# pipes each one on stdin — `vercel env add` prompts interactively otherwise.
#
# These are deliberately NOT VITE_-prefixed. Vite inlines VITE_ variables into
# the client bundle at build time, which would publish the provider key to every
# visitor. They are read from process.env inside api/ and stay server-side.
#
# Usage: .\scripts\push-bot-env-to-vercel.ps1 [-Target production]

[CmdletBinding()]
param(
  [ValidateSet('production', 'preview', 'development')]
  [string]$Target = 'production'
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

$envFile = Join-Path (Get-Location) '.env'
if (-not (Test-Path $envFile)) {
  Write-Error "No .env found at $envFile."
}

# Parse KEY=VALUE, unquoting values that were written in quotes.
$vars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*#' -or -not $line.Contains('=')) { continue }
  $key, $value = $line -split '=', 2
  $key = $key.Trim()
  $value = $value.Trim()
  if (
    ($value.StartsWith('"') -and $value.EndsWith('"')) -or
    ($value.StartsWith("'") -and $value.EndsWith("'"))
  ) {
    $value = $value.Substring(1, $value.Length - 2)
  }
  if ($key -and $value) { $vars[$key] = $value }
}

# Base64 of the service account. Vercel environment variables cannot contain
# raw newlines, so the JSON has to be encoded before it can be sent.
$serviceAccountPath = $vars['FIREBASE_SERVICE_ACCOUNT']
if ($serviceAccountPath) {
  $absolute = Join-Path (Get-Location) $serviceAccountPath
  if (Test-Path $absolute) {
    $vars['FIREBASE_SERVICE_ACCOUNT_B64'] =
      [Convert]::ToBase64String([IO.File]::ReadAllBytes($absolute))
  } else {
    Write-Warning "Service account not found at $absolute; skipping FIREBASE_SERVICE_ACCOUNT_B64."
  }
}

$wanted = @(
  'BOT_BASE_URL',
  'BOT_API_KEY',
  'BOT_MODEL_ID',
  'BOT_TICK_SECRET',
  'VITE_BOT_ENABLED',
  'FIREBASE_SERVICE_ACCOUNT_B64'
)

$missing = $wanted | Where-Object { -not $vars[$_] }
if ($missing.Count -gt 0) {
  Write-Error "These have no value in .env: $($missing -join ', ')"
}

Write-Host "Uploading $($wanted.Count) variable(s) to '$Target':" -ForegroundColor Cyan
$wanted | ForEach-Object { Write-Host "  - $_" }
Write-Host ''

$failed = @()
foreach ($name in $wanted) {
  $value = $vars[$name]
  Write-Host "Uploading $name... " -NoNewline

  $value | npx --yes vercel@latest env add $name $Target --yes 2>&1 | Out-Null

  if ($LASTEXITCODE -ne 0) {
    Write-Host 'FAILED' -ForegroundColor Red
    $failed += $name
  } else {
    # Never echo the value itself, only its length, as a sanity check.
    Write-Host "ok ($($value.Length) chars)" -ForegroundColor Green
  }
}

Write-Host ''
if ($failed.Count -gt 0) {
  Write-Error "Failed: $($failed -join ', ')"
}

Write-Host "All $($wanted.Count) variable(s) uploaded to '$Target'." -ForegroundColor Green
Write-Host 'A redeploy is required for the new values to take effect — environment'
Write-Host 'variables are read at build/runtime, not injected into an existing deploy.'
