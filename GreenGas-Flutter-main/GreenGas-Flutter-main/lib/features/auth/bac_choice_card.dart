import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Bac du citoyen à l'inscription : le bac choisi (ou rien), et le bouton pour le choisir.
class BacChoiceCard extends StatelessWidget {
  const BacChoiceCard({
    super.key,
    required this.actionLabel,
    required this.onChoose,
    this.title,
    this.code,
    this.distance,
    this.error,
  });

  final String actionLabel;
  final VoidCallback onChoose;
  final String? title;
  final String? code;
  final String? distance;
  final String? error;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return AnimatedContainer(
      duration: AppMotion.of(context, AppMotion.base),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.greenPale,
        borderRadius: BorderRadius.circular(AppRadii.card),
        border: Border.all(
            color: error != null ? c.alert : Colors.transparent, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AnimatedSize(
            duration: AppMotion.of(context, AppMotion.base),
            curve: AppMotion.out,
            child: title == null
                ? const SizedBox(width: double.infinity)
                : Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: Row(
                      children: [
                        IconBubble(
                            icon: Icons.location_on_rounded,
                            color: Colors.white,
                            background: c.forest),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title!, style: t.titleMedium),
                              Row(
                                children: [
                                  if (code != null) CodeText(code!, size: 13.5),
                                  if (distance != null)
                                    Text('  ·  $distance', style: t.bodySmall),
                                ],
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.check_circle_rounded, color: c.green),
                      ],
                    ),
                  ),
          ),
          AppButton(
            label: actionLabel,
            icon: Icons.map_rounded,
            kind: ButtonKind.outline,
            height: 48,
            onPressed: onChoose,
          ),
          if (error != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Icon(Icons.error_rounded, size: 18, color: c.alert),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(error!,
                      style: t.labelMedium?.copyWith(color: c.alertText)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
