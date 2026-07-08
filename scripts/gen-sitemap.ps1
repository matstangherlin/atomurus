# ───────────────────────────────────────────────────────────────────
# Atomurus — sitemap.xml generator (run after adding/removing pages)
#   powershell -File scripts/gen-sitemap.ps1
# ───────────────────────────────────────────────────────────────────
# URL scheme (mirrors the on-page canonicals + netlify.toml rewrites):
#   EN-default pages   →  <url> for clean URL  +  <url> for ?lang=pt-BR
#   Element pages      →  <url> for clean URL  +  <url> for ?lang=en
#                         (sources are PT-default; .en.html is the EN variant)
#   Isomerism hub      →  single <url> at ?lang=pt-BR (its canonical today)
#   /isomerism/** and the isomerism .pt.html stubs are EXCLUDED: the copies
#   canonicalize to /viewer/isomerism/** and the stubs are never served.
# Every <url> carries the same hreflang trio as the page <head>:
#   en → ?lang=en · pt-BR → ?lang=pt-BR · x-default → clean URL
# ───────────────────────────────────────────────────────────────────
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$base = 'https://atomurus.com'

# EN-default pages: relative file path (without .html) = public URL path.
# '' = homepage.
$enDefaultPages = @(
  '',
  'periodic-table', 'periodic-table/heatmap', 'periodic-table/trends',
  'periodic-table/compare', 'periodic-table/isotopes',
  'calculators', 'about', 'contact', 'privacy', 'terms', 'config',
  'explore', 'explore/bhopal-disaster', 'explore/what-is-isomerism',
  'explore/what-is-the-periodic-table', 'explore/viewer/methyl-isocyanate',
  'viewer/molecules', 'viewer/allotropes', 'viewer/atomic-models',
  'viewer/atomic-models/bohr', 'viewer/atomic-models/dalton',
  'viewer/atomic-models/quantum', 'viewer/atomic-models/rutherford',
  'viewer/atomic-models/thomson',
  'viewer/isomerism/constitutional/chain', 'viewer/isomerism/constitutional/function',
  'viewer/isomerism/constitutional/metamerism', 'viewer/isomerism/constitutional/position',
  'viewer/isomerism/constitutional/tautomerism',
  'viewer/isomerism/spatial/geometric', 'viewer/isomerism/spatial/optical'
)

# Element pages: every periodic-table/*.html except subviews and variants.
$subviews = @('heatmap','trends','compare','isotopes')
$elementPages = Get-ChildItem (Join-Path $root 'periodic-table') -Filter *.html |
  Where-Object { $_.Name -notmatch '\.(en|pt)\.html$' -and $subviews -notcontains $_.BaseName } |
  ForEach-Object { 'periodic-table/' + $_.BaseName } | Sort-Object

function Get-Lastmod([string]$relPath){
  # Prefer the freshest of source + language variants.
  $candidates = @()
  $fp = if ($relPath -eq '') { 'index' } else { $relPath }
  foreach ($suffix in '.html', '.pt.html', '.en.html') {
    $p = Join-Path $root (($fp -replace '/', '\') + $suffix)
    if (Test-Path $p) { $candidates += (Get-Item $p).LastWriteTime }
  }
  if (-not $candidates) { return (Get-Date).ToString('yyyy-MM-dd') }
  return ($candidates | Sort-Object -Descending | Select-Object -First 1).ToString('yyyy-MM-dd')
}

function New-UrlEntry([string]$loc, [string]$cleanUrl, [string]$lastmod, [string]$changefreq, [string]$priority){
  $locEsc = $loc -replace '&', '&amp;'
  $sepClean = if ($cleanUrl.EndsWith('/')) { '' } else { '' }
  $q = if ($cleanUrl -match '\?') { '&amp;' } else { '?' }
  @"
  <url>
    <loc>$locEsc</loc>
    <lastmod>$lastmod</lastmod>
    <changefreq>$changefreq</changefreq>
    <priority>$priority</priority>
    <xhtml:link rel="alternate" hreflang="en" href="$cleanUrl${q}lang=en"/>
    <xhtml:link rel="alternate" hreflang="pt-BR" href="$cleanUrl${q}lang=pt-BR"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="$cleanUrl"/>
  </url>
"@
}

$entries = New-Object System.Collections.Generic.List[string]

foreach ($p in $enDefaultPages) {
  $clean = if ($p -eq '') { "$base/" } else { "$base/$p" }
  $lm = Get-Lastmod $p
  $cf = if ($p -eq '') { 'weekly' } else { 'monthly' }
  $pr = if ($p -eq '') { '1.0' }
        elseif ($p -in 'periodic-table','explore','calculators','viewer/atomic-models','viewer/molecules','viewer/allotropes') { '0.8' }
        else { '0.6' }
  $q = if ($clean -match '\?') { '&amp;' } else { '?' }
  $entries.Add((New-UrlEntry $clean            $clean $lm $cf $pr))
  $entries.Add((New-UrlEntry "$clean${q}lang=pt-BR" $clean $lm $cf $pr))
}

# Isomerism hub — single canonical URL (both language variants point here today)
$lmIso = Get-Lastmod 'viewer/isomerism'
$entries.Add((New-UrlEntry "$base/viewer/isomerism?lang=pt-BR" "$base/viewer/isomerism" $lmIso 'monthly' '0.8'))

foreach ($p in $elementPages) {
  $clean = "$base/$p"
  $lm = Get-Lastmod $p
  # NB: ${clean} braces are required — in PowerShell `"$clean?"` would parse
  # the `?` as part of the variable name and interpolate $null.
  $entries.Add((New-UrlEntry $clean               $clean $lm 'monthly' '0.6'))
  $entries.Add((New-UrlEntry "${clean}?lang=en"   $clean $lm 'monthly' '0.6'))
}

$xml = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
$($entries -join "`n")
</urlset>
"@

$out = Join-Path $root 'sitemap.xml'
[IO.File]::WriteAllText($out, $xml, (New-Object System.Text.UTF8Encoding $false))
Write-Output "sitemap.xml written: $($entries.Count) URL entries ($($enDefaultPages.Count) EN-default pages, $($elementPages.Count) elements)"
