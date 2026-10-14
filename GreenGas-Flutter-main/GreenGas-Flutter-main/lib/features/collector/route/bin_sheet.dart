import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/core/maps.dart';
import 'package:greengas/features/collector/route/bac_line.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Fiche d'un bac de la tournée (feuille du bas) : état, distance, scans, dernière collecte,
/// itinéraire Google Maps.
Future<void> showBinSheet(BuildContext context, BacLine line) =>
    showAppSheet<void>(context, builder: (_) => _BinSheet(line: line));

class _BinSheet extends ConsumerWidget {
  const _BinSheet({required this.line});
  final BacLine line;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final last = line.bac.dateDerniereCollecte;
    Widget row(IconData icon, String text) => Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: Row(
            children: [
              IconBubble(
                  icon: icon,
                  color: c.forestInk,
                  background: c.greenPale,
                  size: 36),
              const SizedBox(width: AppSpacing.md),
              Expanded(child: Text(text, style: t.bodyLarge)),
            ],
          ),
        );

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: CodeText(line.bac.code, size: 22)),
            StatusPill(ref.tr(line.etat.labelKey), tone: line.etat.tone),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(line.bac.residence,
            style: t.bodyLarge?.copyWith(color: c.textMuted)),
        const SizedBox(height: AppSpacing.xl),
        row(Icons.near_me_rounded,
            ref.tr('distance_from_you', args: {'d': fmtDistance(line.metres)})),
        row(
            Icons.qr_code_rounded,
            ref.tr('scans_since_last',
                args: {'n': '${line.bac.scansValidesPeriode}'})),
        row(
          Icons.history_rounded,
          last == null
              ? ref.tr('never_collected')
              : ref.tr('last_collection', args: {'date': fmtDateTime(last)}),
        ),
        NoticeBanner(
            text: ref.tr('bin_sheet_hint'),
            tone: Tone.neutral,
            icon: Icons.qr_code_scanner_rounded),
        const SizedBox(height: AppSpacing.lg),
        AppButton(
          label: ref.tr('directions'),
          icon: Icons.navigation_rounded,
          onPressed: () async {
            final ok = await ouvrirItineraireGoogleMaps(
                line.bac.latitude, line.bac.longitude);
            if (!ok && context.mounted) {
              showToast(context, ref.tr('open_gmaps_error'), error: true);
            }
          },
        ),
      ],
    );
  }
}
