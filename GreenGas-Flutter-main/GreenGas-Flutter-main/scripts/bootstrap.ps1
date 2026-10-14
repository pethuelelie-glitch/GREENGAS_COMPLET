# Prépare le projet après un clone sous Windows : génère android/ios, permissions, dépendances, format.
# Équivalent Windows de scripts/bootstrap.sh.
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')

if ((Test-Path 'android') -and (Test-Path 'ios')) {
    Write-Host 'Dossiers android/ et ios/ déjà présents.'
} else {
    $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("greengas_" + [System.Guid]::NewGuid())
    flutter create --org ci.greengas --project-name greengas --platforms=android,ios "$tmp\greengas" | Out-Null
    Copy-Item -Recurse -Force "$tmp\greengas\android" ./android
    Copy-Item -Recurse -Force "$tmp\greengas\ios" ./ios
    Remove-Item -Recurse -Force $tmp
}

$py = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' }
      elseif (Get-Command python -ErrorAction SilentlyContinue) { 'python' }
      else { throw 'Python introuvable (installez Python pour appliquer les permissions).' }
& $py scripts/patch_platforms.py
flutter pub get
dart format lib test
Write-Host 'Prêt. Lancez : flutter run'
