$root = Split-Path -Parent $PSScriptRoot
$version = '202606030'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Get-OgImageForPath($relativePath) {
  $p = $relativePath.Replace('\', '/').ToLowerInvariant()

  if ($p -like 'explore/bhopal-disaster*' -or
      $p -like 'explore/what-is-isomerism*' -or
      $p -like 'explore/what-is-the-periodic-table*') {
    return $null
  }

  if ($p -match '^index(\.pt)?\.html$') { return 'og-home.png' }
  if ($p -match '^(about|contact|privacy|terms|config)(\.pt)?\.html$') { return 'og-site.png' }
  if ($p -match '^calculators(\.pt)?\.html$') { return 'og-calculators.png' }
  if ($p -match '^explore(\.pt)?\.html$') { return 'og-explore.png' }
  if ($p -like 'explore/viewer/*') { return 'og-molecules.png' }

  if ($p -match '^periodic-table(\.pt)?\.html$') { return 'og-periodic-table-app.png' }
  if ($p -like 'periodic-table/heatmap*' -or
      $p -like 'periodic-table/trends*' -or
      $p -like 'periodic-table/compare*' -or
      $p -like 'periodic-table/isotopes*') {
    return 'og-periodic-table-app.png'
  }
  if ($p -like 'periodic-table/*') { return 'og-elements.png' }

  if ($p -like 'viewer/molecules*') { return 'og-molecules.png' }
  if ($p -like 'viewer/atomic-models*') { return 'og-atomic-models.png' }
  if ($p -like 'viewer/allotropes*') { return 'og-allotropes.png' }
  if ($p -like 'viewer/isomerism*') { return 'og-isomerism-viewer.png' }
  if ($p -match '^isomerism(\.pt)?\.html$' -or $p -like 'isomerism/*') { return 'og-isomerism-viewer.png' }

  return 'og-site.png'
}

function EnsureMeta($text, $imageFile) {
  $imageUrl = "https://atomurus.com/assets/$imageFile`?v=$version"
  $nl = if ($text -match "`r`n") { "`r`n" } else { "`n" }
  $og = "<meta property=`"og:image`" content=`"$imageUrl`">"
  $ow = '<meta property="og:image:width" content="1200">'
  $oh = '<meta property="og:image:height" content="630">'
  $tc = '<meta name="twitter:card" content="summary_large_image">'
  $ti = "<meta name=`"twitter:image`" content=`"$imageUrl`">"

  if ($text -match '<meta\s+property="og:image"\s+content="[^"]*"\s*/?>') {
    $text = [regex]::Replace($text, '<meta\s+property="og:image"\s+content="[^"]*"\s*/?>', $og)
  } else {
    $block = $og + $nl + $ow + $nl + $oh + $nl + $tc + $nl + $ti + $nl
    if ($text -match '<meta\s+name="description"[^>]*>') {
      $text = [regex]::Replace($text, '(<meta\s+name="description"[^>]*>\s*)', '$1' + $block, 1)
    } elseif ($text -match '<title[^>]*>.*?</title>') {
      $text = [regex]::Replace($text, '(<title[^>]*>.*?</title>\s*)', '$1' + $block, 1)
    } else {
      $text = $block + $text
    }
  }

  if ($text -match '<meta\s+property="og:image:width"\s+content="[^"]*"\s*/?>') {
    $text = [regex]::Replace($text, '<meta\s+property="og:image:width"\s+content="[^"]*"\s*/?>', $ow)
  } else {
    $text = [regex]::Replace($text, '(<meta\s+property="og:image"\s+content="[^"]*">\s*)', '$1' + $ow + $nl, 1)
  }

  if ($text -match '<meta\s+property="og:image:height"\s+content="[^"]*"\s*/?>') {
    $text = [regex]::Replace($text, '<meta\s+property="og:image:height"\s+content="[^"]*"\s*/?>', $oh)
  } else {
    $text = [regex]::Replace($text, '(<meta\s+property="og:image:width"\s+content="1200">\s*)', '$1' + $oh + $nl, 1)
  }

  if ($text -match '<meta\s+name="twitter:card"\s+content="[^"]*"\s*/?>') {
    $text = [regex]::Replace($text, '<meta\s+name="twitter:card"\s+content="[^"]*"\s*/?>', $tc)
  } else {
    $text = [regex]::Replace($text, '(<meta\s+property="og:image:height"\s+content="630">\s*)', '$1' + $tc + $nl, 1)
  }

  if ($text -match '<meta\s+name="twitter:image"\s+content="[^"]*"\s*/?>') {
    $text = [regex]::Replace($text, '<meta\s+name="twitter:image"\s+content="[^"]*"\s*/?>', $ti)
  } else {
    $text = [regex]::Replace($text, '(<meta\s+name="twitter:card"\s+content="summary_large_image">\s*)', '$1' + $ti + $nl, 1)
  }

  return $text
}

function ReplaceGenericStructuredImage($text, $imageFile) {
  $schemaImage = "https://atomurus.com/assets/$imageFile"
  return [regex]::Replace($text, 'https://atomurus\.com/assets/og-cover\.png(?:\?v=\d+)?', $schemaImage)
}

$updated = 0
$skipped = 0
Get-ChildItem -Path $root -Recurse -Filter *.html | ForEach-Object {
  $file = $_
  $relative = $file.FullName.Substring($root.Length + 1)
  $image = Get-OgImageForPath $relative
  if (-not $image) {
    $script:skipped++
    return
  }

  $old = [System.IO.File]::ReadAllText($file.FullName, $utf8)
  $new = EnsureMeta $old $image
  $new = ReplaceGenericStructuredImage $new $image
  if ($new -ne $old) {
    [System.IO.File]::WriteAllText($file.FullName, $new, $utf8)
    $script:updated++
    Write-Host "updated $relative -> $image"
  }
}

Write-Host "updated files: $updated"
Write-Host "skipped article-specific files: $skipped"
