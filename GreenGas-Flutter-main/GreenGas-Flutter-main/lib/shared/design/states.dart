import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_button.dart';
import 'package:greengas/shared/design/app_card.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/icon_bubble.dart';
import 'package:greengas/shared/design/reveal.dart';
import 'package:greengas/shared/design/tokens.dart';

/// État vide du desktop (`EtatVide`) : rond vert pâle, titre, message, action facultative.
class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.message,
    this.title,
    this.icon = Icons.inbox_rounded,
    this.action,
    this.compact = false,
  });

  final String message;
  final String? title;
  final IconData icon;
  final Widget? action;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Reveal(
      offset: 8,
      child: Padding(
        padding: EdgeInsets.symmetric(
            horizontal: AppSpacing.xxl,
            vertical: compact ? AppSpacing.lg : AppSpacing.xxxl),
        child: Column(
          children: [
            IconBubble(
                icon: icon,
                color: c.green,
                background: c.greenPale,
                size: compact ? 48 : 64),
            const SizedBox(height: AppSpacing.md),
            if (title != null) ...[
              Text(title!, textAlign: TextAlign.center, style: t.titleMedium),
              const SizedBox(height: AppSpacing.xs),
            ],
            Text(message,
                textAlign: TextAlign.center,
                style: t.bodyMedium?.copyWith(color: c.textMuted)),
            if (action != null) ...[
              const SizedBox(height: AppSpacing.lg),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Erreur du desktop (`EtatErreur`) : carte cerclée de rouge, message du serveur, « Réessayer ».
class ErrorState extends StatelessWidget {
  const ErrorState({
    super.key,
    required this.message,
    this.onRetry,
    this.retryLabel,
  });

  final String message;
  final VoidCallback? onRetry;
  final String? retryLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Reveal(
      offset: 8,
      child: AppCard(
        alert: true,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconBubble(
                    icon: Icons.cloud_off_rounded,
                    color: c.alert,
                    background: c.alertBg,
                    size: 40),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(message,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
              ],
            ),
            if (onRetry != null && retryLabel != null) ...[
              const SizedBox(height: AppSpacing.md),
              AppButton(
                label: retryLabel!,
                icon: Icons.refresh_rounded,
                onPressed: onRetry,
                kind: ButtonKind.outline,
                height: 48,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
