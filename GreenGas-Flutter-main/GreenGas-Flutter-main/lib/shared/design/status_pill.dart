import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';

/// Pastille de statut du desktop (`PastilleStatut`) : couleur + icône + texte, jamais la couleur seule.
class StatusPill extends StatelessWidget {
  const StatusPill(this.label, {super.key, this.tone = Tone.ok, this.icon});

  final String label;
  final Tone tone;

  /// Icône propre ; sinon celle du ton.
  final IconData? icon;

  static IconData iconFor(Tone t) => switch (t) {
        Tone.ok => Icons.check_circle_rounded,
        Tone.warn => Icons.schedule_rounded,
        Tone.alert => Icons.error_rounded,
        Tone.neutral => Icons.remove_circle_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = c.toneText(tone);
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 5, 11, 5),
      decoration: BoxDecoration(
        color: c.toneBg(tone),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon ?? iconFor(tone), size: 15, color: fg),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context)
                  .textTheme
                  .labelMedium
                  ?.copyWith(color: fg, fontWeight: FontWeight.w700, height: 1),
            ),
          ),
        ],
      ),
    );
  }
}
