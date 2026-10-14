import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:greengas/app/theme.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/fake_api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/data/repositories.dart';
import 'package:greengas/features/citizen/citizen_shell.dart';
import 'package:greengas/features/citizen/rewards/reward_card.dart';
import 'package:greengas/features/citizen/rewards/reward_detail_screen.dart';
import 'package:greengas/features/collector/collector_shell.dart';
import 'package:greengas/features/landing/landing_screen.dart';
import 'package:greengas/features/notifications/notifications_screen.dart';
import 'package:greengas/features/profile/profile_screen.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/notification_bell.dart';

/// Affiche les vrais écrans avec le mode démo, sur un petit téléphone (360 × 640), en clair, en
/// sombre et avec un texte agrandi : aucun débordement de mise en page ni erreur d'exécution.
/// Les animations sont coupées (comme le réglage d'accessibilité du téléphone) pour que l'interface
/// se stabilise.
void main() {
  late FakeApiClient api;
  late MemoryTokenStore tokens;

  setUp(() {
    tokens = MemoryTokenStore();
    api = FakeApiClient(tokens: tokens, latency: Duration.zero);
  });

  Future<void> show(WidgetTester tester, Widget screen,
      {required ThemeMode mode, String? phone, double textScale = 1}) async {
    tester.view.physicalSize = const Size(360 * 3, 640 * 3);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final user = phone == null
        ? null
        : await tester.runAsync(
            () => AuthRepository(api, tokens).login(phone, 'greengas2026'));
    await tester.pumpWidget(ProviderScope(
      overrides: [
        tokenStoreProvider.overrideWithValue(tokens),
        apiClientProvider.overrideWithValue(api),
      ],
      child: Consumer(builder: (context, ref, _) {
        if (user != null && ref.read(sessionProvider) == null) {
          Future.microtask(() => ref.read(sessionProvider.notifier).set(user));
        }
        return MaterialApp(
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: mode,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context).copyWith(
              disableAnimations: true,
              textScaler: TextScaler.linear(textScale),
            ),
            child: child!,
          ),
          home: user == null || ref.watch(sessionProvider) != null
              ? screen
              : const SizedBox.shrink(),
        );
      }),
    ));
    await settle(tester);
  }

  Future<void> back(WidgetTester tester) async {
    await tester.tap(find.byTooltip('Retour').last);
    await settle(tester);
  }

  for (final (name, mode, scale) in [
    ('clair', ThemeMode.light, 1.0),
    ('sombre', ThemeMode.dark, 1.0),
    ('texte agrandi', ThemeMode.light, 1.3),
  ]) {
    group(name, () {
      smoke('landing', (tester) async {
        await show(tester, const LandingScreen(), mode: mode, textScale: scale);
        expect(find.byType(LandingScreen), findsOneWidget);
        noError(tester);
      });

      smoke('citoyen : onglets, récompense, notifications, profil',
          (tester) async {
        await show(tester, const CitizenShell(),
            mode: mode, phone: '+2250701020304', textScale: scale);
        for (final tab in ['Boutique', 'Gains', 'Carte', 'Scanner']) {
          await tester.tap(find.byTooltip(tab));
          await settle(tester);
          noError(tester, tab);
        }
        await tester.drag(find.byType(Scrollable).first, const Offset(0, -900));
        await settle(tester);
        noError(tester, 'défilement accueil');

        await tester.tap(find.byTooltip('Boutique'));
        await settle(tester);
        await tester.tap(find.byType(RewardCard).first);
        await settle(tester);
        expect(find.byType(RewardDetailScreen), findsOneWidget);
        noError(tester, 'détail récompense');
        await back(tester);

        await tester.tap(find.byType(NotificationBell));
        await settle(tester);
        expect(find.byType(NotificationsScreen), findsOneWidget);
        noError(tester, 'notifications');
        await back(tester);

        await tester.tap(find.byType(Avatar).first);
        await settle(tester);
        expect(find.byType(ProfileScreen), findsOneWidget);
        noError(tester, 'profil');
        await tester.pumpWidget(const SizedBox.shrink());
      });

      smoke('collecteur : tournée, scanner, profil', (tester) async {
        await show(tester, const CollectorShell(),
            mode: mode, phone: '+2250700000002', textScale: scale);
        noError(tester, 'tournée');
        await tester.tap(find.byTooltip('Scanner'));
        await settle(tester);
        noError(tester, 'scanner');
        await tester.tap(find.byType(Avatar).first);
        await settle(tester);
        noError(tester, 'profil');
        await tester.pumpWidget(const SizedBox.shrink());
      });
    });
  }
}

/// Test d'écran : les tuiles de carte ne se chargent pas sans réseau, leurs erreurs sont ignorées
/// (et seulement elles).
void smoke(String name, Future<void> Function(WidgetTester) body) {
  testWidgets(name, (tester) async {
    final original = FlutterError.onError;
    FlutterError.onError = (details) {
      if (details.library == 'image resource service') return;
      debugPrint('ERREUR : ${details.toString()}');
      original?.call(details);
    };
    try {
      await body(tester);
    } finally {
      FlutterError.onError = original;
    }
  });
}

/// Aucune erreur (débordement, exception) depuis la dernière vérification.
void noError(WidgetTester tester, [String? where]) {
  final e = tester.takeException();
  expect(e, isNull, reason: '${where ?? ''} : $e');
}

/// Laisse passer les chargements du mode démo et les transitions (sans attendre les minuteurs).
Future<void> settle(WidgetTester tester) async {
  for (var i = 0; i < 12; i++) {
    await tester.runAsync(() => Future<void>.delayed(Duration.zero));
    await tester.pump(const Duration(milliseconds: 100));
  }
}
