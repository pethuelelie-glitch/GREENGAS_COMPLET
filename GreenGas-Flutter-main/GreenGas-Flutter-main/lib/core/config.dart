/// Configuration de l'application. Les valeurs réseau se règlent à l'exécution :
///
///   flutter run                                  -> mode démo (données fictives, sans serveur)
///   flutter run --dart-define=USE_MOCK=false \
///               --dart-define=API_BASE_URL=http://192.168.1.20:8000/api/v1
///
/// Aucune règle métier ici : les calculs (points, périodes, seuils) sont faits par le backend.
class AppConfig {
  const AppConfig._();

  /// URL de l'API. 10.0.2.2 = le PC vu depuis l'émulateur Android.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api/v1',
  );

  /// true : l'app utilise FakeApiClient (mêmes formats que l'API, données du guide §12).
  static const bool useMock =
      bool.fromEnvironment('USE_MOCK', defaultValue: true);

  /// Date de travail de la démo (le seed est daté), au format `AAAA-MM-JJ`.
  /// Doit valoir la même chose que `GREENGAS_DATE_TRAVAIL` (backend) et `VITE_DATE_DEMO`
  /// (Control Center). Vide : on utilise la date du jour.
  static const String dateTravail = String.fromEnvironment('DATE_TRAVAIL');

  /// Position de démonstration (Cocody, Angré) quand le GPS est indisponible.
  static const double demoLat = 5.4005;
  static const double demoLng = -3.989;

  /// Mot de passe de tous les comptes de démo (guide §12).
  static const String demoPassword = 'greengas2026';
}
