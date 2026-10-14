import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Encart du mode démonstration : remplit le formulaire avec un compte fictif.
class DemoCard extends StatelessWidget {
  const DemoCard({
    super.key,
    required this.title,
    required this.text,
    required this.accounts,
  });

  final String title;
  final String text;

  /// Libellé du compte et action qui remplit le formulaire.
  final List<(String, VoidCallback)> accounts;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: c.goldPale,
        borderRadius: BorderRadius.circular(AppRadii.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.science_rounded, size: 20, color: c.goldText),
              const SizedBox(width: AppSpacing.sm),
              Text(title, style: t.titleSmall?.copyWith(color: c.goldText)),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(text, style: t.bodySmall?.copyWith(color: c.goldText)),
          const SizedBox(height: AppSpacing.md),
          Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              for (final (label, fill) in accounts)
                ActionChip(
                  avatar:
                      Icon(Icons.person_rounded, size: 18, color: c.forestInk),
                  label: Text(label),
                  onPressed: fill,
                ),
            ],
          ),
        ],
      ),
    );
  }
}
