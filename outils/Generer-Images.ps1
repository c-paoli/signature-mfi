<#
.SYNOPSIS
  Régénère les icônes du complément et le fichier src/logo.js à partir de assets/logo-mfi.png.

.DESCRIPTION
  À relancer uniquement si le logo change. Produit :
    - assets/icon-16.png, icon-32.png, icon-64.png, icon-80.png, icon-128.png
    - src/logo.js (logo encodé en base64, inséré dans le mail en pièce jointe incorporée)

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File outils\Generer-Images.ps1
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$racine = Split-Path -Parent $PSScriptRoot
$logo   = Join-Path $racine 'assets\logo-mfi.png'
if (-not (Test-Path $logo)) { throw "Logo introuvable : $logo" }

$source = [System.Drawing.Bitmap]::new($logo)
try {
  # Zones du logo d'origine (281 x 113, fond blanc) :
  #  - les barres verticales seules (pour les petites icônes)
  #  - la marque complète « barres + mfi », sans la ligne « Sécurité • Infrastructure • IT »
  $zoneBarres = [System.Drawing.Rectangle]::new(0, 0, 92, 90)
  $zoneMarque = [System.Drawing.Rectangle]::new(4, 0, 276, 90)

  foreach ($taille in 16, 32, 64, 80, 128) {
    $zone = if ($taille -le 32) { $zoneBarres } else { $zoneMarque }
    $icone = [System.Drawing.Bitmap]::new($taille, $taille)
    $g = [System.Drawing.Graphics]::FromImage($icone)
    try {
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.Clear([System.Drawing.Color]::White)
      $marge   = [Math]::Max(1, [int]($taille * 0.06))
      $echelle = [Math]::Min(($taille - 2 * $marge) / $zone.Width, ($taille - 2 * $marge) / $zone.Height)
      $l = [int]($zone.Width * $echelle); $h = [int]($zone.Height * $echelle)
      $dest = [System.Drawing.Rectangle]::new([int](($taille - $l) / 2), [int](($taille - $h) / 2), $l, $h)
      $g.DrawImage($source, $dest, $zone, [System.Drawing.GraphicsUnit]::Pixel)
    } finally { $g.Dispose() }
    $sortie = Join-Path $racine "assets\icon-$taille.png"
    $icone.Save($sortie, [System.Drawing.Imaging.ImageFormat]::Png)
    $icone.Dispose()
    Write-Host "Icône générée : $sortie"
  }
} finally { $source.Dispose() }

# Logo en base64 pour l'insertion en pièce jointe incorporée (cid:)
$base64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($logo))
$js = @"
/*
 * FICHIER GÉNÉRÉ par outils/Generer-Images.ps1 — ne pas modifier à la main.
 * Logo MFI (assets/logo-mfi.png) encodé en base64, inséré dans chaque mail
 * comme pièce jointe incorporée et référencé par cid: dans la signature.
 */
var LOGO_MFI_BASE64 = "$base64";
"@
$jsChemin = Join-Path $racine 'src\logo.js'
[System.IO.File]::WriteAllText($jsChemin, $js + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Host "Logo encodé : $jsChemin ($($base64.Length) caractères)"
