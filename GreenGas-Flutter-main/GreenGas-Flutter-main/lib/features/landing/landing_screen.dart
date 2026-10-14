import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/features/auth/login_screen.dart';
import 'package:greengas/features/auth/signup_screen.dart';
import 'package:greengas/features/landing/hero/hero_chain.dart';
import 'package:greengas/features/landing/hero/hero_logo.dart';
import 'package:greengas/features/landing/hero/hero_rewards.dart';
import 'package:greengas/features/landing/hero/hero_steps.dart';
import 'package:greengas/features/landing/page_dots.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/brand.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/flux_background.dart';
import 'package:greengas/shared/language_sheet.dart';

/// Page d'accueil (maquette Planta) : logo en haut, visuel héros animé, panneau blanc arrondi avec
/// le carrousel des 4 messages et le bouton pilule. Le carrousel défile seul toutes les 5 s,
/// s'arrête quand on touche l'écran et reprend ensuite.
class LandingScreen extends ConsumerStatefulWidget {
  const LandingScreen({super.key});

  @override
  ConsumerState<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends ConsumerState<LandingScreen> {
  static const _slides = 4;
  final _controller = PageController();
  Timer? _timer;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _startAutoPlay();
  }

  void _startAutoPlay() {
    _timer?.cancel();
    _timer = Timer.periodic(
        const Duration(seconds: 5), (_) => _goTo((_page + 1) % _slides));
  }

  void _goTo(int page) {
    if (!_controller.hasClients) return;
    _controller.animateToPage(page,
        duration: AppMotion.of(context, const Duration(milliseconds: 700)),
        curve: Curves.easeInOutCubic);
  }

  void _push(Widget screen) => Navigator.of(context)
      .push(MaterialPageRoute<void>(builder: (_) => screen));

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final heroes = [
      const HeroLogo(),
      HeroSteps(labels: [
        ref.tr('step_scan'),
        ref.tr('step_collect'),
        ref.tr('step_energy')
      ]),
      HeroRewards(labels: [
        ref.tr('rw_internet'),
        ref.tr('rw_call'),
        ref.tr('rw_voucher'),
        ref.tr('rw_donation'),
      ]),
      HeroChain(labels: [
        ref.tr('chain_bin'),
        ref.tr('chain_collect'),
        ref.tr('chain_sort'),
        ref.tr('chain_biogas'),
        ref.tr('chain_power'),
      ]),
    ];

    return Scaffold(
      backgroundColor: c.background,
      body: Listener(
        onPointerDown: (_) => _timer?.cancel(),
        onPointerUp: (_) => _startAutoPlay(),
        onPointerCancel: (_) => _startAutoPlay(),
        child: Column(
          children: [
            Expanded(
              child: Stack(
                children: [
                  const Positioned.fill(
                      child: FluxBackground(focus: Alignment(0, 0.2))),
                  SafeArea(
                    bottom: false,
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(
                              AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
                          child: Row(
                            children: [
                              const SizedBox(width: AppSpacing.touch),
                              Expanded(
                                child: Center(
                                    child: Logo(
                                        white: context.isDark, height: 26)),
                              ),
                              CircleIconButton(
                                icon: Icons.translate_rounded,
                                tooltip: ref.tr('language'),
                                onPressed: () => showLanguageSheet(context),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Center(
                            child: AnimatedSwitcher(
                              duration: AppMotion.of(context, AppMotion.reveal),
                              switchInCurve: AppMotion.out,
                              transitionBuilder: (child, a) => FadeTransition(
                                opacity: a,
                                child: ScaleTransition(
                                  scale:
                                      Tween(begin: 0.94, end: 1.0).animate(a),
                                  child: child,
                                ),
                              ),
                              child: KeyedSubtree(
                                  key: ValueKey(_page), child: heroes[_page]),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: double.infinity,
              padding: EdgeInsets.fromLTRB(
                  AppSpacing.xxl,
                  AppSpacing.xxl + 4,
                  AppSpacing.xxl,
                  AppSpacing.md + MediaQuery.paddingOf(context).bottom),
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: AppShadows.modal(context.isDark),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    // Deux lignes de titre et trois de texte, à la taille de texte du téléphone.
                    height: MediaQuery.textScalerOf(context).scale(160),
                    child: PageView(
                      controller: _controller,
                      onPageChanged: (i) => setState(() => _page = i),
                      children: [
                        for (var i = 1; i <= _slides; i++)
                          Column(
                            children: [
                              Text(ref.tr('l${i}_title'),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  style: t.headlineMedium),
                              const SizedBox(height: AppSpacing.md),
                              Text(ref.tr('l${i}_text'),
                                  textAlign: TextAlign.center,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                  style: t.bodyLarge
                                      ?.copyWith(color: c.textMuted)),
                            ],
                          ),
                      ],
                    ),
                  ),
                  PageDots(
                    count: _slides,
                    index: _page,
                    onTap: _goTo,
                    labelOf: (i) => ref.tr('slide_of',
                        args: {'n': '${i + 1}', 'total': '$_slides'}),
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  ArrowPillButton(
                    label: ref.tr('start'),
                    onPressed: () => _push(const SignUpScreen()),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  TextButton(
                    onPressed: () => _push(const LoginScreen()),
                    child: Text(ref.tr('have_account')),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
