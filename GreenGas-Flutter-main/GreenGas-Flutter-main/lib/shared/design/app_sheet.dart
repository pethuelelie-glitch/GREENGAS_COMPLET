import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/app_button.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/icon_bubble.dart';
import 'package:greengas/shared/design/status_pill.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Feuille du bas : monte avec le ressort des panneaux du desktop (340 / 34), coins arrondis 22.
Future<T?> showAppSheet<T>(BuildContext context,
    {required WidgetBuilder builder}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    sheetAnimationStyle: AnimationStyle(
      duration: AppMotion.of(context, AppMotion.reveal),
      curve: AppMotion.out,
      reverseDuration: AppMotion.of(context, AppMotion.fast),
    ),
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(AppSpacing.xxl, 0, AppSpacing.xxl,
          AppSpacing.xxl + MediaQuery.of(ctx).viewInsets.bottom),
      child: builder(ctx),
    ),
  );
}

/// Résultat d'une action (scan, échange, pesée…) : icône de statut, titre, message, « Fermer ».
Future<void> showResultSheet(
  BuildContext context, {
  required String title,
  required String message,
  bool success = true,
  Tone? tone,
  Widget? extra,
}) {
  return showAppSheet<void>(
    context,
    builder: (_) => _ResultSheet(
      title: title,
      message: message,
      tone: tone ?? (success ? Tone.ok : Tone.warn),
      extra: extra,
    ),
  );
}

class _ResultSheet extends ConsumerWidget {
  const _ResultSheet({
    required this.title,
    required this.message,
    required this.tone,
    this.extra,
  });

  final String title;
  final String message;
  final Tone tone;
  final Widget? extra;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Semantics(
      liveRegion: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.6, end: 1),
            duration: AppMotion.of(context, AppMotion.snappyCurve.settle),
            curve: AppMotion.snappyCurve,
            builder: (_, v, child) => Transform.scale(scale: v, child: child),
            child: IconBubble(
              icon: StatusPill.iconFor(tone),
              color: c.toneColor(tone),
              background: c.toneBg(tone),
              size: 72,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Text(title, textAlign: TextAlign.center, style: t.headlineSmall),
          const SizedBox(height: AppSpacing.sm),
          Text(message,
              textAlign: TextAlign.center,
              style: t.bodyMedium?.copyWith(color: c.textMuted)),
          if (extra != null) ...[
            const SizedBox(height: AppSpacing.lg),
            extra!,
          ],
          const SizedBox(height: AppSpacing.xxl),
          AppButton(
            label: ref.tr('close'),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }
}
