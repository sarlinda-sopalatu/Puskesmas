#requires -Version 5.1
# Membuat seluruh aset merek Puskesmas (ikon, adaptive icon, splash, favicon).
# Jalankan dari akar proyek: powershell -ExecutionPolicy Bypass -File .\scripts\generate-brand-assets.ps1

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$images = Join-Path $root 'assets\images'
New-Item -ItemType Directory -Force -Path $images | Out-Null

$cream = [System.Drawing.ColorTranslator]::FromHtml('#F6F4EF')
$teal = [System.Drawing.ColorTranslator]::FromHtml('#0F766E')
$coral = [System.Drawing.ColorTranslator]::FromHtml('#F97316')
$white = [System.Drawing.Color]::White

function New-RoundedPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Add-RoundedRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )
  $path = New-RoundedPath -X $X -Y $Y -Width $Width -Height $Height -Radius $Radius
  $Graphics.FillPath($Brush, $path)
  $path.Dispose()
}

function New-Graphics {
  param(
    [int]$Size,
    [System.Drawing.Color]$Background
  )
  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear($Background)
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Canvas {
  param(
    [hashtable]$Canvas,
    [string]$Path
  )
  $Canvas.Graphics.Dispose()
  $Canvas.Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $Canvas.Bitmap.Dispose()
}

function Draw-BrandMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$SquareSize,
    [bool]$WithShadow = $true,
    [float]$CanvasSize = 1024
  )
  $x = ($CanvasSize - $SquareSize) / 2
  $y = ($CanvasSize - $SquareSize) / 2
  $radius = $SquareSize * 0.3

  if ($WithShadow) {
    $shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(26, 11, 31, 42))
    Add-RoundedRect -Graphics $Graphics -Brush $shadow -X $x -Y ($y + 18) -Width $SquareSize -Height $SquareSize -Radius $radius
    $shadow.Dispose()
  }

  $tealBrush = New-Object System.Drawing.SolidBrush $teal
  Add-RoundedRect -Graphics $Graphics -Brush $tealBrush -X $x -Y $y -Width $SquareSize -Height $SquareSize -Radius $radius
  $tealBrush.Dispose()

  $cross = $SquareSize * 0.5
  $thickness = $SquareSize * 0.145
  $crossRadius = $thickness * 0.42
  $centerX = $CanvasSize / 2
  $centerY = $CanvasSize / 2
  $whiteBrush = New-Object System.Drawing.SolidBrush $white
  Add-RoundedRect -Graphics $Graphics -Brush $whiteBrush -X ($centerX - $cross / 2) -Y ($centerY - $thickness / 2) -Width $cross -Height $thickness -Radius $crossRadius
  Add-RoundedRect -Graphics $Graphics -Brush $whiteBrush -X ($centerX - $thickness / 2) -Y ($centerY - $cross / 2) -Width $thickness -Height $cross -Radius $crossRadius
  $whiteBrush.Dispose()

  $dotRadius = $SquareSize * 0.075
  $dotX = $x + $SquareSize * 0.87
  $dotY = $y + $SquareSize * 0.13
  $ringBrush = New-Object System.Drawing.SolidBrush $teal
  $Graphics.FillEllipse($ringBrush, $dotX - $dotRadius - 10, $dotY - $dotRadius - 10, ($dotRadius + 10) * 2, ($dotRadius + 10) * 2)
  $ringBrush.Dispose()
  $dotBrush = New-Object System.Drawing.SolidBrush $coral
  $Graphics.FillEllipse($dotBrush, $dotX - $dotRadius, $dotY - $dotRadius, $dotRadius * 2, $dotRadius * 2)
  $dotBrush.Dispose()
}

function Draw-MonochromeMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$CanvasSize = 1024
  )
  $cross = $CanvasSize * 0.48
  $thickness = $CanvasSize * 0.13
  $radius = $thickness * 0.42
  $center = $CanvasSize / 2
  $brush = New-Object System.Drawing.SolidBrush $white
  Add-RoundedRect -Graphics $Graphics -Brush $brush -X ($center - $cross / 2) -Y ($center - $thickness / 2) -Width $cross -Height $thickness -Radius $radius
  Add-RoundedRect -Graphics $Graphics -Brush $brush -X ($center - $thickness / 2) -Y ($center - $cross / 2) -Width $thickness -Height $cross -Radius $radius
  $Graphics.FillEllipse($brush, $CanvasSize * 0.73, $CanvasSize * 0.18, $CanvasSize * 0.12, $CanvasSize * 0.12)
  $brush.Dispose()
}

# 1. Ikon aplikasi utama (iOS + fallback Android).
$canvas = New-Graphics -Size 1024 -Background $cream
Draw-BrandMark -Graphics $canvas.Graphics -SquareSize 740
Save-Canvas -Canvas $canvas -Path (Join-Path $images 'icon.png')

# 2. Splash screen: latar transparan agar mengikuti warna kanvas.
$canvas = New-Graphics -Size 1024 -Background ([System.Drawing.Color]::Transparent)
Draw-BrandMark -Graphics $canvas.Graphics -SquareSize 700 -WithShadow $true
Save-Canvas -Canvas $canvas -Path (Join-Path $images 'splash-icon.png')

# 3. Foreground adaptive icon: zona aman lebih kecil, tanpa bayangan.
$canvas = New-Graphics -Size 1024 -Background ([System.Drawing.Color]::Transparent)
Draw-BrandMark -Graphics $canvas.Graphics -SquareSize 620 -WithShadow $false
Save-Canvas -Canvas $canvas -Path (Join-Path $images 'android-icon-foreground.png')

# 4. Monochrome adaptive icon: siluet plus dan titik aksen.
$canvas = New-Graphics -Size 1024 -Background ([System.Drawing.Color]::Transparent)
Draw-MonochromeMark -Graphics $canvas.Graphics
Save-Canvas -Canvas $canvas -Path (Join-Path $images 'android-icon-monochrome.png')

# 5. Favicon web.
$canvas = New-Graphics -Size 64 -Background $cream
Draw-BrandMark -Graphics $canvas.Graphics -SquareSize 46 -WithShadow $false -CanvasSize 64
Save-Canvas -Canvas $canvas -Path (Join-Path $images 'favicon.png')

Write-Host 'Aset merek berhasil dibuat di' $images
