"""Ajoute les permissions caméra / localisation / internet (idempotent)."""
import pathlib
import re

manifest = pathlib.Path('android/app/src/main/AndroidManifest.xml')
text = manifest.read_text(encoding='utf-8')
perms = [
    'android.permission.INTERNET',
    'android.permission.CAMERA',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
]
add = ''.join(
    f'    <uses-permission android:name="{p}"/>\n' for p in perms if p not in text
)
if add:
    text = text.replace('<application', add + '    <application', 1)
# Le backend local est en HTTP : autorise le trafic clair (à retirer pour la production).
if 'usesCleartextTraffic' not in text:
    text = text.replace('<application', '<application android:usesCleartextTraffic="true"', 1)
# Nom affiché de l'app (le projet s'appelle greengas ; on veut « GreenGas »).
text = text.replace('android:label="greengas"', 'android:label="GreenGas"')
manifest.write_text(text, encoding='utf-8')

plist = pathlib.Path('ios/Runner/Info.plist')
s = plist.read_text(encoding='utf-8')
keys = {
    'NSCameraUsageDescription': 'GreenGas utilise la caméra pour scanner le QR code des bacs.',
    'NSLocationWhenInUseUsageDescription': 'GreenGas utilise votre position pour afficher les bacs proches.',
}
add = ''.join(
    f'\t<key>{k}</key>\n\t<string>{v}</string>\n' for k, v in keys.items() if k not in s
)
if 'NSAppTransportSecurity' not in s:
    add += '\t<key>NSAppTransportSecurity</key>\n\t<dict>\n\t\t<key>NSAllowsLocalNetworking</key>\n\t\t<true/>\n\t</dict>\n'
if add:
    i = s.rindex('</dict>')
    s = s[:i] + add + s[i:]
# Nom affiché de l'app (le projet s'appelle greengas ; on veut « GreenGas »).
s = s.replace('\t<string>Greengas</string>', '\t<string>GreenGas</string>')
plist.write_text(s, encoding='utf-8')

# minSdk 23 : requis par flutter_map / geolocator (Android 6.0+). Idempotent, gère les deux
# syntaxes de Gradle (Groovy et Kotlin DSL).
for gradle in ('android/app/build.gradle.kts', 'android/app/build.gradle'):
    path = pathlib.Path(gradle)
    if not path.exists():
        continue
    g = path.read_text(encoding='utf-8')
    g = re.sub(r'minSdk\s*=\s*flutter\.minSdkVersion', 'minSdk = 23', g)
    g = re.sub(r'minSdkVersion\s+flutter\.minSdkVersion', 'minSdkVersion 23', g)
    path.write_text(g, encoding='utf-8')

print('Plateformes configurées : caméra, localisation, internet, HTTP local, minSdk 23.')
