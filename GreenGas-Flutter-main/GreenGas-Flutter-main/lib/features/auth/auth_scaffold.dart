import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/brand.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/flux_background.dart';

/// Cadre de la connexion et de l'inscription (`CadreAuth` du desktop) : fond aux flux animés,
/// logo, puis panneau blanc arrondi qui monte avec un ressort et contient le formulaire.
class AuthScaffold extends ConsumerWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Scaffold(
      backgroundColor: c.background,
      body: Stack(
        children: [
          const Positioned.fill(
              child: FluxBackground(focus: Alignment(0.7, -0.75))),
          SafeArea(
            bottom: false,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg,
                      AppSpacing.sm, AppSpacing.lg, AppSpacing.lg),
                  child: Row(
                    children: [
                      CircleIconButton(
                        icon: Icons.arrow_back_rounded,
                        tooltip: ref.tr('back'),
                        onPressed: () => Navigator.of(context).maybePop(),
                      ),
                      const Spacer(),
                      Logo(white: context.isDark, height: 24),
                      const Spacer(),
                      const SizedBox(width: AppSpacing.touch),
                    ],
                  ),
                ),
                Expanded(
                  child: TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: 1),
                    duration: AppMotion.of(context, AppMotion.softCurve.settle),
                    curve: AppMotion.softCurve,
                    builder: (_, v, child) => Opacity(
                      opacity: v.clamp(0, 1),
                      child: Transform.translate(
                          offset: Offset(0, 40 * (1 - v)), child: child),
                    ),
                    child: Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: c.surface,
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(32)),
                        boxShadow: AppShadows.modal(context.isDark),
                      ),
                      child: ListView(
                        padding: EdgeInsets.fromLTRB(
                            AppSpacing.xxl,
                            AppSpacing.xxxl,
                            AppSpacing.xxl,
                            AppSpacing.xxxl +
                                MediaQuery.paddingOf(context).bottom),
                        children: [
                          Semantics(
                              header: true,
                              child: Text(title, style: t.headlineMedium)),
                          const SizedBox(height: AppSpacing.sm),
                          Text(subtitle,
                              style: t.bodyLarge?.copyWith(color: c.textMuted)),
                          const SizedBox(height: AppSpacing.xxl),
                          ...children,
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
