import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/app/theme.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/auth/wrong_role_screen.dart';
import 'package:greengas/features/citizen/citizen_shell.dart';
import 'package:greengas/features/collector/collector_shell.dart';
import 'package:greengas/features/landing/landing_screen.dart';
import 'package:greengas/shared/brand.dart';
import 'package:greengas/shared/design/design.dart';

class GreenGasApp extends ConsumerWidget {
  const GreenGasApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'GreenGas',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ref.watch(themeModeProvider),
      // Icônes de la barre d'état lisibles sur les fonds clairs comme sombres.
      builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
        value: (context.isDark
                ? SystemUiOverlayStyle.light
                : SystemUiOverlayStyle.dark)
            .copyWith(
          statusBarColor: Colors.transparent,
          systemNavigationBarColor: Colors.transparent,
        ),
        child: child!,
      ),
      home: const _Boot(),
    );
  }
}

/// Au démarrage, retrouve la session (jetons enregistrés), puis ouvre le bon parcours
/// selon le `role` renvoyé par le serveur (guide §5).
class _Boot extends ConsumerStatefulWidget {
  const _Boot();

  @override
  ConsumerState<_Boot> createState() => _BootState();
}

class _BootState extends ConsumerState<_Boot> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      try {
        final user = await ref.read(authRepoProvider).restore();
        ref.read(sessionProvider.notifier).set(user);
      } catch (_) {
        // Réseau indisponible au démarrage : on montre la connexion.
      }
      if (mounted) setState(() => _ready = true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(sessionProvider);
    final Widget screen = !_ready
        ? const _Splash()
        : switch (user?.role) {
            null => const LandingScreen(),
            Role.citoyen => const CitizenShell(),
            Role.collecteur => const CollectorShell(),
            _ => const WrongRoleScreen(),
          };
    // Passage en fondu entre le démarrage, la landing et les parcours (connexion, déconnexion).
    return AnimatedSwitcher(
      duration: AppMotion.of(context, AppMotion.page),
      child: KeyedSubtree(
          key: ValueKey(_ready ? user?.role : 'boot'), child: screen),
    );
  }
}

/// Même visuel que l'écran de démarrage natif : logo blanc sur vert forêt.
class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: context.colors.forest,
        body: const Center(child: Logo(white: true, height: 40)),
      );
}
