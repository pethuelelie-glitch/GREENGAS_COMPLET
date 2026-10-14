import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/l10n/app_lang.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Choix de la langue dans une feuille du bas. Dioula et baoulé sont signalés comme partiels.
Future<void> showLanguageSheet(BuildContext context) =>
    showAppSheet<void>(context, builder: (_) => const _LanguageSheet());

class _LanguageSheet extends ConsumerWidget {
  const _LanguageSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(languageProvider);
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(ref.tr('language'), style: t.headlineSmall),
        const SizedBox(height: AppSpacing.lg),
        for (final lang in AppLang.values)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: Semantics(
              inMutuallyExclusiveGroup: true,
              selected: lang == current,
              child: AppCard(
                color: lang == current ? c.greenPale : null,
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg, vertical: AppSpacing.md + 2),
                onTap: () {
                  ref.read(languageProvider.notifier).set(lang);
                  Navigator.of(context).pop();
                },
                semanticLabel: lang.label,
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(lang.label, style: t.titleMedium),
                          if (lang.partial)
                            Text(ref.tr('language_partial'),
                                style: t.bodySmall),
                        ],
                      ),
                    ),
                    AnimatedSwitcher(
                      duration: AppMotion.of(context, AppMotion.fast),
                      child: lang == current
                          ? Icon(Icons.check_circle_rounded,
                              key: const ValueKey(true), color: c.green)
                          : Icon(Icons.circle_outlined,
                              key: const ValueKey(false), color: c.border),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
