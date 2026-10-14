import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/circle_icon_button.dart';
import 'package:greengas/shared/design/reveal.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Écran poussé (notifications, profil, collecte…) : bouton retour rond, grand titre, contenu
/// défilant et bouton d'action collé en bas si besoin.
class PageScaffold extends ConsumerWidget {
  const PageScaffold({
    super.key,
    required this.title,
    this.children,
    this.body,
    this.actions = const [],
    this.bottom,
    this.onRefresh,
  }) : assert(children != null || body != null);

  final String title;
  final List<Widget>? children;
  final Widget? body;
  final List<Widget> actions;

  /// Action principale, collée en bas de l'écran.
  final Widget? bottom;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final canPop = Navigator.of(context).canPop();
    Widget content = body ??
        ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(AppSpacing.screen, AppSpacing.sm,
              AppSpacing.screen, AppSpacing.xxxl),
          children: children!,
        );
    if (onRefresh != null) {
      content = RefreshIndicator(onRefresh: onRefresh!, child: content);
    }
    return Scaffold(
      body: SafeArea(
        bottom: bottom == null,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.md),
              child: Row(
                children: [
                  if (canPop) ...[
                    CircleIconButton(
                      icon: Icons.arrow_back_rounded,
                      tooltip: ref.tr('back'),
                      onPressed: () => Navigator.of(context).maybePop(),
                    ),
                    const SizedBox(width: AppSpacing.md),
                  ],
                  Expanded(
                    child: Reveal(
                      offset: 6,
                      child: Semantics(
                        header: true,
                        child: Text(title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.headlineSmall),
                      ),
                    ),
                  ),
                  ...actions,
                ],
              ),
            ),
            Expanded(child: content),
            if (bottom != null)
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.screen,
                      AppSpacing.sm, AppSpacing.screen, AppSpacing.lg),
                  child: bottom,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
