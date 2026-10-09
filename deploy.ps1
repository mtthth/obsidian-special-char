<#
.SYNOPSIS
    Build le plugin et le copie dans le dossier plugins du vault Obsidian.

.PARAMETER VaultPluginPath
    Chemin vers le dossier du plugin dans le vault. Par défaut, le vault
    "journal" synchronisé via Google Drive. Le dossier doit porter l'id du
    manifeste (insert-special-characters), comme lors d'une installation
    depuis les plugins de la communauté.
#>
param(
	[string]$VaultPluginPath = "G:\Mon Drive\txt\journal\.obsidian\plugins\insert-special-characters"
)

$ErrorActionPreference = "Stop"

# Une destination relative s'entend depuis là où l'utilisateur a lancé le script,
# pas depuis le dépôt : elle doit être résolue avant de changer de répertoire.
# GetFullPath à deux arguments n'existe pas sous Windows PowerShell 5.1 : le
# chemin est d'abord rendu absolu par Join-Path, GetFullPath ne fait plus
# que résoudre les « .. ».
if (-not [System.IO.Path]::IsPathRooted($VaultPluginPath)) {
	$VaultPluginPath = Join-Path (Get-Location).Path $VaultPluginPath
}
$VaultPluginPath = [System.IO.Path]::GetFullPath($VaultPluginPath)

# Le script doit pouvoir être appelé par son chemin absolu depuis n'importe où :
# sans cela, npm construirait le projet du répertoire courant, et Copy-Item y
# chercherait les fichiers à déployer.
Push-Location $PSScriptRoot
try {
	# Obsidian charge un plugin depuis n'importe quel dossier, mais l'installation
	# depuis la communauté utilise l'id du manifeste : un autre nom de dossier
	# finirait en deux copies du même plugin, chacune avec son data.json.
	$pluginId = (Get-Content manifest.json -Raw -Encoding UTF8 | ConvertFrom-Json).id
	$pluginsDir = Split-Path $VaultPluginPath -Parent
	if ((Split-Path $VaultPluginPath -Leaf) -ne $pluginId) {
		throw "Le dossier de destination doit s'appeler $pluginId : $VaultPluginPath"
	}
	if (Test-Path $pluginsDir) {
		foreach ($dir in Get-ChildItem $pluginsDir -Directory) {
			$otherManifest = Join-Path $dir.FullName "manifest.json"
			if ($dir.Name -ne $pluginId -and (Test-Path $otherManifest) -and
				(Get-Content $otherManifest -Raw -Encoding UTF8 | ConvertFrom-Json).id -eq $pluginId) {
				throw "Le plugin est déjà installé dans $($dir.FullName). Obsidian fermé, renommez ce dossier en $pluginId (son data.json garde vos réglages), puis relancez."
			}
		}
	}

	npm run build

	# $ErrorActionPreference ne couvre pas les commandes natives : sans ce test,
	# un build cassé laisserait déployer le main.js de la fois précédente, en
	# annonçant un succès.
	if ($LASTEXITCODE -ne 0) {
		throw "npm run build a échoué (code $LASTEXITCODE) : rien n'a été déployé."
	}

	if (-not (Test-Path $VaultPluginPath)) {
		New-Item -ItemType Directory -Path $VaultPluginPath -Force | Out-Null
	}

	Copy-Item main.js, manifest.json, styles.css -Destination $VaultPluginPath -Force
}
finally {
	Pop-Location
}

Write-Host "Plugin déployé dans $VaultPluginPath"
Write-Host "Recharge Obsidian (palette de commandes -> Reload app without saving) pour voir les changements."
