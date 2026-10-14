import 'package:flutter/material.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/shared/design/animated_number.dart';
import 'package:greengas/shared/design/app_card.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Indicateur du desktop (`Indicateur`) : libellé et gros chiffre qui défile.
/// [dark] : variante mise en avant sur fond vert forêt.
class KpiCard extends StatelessWidget {
  const KpiCard(
      {super.key, required this.label, required this.value, this.dark = false});

  final String label;
  final int? value;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final fg = dark ? Colors.white : c.text;
    return AppCard(
      color: dark ? c.forest : null,
      radius: AppRadii.kpi,
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: t.labelMedium
                  ?.copyWith(color: dark ? c.onForestMuted : c.textMuted)),
          const SizedBox(height: AppSpacing.xs),
          value == null
              ? Text('…', style: t.headlineMedium?.copyWith(color: fg))
              : AnimatedNumber(
                  value: value!,
                  format: (v) => fmtInt(v.round()),
                  style: t.headlineMedium?.copyWith(color: fg)),
        ],
      ),
    );
  }
}
