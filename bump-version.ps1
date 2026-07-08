# Atomurus — cache-bust version bumper
#
# Sweeps every .html file under this directory and replaces all ?v=NNN
# query strings on local asset URLs with a single fresh version, so users
# never get stuck with a stale CSS/JS after a deploy.
#
# Usage:
#   .\bump-version.ps1                              # auto: YYYYMMDDHHmm
#   .\bump-version.ps1 -Version 20260601            # explicit value
#   .\bump-version.ps1 -DryRun                      # show counts, don't write

param(
    [string]$Version = (Get-Date -Format "yyyyMMddHHmm"),
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$files = Get-ChildItem -Path $root -Filter *.html -Recurse
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$pattern   = '\?v=\d+'
$replace   = "?v=$Version"

$filesTouched  = 0
$totalReplaces = 0

foreach ($f in $files) {
    $bytes  = [System.IO.File]::ReadAllBytes($f.FullName)
    $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
    $c      = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)

    $count = ([regex]::Matches($c, $pattern)).Count
    if ($count -eq 0) { continue }

    $new = [regex]::Replace($c, $pattern, $replace)
    if ($new -eq $c) { continue }

    if (-not $DryRun) {
        if ($hasBom) { $enc = New-Object System.Text.UTF8Encoding $true } else { $enc = $utf8NoBom }
        [System.IO.File]::WriteAllText($f.FullName, $new, $enc)
    }
    $filesTouched++
    $totalReplaces += $count
}

$mode = if ($DryRun) { '[dry-run]' } else { '[written]' }
Write-Output "$mode version=$Version"
Write-Output "Files touched:      $filesTouched"
Write-Output "Total replacements: $totalReplaces"
