import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Historique des dépôts du citoyen : squelette au chargement, état vide, puis lignes en cascade.
class DepositHistory extends ConsumerWidget {
  const DepositHistory({super.key});

  static (String, Tone) _status(StatutScan s) => switch (s) {
        StatutScan.valide => ('chip_counted', Tone.ok),
        StatutScan.nonLocalise => ('chip_nolocation', Tone.warn),
        StatutScan.horsZone => ('chip_outzone', Tone.alert),
        StatutScan.refusePlafond => ('chip_limit', Tone.alert),
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scans = ref.watch(scansProvider);
    final c = context.colors;
    return scans.when(
      skipLoadingOnRefresh: true,
      skipLoadingOnReload: true,
      loading: () => Skeleton.tiles(),
      error: (e, _) => ErrorState(
        message: friendlyError(e),
        onRetry: () => ref.invalidate(scansProvider),
        retryLabel: ref.tr('retry'),
      ),
      data: (list) => list.isEmpty
          ? EmptyState(
              compact: true,
              icon: Icons.delete_outline_rounded,
              message: ref.tr('no_deposits'),
            )
          : Column(
              children: [
                for (final (i, s) in list.indexed)
                  Reveal(
                    index: i,
                    offset: 8,
                    duration: AppMotion.row,
                    step: const Duration(milliseconds: 35),
                    child: AppTile(
                      icon:
                          s.compte ? Icons.check_rounded : Icons.block_rounded,
                      iconColor: s.compte ? c.okText : c.alertText,
                      iconBackground: s.compte ? c.okBg : c.alertBg,
                      title: ref.tr(
                          s.compte ? 'deposit_scanned' : 'deposit_not_counted'),
                      subtitle: fmtDateTime(s.horodatage),
                      trailing: StatusPill(ref.tr(_status(s.statut).$1),
                          tone: _status(s.statut).$2),
                    ),
                  ),
              ],
            ),
    );
  }
}
