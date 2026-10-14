#!/usr/bin/env bash
# Prépare le projet après un clone : génère android/ios, permissions, dépendances, format.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -d android ] && [ -d ios ]; then
  echo "Dossiers android/ et ios/ déjà présents."
else
  TMP="$(mktemp -d)"
  flutter create --org ci.greengas --project-name greengas --platforms=android,ios "$TMP/greengas" >/dev/null
  cp -R "$TMP/greengas/android" ./android
  cp -R "$TMP/greengas/ios" ./ios
  rm -rf "$TMP"
fi

PY=python3
command -v python3 >/dev/null 2>&1 || PY=python
"$PY" scripts/patch_platforms.py
flutter pub get
dart format lib test
echo "Prêt. Lancez : flutter run"
