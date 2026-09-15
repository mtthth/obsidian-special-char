<#
.SYNOPSIS
    Build le plugin et le copie dans le dossier plugins du vault Obsidian.

.PARAMETER VaultPluginPath
    Chemin vers le dossier du plugin dans le vault. Par défaut, le vault
    "journal" synchronisé via Google Drive.
#>
param(
	[string]$VaultPluginPath = "G:\Mon Drive\txt\journal\.obsidian\plugins\obsidian-special-char"
)

$ErrorActionPreference = "Stop"

npm run build

if (-not (Test-Path $VaultPluginPath)) {
	New-Item -ItemType Directory -Path $VaultPluginPath -Force | Out-Null
}

Copy-Item main.js, manifest.json, styles.css -Destination $VaultPluginPath -Force

Write-Host "Plugin déployé dans $VaultPluginPath"
Write-Host "Recharge Obsidian (palette de commandes -> Reload app without saving) pour voir les changements."
