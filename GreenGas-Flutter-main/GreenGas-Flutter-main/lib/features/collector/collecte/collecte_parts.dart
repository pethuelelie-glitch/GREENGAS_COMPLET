import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Suivi d'étapes : ronds reliés, l'étape franchie se remplit de vert, la courante pulse.
class StepTracker extends StatelessWidget {
  const StepTracker({super.key, required this.current, required this.labels});

  final int current;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Semantics(
      label: '${labels[current]} (${current + 1}/${labels.length})',
      excludeSemantics: true,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < labels.length; i++) ...[
            if (i > 0)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 15),
                  child: ProgressBar(
                      value: i <= current ? 1 : 0, height: 3, color: c.green),
                ),
              ),
            SizedBox(
              width: 72,
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: AppMotion.of(context, AppMotion.base),
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: i <= current ? c.green : c.greenPale,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      i < current ? Icons.check_rounded : Icons.circle,
                      size: i < current ? 18 : 8,
                      color: i <= current ? Colors.white : c.textMuted,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(labels[i],
                      textAlign: TextAlign.center,
                      style: t.labelSmall?.copyWith(
                          color: i <= current ? c.text : c.textMuted)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// En-tête d'une étape : code du bac et libellé, élément facultatif à droite.
class BinHeader extends StatelessWidget {
  const BinHeader(
      {super.key, required this.code, required this.label, this.trailing});

  final String code;
  final String label;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      children: [
        IconBubble(
            icon: Icons.delete_rounded,
            color: Colors.white,
            background: c.forest,
            size: 52),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: c.textMuted)),
              CodeText(code, size: 22),
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

/// Ligne libellé / valeur d'une carte de données.
class DataLine extends StatelessWidget {
  const DataLine(this.label, this.value, {super.key});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
              child: Text(label,
                  style:
                      t.bodyMedium?.copyWith(color: context.colors.textMuted))),
          Text(value, style: t.titleSmall),
        ],
      ),
    );
  }
}
