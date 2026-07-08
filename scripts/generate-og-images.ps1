Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $root 'assets'
$W = 1200
$H = 630
$Split = 610

function ColorHex($hex) {
  [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function FontObj($family, [float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function BrushHex($hex) {
  New-Object System.Drawing.SolidBrush((ColorHex $hex))
}

function PenHex($hex, [float]$width = 1) {
  New-Object System.Drawing.Pen((ColorHex $hex), $width)
}

function DrawText($g, $text, $font, $brush, [float]$x, [float]$y) {
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Near
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Near
  $g.DrawString($text, $font, $brush, $x, $y, $fmt)
  $fmt.Dispose()
}

function DrawCenteredText($g, $text, $font, $brush, [float]$x, [float]$y, [float]$w, [float]$h) {
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = [System.Drawing.StringAlignment]::Center
  $fmt.LineAlignment = [System.Drawing.StringAlignment]::Center
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $g.DrawString($text, $font, $brush, $rect, $fmt)
  $fmt.Dispose()
}

function DrawWrappedText($g, $text, $font, $brush, [float]$x, [float]$y, [float]$maxWidth, [float]$lineHeight, [int]$maxLines = 3) {
  $words = $text -split '\s+'
  $line = ''
  $lines = @()
  foreach ($word in $words) {
    $candidate = if ($line) { "$line $word" } else { $word }
    if ($g.MeasureString($candidate, $font).Width -le $maxWidth) {
      $line = $candidate
    } else {
      if ($line) { $lines += $line }
      $line = $word
    }
  }
  if ($line) { $lines += $line }
  for ($i = 0; $i -lt [Math]::Min($lines.Count, $maxLines); $i++) {
    DrawText $g $lines[$i] $font $brush $x ($y + $i * $lineHeight)
  }
}

function DrawBase($g, $label, $titleLines, $subtitle, $accent) {
  $left = BrushHex '#10251b'
  $right = BrushHex '#f1eee7'
  $g.FillRectangle($left, 0, 0, $Split, $H)
  $g.FillRectangle($right, $Split, 0, $W - $Split, $H)

  $labelFont = FontObj 'Segoe UI' 24 ([System.Drawing.FontStyle]::Bold)
  $titleFont = FontObj 'Georgia' 66
  $subFont = FontObj 'Segoe UI' 29
  $siteFont = FontObj 'Segoe UI' 24 ([System.Drawing.FontStyle]::Bold)
  $accentBrush = New-Object System.Drawing.SolidBrush($accent)
  $cream = BrushHex '#fffdf5'
  $muted = BrushHex '#d8d0c4'

  DrawText $g $label $labelFont $accentBrush 76 74
  for ($i = 0; $i -lt $titleLines.Count; $i++) {
    DrawText $g $titleLines[$i] $titleFont $cream 76 (150 + $i * 72)
  }
  DrawWrappedText $g $subtitle $subFont $muted 80 340 500 34 3
  DrawText $g 'atomurus.com' $siteFont $cream 76 535

  $left.Dispose(); $right.Dispose(); $labelFont.Dispose(); $titleFont.Dispose()
  $subFont.Dispose(); $siteFont.Dispose(); $accentBrush.Dispose(); $cream.Dispose(); $muted.Dispose()
}

function DrawTile($g, [float]$x, [float]$y, [float]$s, $symbol, $fill) {
  $b = New-Object System.Drawing.SolidBrush($fill)
  $p = PenHex '#f1eee7' 4
  $font = FontObj 'Segoe UI' ([Math]::Max(13, $s * .36)) ([System.Drawing.FontStyle]::Bold)
  $white = BrushHex '#fffdf5'
  $g.FillRectangle($b, $x, $y, $s, $s)
  $g.DrawRectangle($p, $x, $y, $s, $s)
  DrawCenteredText $g $symbol $font $white $x $y $s $s
  $b.Dispose(); $p.Dispose(); $font.Dispose(); $white.Dispose()
}

function DrawPeriodicVisual($g, [float]$ox, [float]$oy, [float]$scale) {
  $symbols = @('H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr')
  $colors = @('#dc5b73','#d79a28','#3793bd','#59a86c','#7b6ad6')
  $s = 44 * $scale
  for ($i = 0; $i -lt $symbols.Count; $i++) {
    $row = [Math]::Floor($i / 8)
    $col = $i % 8
    DrawTile $g ($ox + $col * ($s + 8)) ($oy + $row * ($s + 8)) $s $symbols[$i] (ColorHex $colors[$i % $colors.Count])
  }
}

function DrawAtomVisual($g) {
  $pen = PenHex '#58534c' 5
  $green = BrushHex '#34a872'
  $blue = BrushHex '#3793bd'
  $orange = BrushHex '#d79a28'
  $gray = BrushHex '#545454'
  $cx = 900
  $cy = 315
  $g.DrawEllipse($pen, $cx - 150, $cy - 150, 300, 300)
  $g.DrawEllipse($pen, $cx - 200, $cy - 90, 400, 180)
  $g.DrawEllipse($pen, $cx - 200, $cy - 160, 400, 320)
  $g.FillEllipse($green, $cx - 32, $cy - 32, 64, 64)
  $g.FillEllipse($orange, $cx + 132, $cy - 140, 28, 28)
  $g.FillEllipse($blue, $cx - 190, $cy - 12, 28, 28)
  $g.FillEllipse($gray, $cx + 168, $cy + 86, 24, 24)
  $pen.Dispose(); $green.Dispose(); $blue.Dispose(); $orange.Dispose(); $gray.Dispose()
}

function DrawBond($g, [float]$x1, [float]$y1, [float]$x2, [float]$y2) {
  $pen = PenHex '#55504a' 8
  $g.DrawLine($pen, $x1, $y1, $x2, $y2)
  $pen.Dispose()
}

function DrawAtom($g, [float]$x, [float]$y, [float]$r, $symbol, $fill) {
  $b = New-Object System.Drawing.SolidBrush($fill)
  $p = PenHex '#403d38' 2
  $fontSize = if ($symbol.Length -gt 1) { 18 } else { 22 }
  $font = FontObj 'Segoe UI' $fontSize ([System.Drawing.FontStyle]::Bold)
  $white = BrushHex '#fffdf5'
  $g.FillEllipse($b, $x - $r, $y - $r, $r * 2, $r * 2)
  $g.DrawEllipse($p, $x - $r, $y - $r, $r * 2, $r * 2)
  DrawCenteredText $g $symbol $font $white ($x - $r) ($y - $r) ($r * 2) ($r * 2)
  $b.Dispose(); $p.Dispose(); $font.Dispose(); $white.Dispose()
}

function DrawMoleculeVisual($g) {
  DrawBond $g 760 315 875 315
  DrawBond $g 875 315 1000 315
  DrawBond $g 760 315 705 250
  DrawBond $g 760 315 705 390
  DrawBond $g 760 315 670 315
  DrawAtom $g 760 315 36 'C' (ColorHex '#545454')
  DrawAtom $g 875 315 34 'N' (ColorHex '#3793bd')
  DrawAtom $g 1000 315 34 'C' (ColorHex '#545454')
  DrawAtom $g 1100 315 32 'O' (ColorHex '#dc5b73')
  DrawAtom $g 705 250 21 'H' (ColorHex '#cfcfcf')
  DrawAtom $g 705 390 21 'H' (ColorHex '#cfcfcf')
  DrawAtom $g 670 315 21 'H' (ColorHex '#cfcfcf')
}

function DrawIsomerChain($g, [float]$x, [float]$y, [bool]$branch) {
  $gray = ColorHex '#545454'
  if ($branch) {
    DrawBond $g $x ($y + 10) ($x + 75) $y
    DrawBond $g ($x + 70) $y ($x + 150) ($y + 70)
    DrawBond $g ($x + 60) $y ($x + 60) ($y - 75)
    DrawAtom $g ($x + 60) $y 30 'C' $gray
    DrawAtom $g $x ($y + 10) 30 'C' $gray

    DrawAtom $g ($x + 120) ($y + 60) 30 'C' $gray
    DrawAtom $g ($x + 60) ($y - 70) 30 'C' $gray
  } else {
    DrawBond $g $x $y ($x + 90) $y
    DrawBond $g ($x + 90) $y ($x + 180) $y
    DrawBond $g ($x + 180) $y ($x + 270) $y
    DrawAtom $g $x $y 30 'C' $gray
    DrawAtom $g ($x + 90) $y 30 'C' $gray
    DrawAtom $g ($x + 180) $y 30 'C' $gray
    DrawAtom $g ($x + 270) $y 30 'C' $gray
  }
}

function DrawIsomerismVisual($g) {
  $font = FontObj 'Segoe UI' 30 ([System.Drawing.FontStyle]::Bold)
  $green = BrushHex '#34a872'
  DrawIsomerChain $g 745 180 $false
  DrawText $g 'C4H10' $font $green 860 250
  DrawIsomerChain $g 790 405 $true
  DrawText $g 'C4H10' $font $green 860 500
  $font.Dispose(); $green.Dispose()
}

function DrawCalculatorsVisual($g) {
  $card = BrushHex '#fffdf5'
  $line = PenHex '#d8d0c4' 2
  $ink = BrushHex '#171512'
  $green = BrushHex '#34a872'
  $mono = FontObj 'Consolas' 26 ([System.Drawing.FontStyle]::Bold)
  $sans = FontObj 'Segoe UI' 18 ([System.Drawing.FontStyle]::Bold)
  $items = @(
    @{T='Molar mass'; F='H2SO4 = 98.08 g/mol'},
    @{T='pH'; F='[H+] -> 3.20'},
    @{T='Stoichiometry'; F='2H2 + O2 -> 2H2O'}
  )
  for ($i = 0; $i -lt $items.Count; $i++) {
    $y = 120 + $i * 130
    $g.FillRectangle($card, 700, $y, 360, 92)
    $g.DrawRectangle($line, 700, $y, 360, 92)
    DrawText $g $items[$i].T $sans $green 724 ($y + 12)
    DrawText $g $items[$i].F $mono $ink 724 ($y + 44)
  }
  $card.Dispose(); $line.Dispose(); $ink.Dispose(); $green.Dispose(); $mono.Dispose(); $sans.Dispose()
}

function DrawExploreVisual($g) {
  $card = BrushHex '#fffdf5'
  $line = PenHex '#d8d0c4' 2
  $ink = BrushHex '#171512'
  $green = BrushHex '#34a872'
  $title = FontObj 'Georgia' 30
  $small = FontObj 'Segoe UI' 18 ([System.Drawing.FontStyle]::Bold)
  $cards = @('Bhopal', 'Periodic Table', 'Isomerism')
  for ($i = 0; $i -lt 3; $i++) {
    $y = 120 + $i * 140
    $g.FillRectangle($card, 705, $y, 330, 100)
    $g.DrawRectangle($line, 705, $y, 330, 100)
    DrawText $g ('ARTICLE 0' + ($i + 1)) $small $green 728 ($y + 16)
    DrawText $g $cards[$i] $title $ink 728 ($y + 45)
  }
  $card.Dispose(); $line.Dispose(); $ink.Dispose(); $green.Dispose(); $title.Dispose(); $small.Dispose()
}

function DrawAllotropesVisual($g) {
  $pen = PenHex '#58534c' 7
  $gray = ColorHex '#545454'
  for ($row = 0; $row -lt 4; $row++) {
    for ($col = 0; $col -lt 5; $col++) {
      $x = 710 + $col * 70 + (($row % 2) * 35)
      $y = 130 + $row * 58
      if ($col -lt 4) { $g.DrawLine($pen, $x, $y, $x + 70, $y) }
      if ($row -lt 3) { $g.DrawLine($pen, $x, $y, $x + 35, $y + 58) }
      DrawAtom $g $x $y 18 'C' $gray
    }
  }
  DrawAtom $g 900 430 56 'C60' (ColorHex '#34a872')
  $pen.Dispose()
}

function DrawHomeVisual($g) {
  DrawPeriodicVisual $g 700 100 0.82
  $pen = PenHex '#34a872' 6
  $g.DrawEllipse($pen, 760, 355, 255, 80)
  $g.DrawEllipse($pen, 740, 315, 295, 160)
  $pen.Dispose()
}

function DrawSiteVisual($g) {
  $card = BrushHex '#fffdf5'
  $line = PenHex '#d8d0c4' 2
  $green = BrushHex '#34a872'
  $ink = BrushHex '#171512'
  $muted = BrushHex '#5a5550'
  $font = FontObj 'Segoe UI' 28 ([System.Drawing.FontStyle]::Bold)
  $small = FontObj 'Segoe UI' 19
  $items = @(
    @{T='Reference'; S='About the chemistry workspace'},
    @{T='Contact'; S='Questions, feedback and support'},
    @{T='Policies'; S='Privacy, terms and configuration'}
  )
  for ($i = 0; $i -lt $items.Count; $i++) {
    $y = 120 + $i * 125
    $g.FillRectangle($card, 710, $y, 370, 92)
    $g.DrawRectangle($line, 710, $y, 370, 92)
    $g.FillRectangle($green, 730, $y + 25, 42, 42)
    DrawText $g $items[$i].T $font $ink 794 ($y + 17)
    DrawText $g $items[$i].S $small $muted 794 ($y + 54)
  }
  $card.Dispose(); $line.Dispose(); $green.Dispose(); $ink.Dispose(); $muted.Dispose(); $font.Dispose(); $small.Dispose()
}

function DrawElementVisual($g) {
  DrawTile $g 760 125 190 'C' (ColorHex '#545454')
  $font = FontObj 'Georgia' 54
  $small = FontObj 'Segoe UI' 26 ([System.Drawing.FontStyle]::Bold)
  $ink = BrushHex '#171512'
  $green = BrushHex '#34a872'
  DrawText $g 'Carbon' $font $ink 755 330
  DrawText $g 'Z = 6' $small $green 760 400
  DrawPeriodicVisual $g 690 470 0.42
  $font.Dispose(); $small.Dispose(); $ink.Dispose(); $green.Dispose()
}

function DrawOg($file, $label, $titleLines, $subtitle, $accentHex, $visual) {
  $bmp = New-Object System.Drawing.Bitmap($W, $H)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  DrawBase $g $label $titleLines $subtitle (ColorHex $accentHex)
  switch ($visual) {
    'home'        { DrawHomeVisual $g }
    'site'        { DrawSiteVisual $g }
    'explore'     { DrawExploreVisual $g }
    'periodic'    { DrawPeriodicVisual $g 702 92 1.0 }
    'elements'    { DrawElementVisual $g }
    'atomic'      { DrawAtomVisual $g }
    'molecules'   { DrawMoleculeVisual $g }
    'allotropes'  { DrawAllotropesVisual $g }
    'isomerism'   { DrawIsomerismVisual $g }
    'calculators' { DrawCalculatorsVisual $g }
  }

  $out = Join-Path $assetsDir $file
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
  Write-Host "wrote $file"
}

$images = @(
  @{File='og-home.png'; Label='ATOMURUS / LAB'; Title=@('Atomurus'); Subtitle='A chemistry workspace for elements, molecules, models, trends and study tools.'; Accent='#34a872'; Visual='home'},
  @{File='og-site.png'; Label='ATOMURUS / SITE'; Title=@('Chemistry','Reference'); Subtitle='Pages, policies and project information for the Atomurus chemistry lab.'; Accent='#34a872'; Visual='site'},
  @{File='og-explore.png'; Label='ATOMURUS / EXPLORE'; Title=@('Explore','Chemistry'); Subtitle='Articles, history and concepts for deeper chemistry study.'; Accent='#34a872'; Visual='explore'},
  @{File='og-calculators.png'; Label='ATOMURUS / TOOLS'; Title=@('Chemistry','Calculators'); Subtitle='Molar mass, stoichiometry, pH and quick chemistry calculations.'; Accent='#d79a28'; Visual='calculators'},
  @{File='og-periodic-table-app.png'; Label='ATOMURUS / LABORATORY'; Title=@('Interactive','Periodic Table'); Subtitle='Elements, trends, isotopes and comparison tools in one workspace.'; Accent='#d79a28'; Visual='periodic'},
  @{File='og-elements.png'; Label='ATOMURUS / ELEMENTS'; Title=@('Chemical','Elements'); Subtitle='Atomic data, properties, uses, isotopes and periodic context.'; Accent='#34a872'; Visual='elements'},
  @{File='og-atomic-models.png'; Label='ATOMURUS / VIEWER'; Title=@('Atomic','Models'); Subtitle='Dalton, Thomson, Rutherford, Bohr and quantum views in 3D.'; Accent='#3793bd'; Visual='atomic'},
  @{File='og-molecules.png'; Label='ATOMURUS / VIEWER'; Title=@('Molecules','3D Viewer'); Subtitle='Water, methane, ammonia, methyl isocyanate and more interactive molecules.'; Accent='#34a872'; Visual='molecules'},
  @{File='og-allotropes.png'; Label='ATOMURUS / VIEWER'; Title=@('Allotropes','in 3D'); Subtitle='Diamond, graphite, graphene, fullerene, ozone, sulfur and phosphorus.'; Accent='#7b6ad6'; Visual='allotropes'},
  @{File='og-isomerism-viewer.png'; Label='ATOMURUS / VIEWER'; Title=@('Isomerism','Viewer'); Subtitle='Same formula, different structure: constitutional and spatial isomerism.'; Accent='#34a872'; Visual='isomerism'}
)

foreach ($img in $images) {
  DrawOg $img.File $img.Label $img.Title $img.Subtitle $img.Accent $img.Visual
}
