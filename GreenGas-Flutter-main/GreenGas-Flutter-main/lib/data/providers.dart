import 'package:flutter/material.dart' show ThemeMode;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/config.dart';
import 'package:greengas/core/location.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/fake_api_client.dart';
import 'package:greengas/data/http_api_client.dart';
import 'package:greengas/data/repositories.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/l10n/app_lang.dart';

// ---- Infrastructure : mode démo (FakeApiClient) ou serveur réel (HttpApiClient) ----
final tokenStoreProvider = Provider<TokenStore>(
  (ref) => AppConfig.useMock ? MemoryTokenStore() : const SecureTokenStore(),
);

final apiClientProvider = Provider<ApiClient>((ref) {
  final tokens = ref.watch(tokenStoreProvider);
  if (AppConfig.useMock) return FakeApiClient(tokens: tokens);
  return HttpApiClient(
    baseUrl: AppConfig.apiBaseUrl,
    tokens: tokens,
    onSessionExpired: () => ref.read(sessionProvider.notifier).set(null),
  );
});

final authRepoProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(
      ref.watch(apiClientProvider), ref.watch(tokenStoreProvider)),
);
final bacRepoProvider = Provider<BacRepository>(
    (ref) => BacRepository(ref.watch(apiClientProvider)));
final scanRepoProvider = Provider<ScanRepository>(
    (ref) => ScanRepository(ref.watch(apiClientProvider)));
final pointsRepoProvider = Provider<PointsRepository>(
    (ref) => PointsRepository(ref.watch(apiClientProvider)));
final tourneeRepoProvider = Provider<TourneeRepository>(
    (ref) => TourneeRepository(ref.watch(apiClientProvider)));
final notifRepoProvider = Provider<NotificationRepository>(
    (ref) => NotificationRepository(ref.watch(apiClientProvider)));
final parametresRepoProvider = Provider<ParametresRepository>(
    (ref) => ParametresRepository(ref.watch(apiClientProvider)));

// ---- État de l'application ----
class SessionNotifier extends Notifier<Utilisateur?> {
  @override
  Utilisateur? build() => null;

  void set(Utilisateur? user) => state = user;
}

final sessionProvider =
    NotifierProvider<SessionNotifier, Utilisateur?>(SessionNotifier.new);

class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ThemeMode.light;

  void toggle() =>
      state = state == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
}

final themeModeProvider =
    NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

class LanguageNotifier extends Notifier<AppLang> {
  @override
  AppLang build() => AppLang.fr;

  void set(AppLang lang) => state = lang;
}

final languageProvider =
    NotifierProvider<LanguageNotifier, AppLang>(LanguageNotifier.new);

class NotificationsNotifier extends Notifier<bool> {
  @override
  bool build() => true;

  void toggle() => state = !state;
}

final notificationsProvider =
    NotifierProvider<NotificationsNotifier, bool>(NotificationsNotifier.new);

// ---- Données citoyen (invalider un provider après une écriture rafraîchit l'écran) ----
final soldeProvider = FutureProvider.autoDispose<Solde>(
    (ref) => ref.watch(pointsRepoProvider).solde());
final scansProvider = FutureProvider.autoDispose<List<Scan>>(
    (ref) => ref.watch(scanRepoProvider).history());
final transactionsProvider =
    FutureProvider.autoDispose<List<GreenPointsTransaction>>(
        (ref) => ref.watch(pointsRepoProvider).transactions());
final recompensesProvider = FutureProvider.autoDispose<List<Recompense>>(
    (ref) => ref.watch(pointsRepoProvider).recompenses());
final echangesProvider = FutureProvider.autoDispose<List<Echange>>(
    (ref) => ref.watch(pointsRepoProvider).echanges());
final notificationsCountProvider = FutureProvider.autoDispose<int>(
    (ref) => ref.watch(notifRepoProvider).compteur());
final notificationsListProvider =
    FutureProvider.autoDispose<List<Notification>>(
        (ref) => ref.watch(notifRepoProvider).liste());

/// Plafond de scans comptés par jour (paramètre `max_scans_par_jour`, contrat 1.6.0).
/// L'app bloque le scan à l'avance pour ne pas gaspiller un dépôt. Repli sur 2 (guide §9)
/// si le paramètre n'est pas lisible : la défense qui fait foi reste côté serveur.
final plafondScansProvider = FutureProvider.autoDispose<int>((ref) async {
  try {
    final p =
        await ref.watch(parametresRepoProvider).lire('max_scans_par_jour');
    return p.valeur.round();
  } catch (_) {
    return 2;
  }
});

// ---- Données collecteur ----
/// Date de travail (`DATE_TRAVAIL`) si elle est définie, sinon la date du jour.
String todayIso() {
  if (AppConfig.dateTravail.isNotEmpty) return AppConfig.dateTravail;
  final n = DateTime.now();
  return '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
}

/// Mes tournées du jour.
final tourneesDuJourProvider = FutureProvider.autoDispose<List<Tournee>>(
  (ref) => ref.watch(tourneeRepoProvider).list(date: todayIso()),
);

/// Mes prochaines tournées (planifiées, après aujourd'hui), de la plus proche à la plus lointaine.
final prochainesTourneesProvider =
    FutureProvider.autoDispose<List<Tournee>>((ref) async {
  final planned =
      await ref.watch(tourneeRepoProvider).list(statut: 'planifiee');
  final today = todayIso();
  return planned.where((t) => t.date.compareTo(today) > 0).toList()
    ..sort((a, b) => a.date.compareTo(b.date));
});

final tourneeDetailProvider =
    FutureProvider.autoDispose.family<Tournee, String>(
  (ref, id) => ref.watch(tourneeRepoProvider).detail(id),
);

/// Position GPS (ou position de démonstration). Invalider pour réactualiser.
final userLocationProvider =
    FutureProvider<UserLocation>((ref) => LocationService.currentOrDemo());

class SelectedTourneeNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String? id) => state = id;
}

final selectedTourneeIdProvider =
    NotifierProvider<SelectedTourneeNotifier, String?>(
        SelectedTourneeNotifier.new);

/// Tournée affichée : la sélectionnée, sinon la première en cours, sinon la première du jour.
final currentTourneeProvider =
    FutureProvider.autoDispose<Tournee?>((ref) async {
  final list = await ref.watch(tourneesDuJourProvider.future);
  if (list.isEmpty) return null;
  final selected = ref.watch(selectedTourneeIdProvider);
  return list.where((t) => t.id == selected).firstOrNull ??
      list.where((t) => t.statut == StatutTournee.enCours).firstOrNull ??
      list.first;
});
