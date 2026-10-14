import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/reveal.dart';
import 'package:greengas/shared/design/status_pill.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Bandeau d'information du desktop (`Bandeau`) : fond du ton, icône, texte. Descend en apparaissant.
class NoticeBanner extends StatelessWidget {
  const NoticeBanner({
    super.key,
    required this.text,
    this.tone = Tone.warn,
    this.icon,
  });

  final String text;
  final Tone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Reveal(
      offset: -10,
      child: Semantics(
        liveRegion: true,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(AppSpacing.md + 2),
          decoration: BoxDecoration(
            color: c.toneBg(tone),
            borderRadius: BorderRadius.circular(AppRadii.tile),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon ?? StatusPill.iconFor(tone),
                  size: 20, color: c.toneColor(tone)),
              const SizedBox(width: AppSpacing.sm + 2),
              Expanded(
                child: Text(
                  text,
                  style: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: c.toneText(tone)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
