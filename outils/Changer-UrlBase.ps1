<#
.SYNOPSIS
  Change l'URL d'hébergement du complément dans manifest.xml (passage au compte GitHub MFI).

.DESCRIPTION
  L'URL de base n'apparaît que dans manifest.xml (le code JavaScript n'en dépend pas).
  Le script remplace l'ancienne URL de base et l'ancien domaine (AppDomain) par les nouveaux,
  puis incrémente le dernier chiffre de <Version>.

  Côté Entra, penser à AJOUTER l'URI de redirection brk-multihub://<nouveau domaine>
  à l'inscription « Signature MFI » (voir docs/Passage au compte GitHub MFI.md).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File outils\Changer-UrlBase.ps1 -Nouvelle "https://mfi-corsica.github.io/signature-mfi"
#>
param(
  [Parameter(Mandatory = $true)][string]$Nouvelle
)
$ErrorActionPreference = 'Stop'

$Nouvelle = $Nouvelle.TrimEnd('/')
if ($Nouvelle -notmatch '^https://[^/]+(/.*)?$') { throw "URL invalide (https:// obligatoire) : $Nouvelle" }

$racine   = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $racine 'manifest.xml'
$texte    = [System.IO.File]::ReadAllText($manifest, [System.Text.UTF8Encoding]::new($false))

# Ancienne URL de base = URL de la page d'exécution sans « /src/commands.html »
$m = [regex]::Match($texte, 'id="Runtime\.Url" DefaultValue="(https://[^"]+)/src/commands\.html"')
if (-not $m.Success) { throw "URL actuelle introuvable dans manifest.xml (Runtime.Url)." }
$ancienne = $m.Groups[1].Value
if ($ancienne -eq $Nouvelle) { Write-Host "Aucun changement : l'URL est déjà $Nouvelle"; return }

$ancienDomaine  = ([uri]$ancienne).GetLeftPart([System.UriPartial]::Authority)
$nouveauDomaine = ([uri]$Nouvelle).GetLeftPart([System.UriPartial]::Authority)

$texte = $texte.Replace($ancienne, $Nouvelle)
$texte = $texte.Replace("<AppDomain>$ancienDomaine</AppDomain>", "<AppDomain>$nouveauDomaine</AppDomain>")

# Version : a.b.c.d -> a.b.c.(d+1)
$texte = [regex]::Replace($texte, '<Version>(\d+)\.(\d+)\.(\d+)\.(\d+)</Version>', {
  param($v) "<Version>$($v.Groups[1]).$($v.Groups[2]).$($v.Groups[3]).$([int]$v.Groups[4].Value + 1)</Version>"
})

[System.IO.File]::WriteAllText($manifest, $texte, [System.Text.UTF8Encoding]::new($false))
Write-Host "Ancienne URL : $ancienne"
Write-Host "Nouvelle URL : $Nouvelle"
Write-Host "Domaine      : $ancienDomaine -> $nouveauDomaine"
Write-Host ""
Write-Host "À faire ensuite :"
Write-Host "  1. npx office-addin-manifest validate manifest.xml"
Write-Host "  2. Entra : ajouter l'URI de redirection SPA brk-multihub://$(([uri]$Nouvelle).Host)"
Write-Host "  3. Mettre à jour le complément dans Applications intégrées avec le nouveau manifeste"
