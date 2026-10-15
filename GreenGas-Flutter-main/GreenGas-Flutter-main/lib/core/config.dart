<<<<<<< Updated upstream
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Configuration de l'application. Les valeurs réseau se règlent à l'exécution :
///
///   flutter run                                  -> backend Django local
///   flutter run --dart-define=USE_MOCK=false \
///               --dart-define=API_BASE_URL=http://192.168.1.20:8000/api/v1
=======
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Configuration de l'application.
/// Par défaut, l'application est maintenant CONNECTÉE au backend réel Django.
///
/// Pour forcer le mode mock sans serveur :
///   flutter run --dart-define=USE_MOCK=true
///
/// Pour spécifier une URL API différente (ex: smartphone physique sur le Wi-Fi) :
///   flutter run --dart-define=API_BASE_URL=http://192.168.100.8:8000/api/v1
>>>>>>> Stashed changes
///
/// Aucune règle métier ici : les calculs (points, périodes, seuils) sont faits par le backend.
class AppConfig {
  const AppConfig._();

<<<<<<< Updated upstream
  /// URL de l'API, configurable pour les appareils réels et les environnements distants.
  static const String _apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static final String apiBaseUrl = _apiBaseUrl.isNotEmpty
      ? _apiBaseUrl
      : 'http://${kIsWeb || defaultTargetPlatform != TargetPlatform.android ? 'localhost' : '10.0.2.2'}:8000/api/v1';
=======
  static const String _envBaseUrl = String.fromEnvironment('API_BASE_URL');
>>>>>>> Stashed changes

  /// URL de l'API REST v1.
  /// Si non surchargée via --dart-define=API_BASE_URL=... :
  /// - Émulateur Android : http://10.0.2.2:8000/api/v1 (adresse de la machine hôte)
  /// - Windows Desktop / Web / iOS / Autres : http://127.0.0.1:8000/api/v1
  static String get apiBaseUrl {
    if (_envBaseUrl.isNotEmpty) return _envBaseUrl;
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:8000/api/v1';
    }
    return 'http://127.0.0.1:8000/api/v1';
  }

  /// false : connecté au backend réel Django (HttpApiClient) [PAR DÉFAUT].
  /// true : mode mock hors ligne sans serveur (FakeApiClient).
  static const bool useMock =
      bool.fromEnvironment('USE_MOCK', defaultValue: false);

  /// Date de travail de la démo (le seed est daté du 12/09/2026), au format `AAAA-MM-JJ`.
  /// Identique à GREENGAS_DATE_TRAVAIL (backend) et VITE_DATE_DEMO (Control Center).
  static const String dateTravail = String.fromEnvironment('DATE_TRAVAIL');

  /// Position de démonstration (Cocody, Angré) quand le GPS est indisponible.
  static const double demoLat = 5.4005;
  static const double demoLng = -3.989;

  /// Mot de passe de tous les comptes de démo (guide §12).
  static const String demoPassword = 'greengas2026';
}
