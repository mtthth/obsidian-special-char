<#
.SYNOPSIS
    Build le plugin et le copie dans le dossier plugins du vault Obsidian.

.PARAMETER VaultPluginPath
    Chemin vers le dossier du plugin dans le vault. Par défaut, le vault
    "journal" synchronisé via Google Drive. Le dossier doit porter l'id du
    manifeste (insert-special-characters), comme lors d'une installation
    depuis les plugins de la communauté.

.PARAMETER CheckOnly
    Vérifie seulement la destination (nom du dossier, copie déjà installée
    sous un autre nom), sans construire ni copier.
#>
param(
	[string]$VaultPluginPath = "G:\Mon Drive\txt\journal\.obsidian\plugins\insert-special-characters",
	[switch]$CheckOnly
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
	$pluginId = (Get-Content -LiteralPath manifest.json -Raw -Encoding UTF8 | ConvertFrom-Json).id
	$pluginsDir = Split-Path $VaultPluginPath -Parent
	if ((Split-Path $VaultPluginPath -Leaf) -ne $pluginId) {
		throw "Le dossier de destination doit s'appeler $pluginId : $VaultPluginPath"
	}
	# -LiteralPath partout : sans lui, des crochets dans le chemin du vault
	# (« Mon Drive [perso] ») seraient lus comme un motif, et la recherche d'une
	# copie existante serait sautée sans un mot.
	if (Test-Path -LiteralPath $pluginsDir) {
		foreach ($dir in Get-ChildItem -LiteralPath $pluginsDir -Directory) {
			$otherManifest = Join-Path $dir.FullName "manifest.json"
			if ($dir.Name -eq $pluginId -or -not (Test-Path -LiteralPath $otherManifest)) {
				continue
			}
			# Le manifeste illisible d'un autre plugin ne doit pas bloquer le
			# déploiement : Obsidian ne le chargerait pas non plus.
			try {
				$otherId = (Get-Content -LiteralPath $otherManifest -Raw -Encoding UTF8 | ConvertFrom-Json).id
			}
			catch {
				Write-Warning "Manifeste illisible, ignoré : $otherManifest"
				continue
			}
			if ($otherId -eq $pluginId) {
				throw "Le plugin est déjà installé dans $($dir.FullName). Obsidian fermé, renommez ce dossier en $pluginId (son data.json garde vos réglages), puis relancez."
			}
		}
	}

	if ($CheckOnly) {
		Write-Host "Destination valide : $VaultPluginPath"
		return
	}

	npm run build

	# $ErrorActionPreference ne couvre pas les commandes natives : sans ce test,
	# un build cassé laisserait déployer le main.js de la fois précédente, en
	# annonçant un succès.
	if ($LASTEXITCODE -ne 0) {
		throw "npm run build a échoué (code $LASTEXITCODE) : rien n'a été déployé."
	}

	# CreateDirectory prend le chemin tel quel, crochets compris, et ne fait
	# rien si le dossier existe déjà.
	[System.IO.Directory]::CreateDirectory($VaultPluginPath) | Out-Null

	Copy-Item main.js, manifest.json, styles.css -Destination $VaultPluginPath -Force
}
finally {
	Pop-Location
}

Write-Host "Plugin déployé dans $VaultPluginPath"
Write-Host "Recharge Obsidian (palette de commandes -> Reload app without saving) pour voir les changements."
