import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';

/// Détail des gains de points (`GET /greenpoints/transactions/`).
/// Le backend décide du montant et du statut : ici on ne fait qu'afficher.
class GainsScreen extends ConsumerStatefulWidget {
  const GainsScreen({super.key});

  @override
  ConsumerState<GainsScreen> createState() => _GainsScreenState();
}

class _GainsScreenState extends ConsumerState<GainsScreen> {
  Timer? _refresh;

  @override
  void initState() {
    super.initState();
    // Les points passent de « en attente » à « crédités » après le tri côté serveur.
    _refresh = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        ref.invalidate(soldeProvider);
        ref.invalidate(transactionsProvider);
      }
    });
  }

  @override
  void dispose() {
    _refresh?.cancel();
    super.dispose();
  }

  Future<void> _pullToRefresh() async {
    ref.invalidate(transactionsProvider);
    ref.invalidate(soldeProvider);
    await ref.read(transactionsProvider.future);
  }

  static (String, Tone) _status(StatutTransaction s) => switch (s) {
        StatutTransaction.creditee => ('tx_creditee', Tone.ok),
        StatutTransaction.enAttente => ('tx_en_attente', Tone.warn),
        StatutTransaction.annulee => ('tx_annulee', Tone.alert),
      };

  @override
  Widget build(BuildContext context) {
    final solde = ref.watch(soldeProvider).valueOrNull;
    final transactions = ref.watch(transactionsProvider);
    final c = context.colors;
    final t = Theme.of(context).textTheme;

    return RefreshIndicator(
      onRefresh: _pullToRefresh,
      child: ListView(
        padding: EdgeInsets.only(bottom: FloatingDock.clearance(context)),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          AppHeader(title: ref.tr('nav_gains')),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Reveal(
                        child: KpiCard(
                          label: ref.tr('total_earned'),
                          value: solde?.totalGagne,
                          dark: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Reveal(
                        index: 1,
                        child: KpiCard(
                          label: ref.tr('points_available'),
                          value: solde?.solde,
                        ),
                      ),
                    ),
                  ],
                ),
                if (solde != null && solde.pointsEnAttente > 0) ...[
                  const SizedBox(height: AppSpacing.md),
                  NoticeBanner(
                    text: ref.tr('pending_points',
                        args: {'n': fmtInt(solde.pointsEnAttente)}),
                    icon: Icons.hourglass_top_rounded,
                  ),
                ],
                SectionHeader(ref.tr('gains_history')),
                transactions.when(
                  skipLoadingOnRefresh: true,
                  skipLoadingOnReload: true,
                  loading: () => Skeleton.tiles(),
                  error: (e, _) => ErrorState(
                    message: friendlyError(e),
                    onRetry: () => ref.invalidate(transactionsProvider),
                    retryLabel: ref.tr('retry'),
                  ),
                  data: (list) => list.isEmpty
                      ? EmptyState(
                          icon: Icons.savings_rounded,
                          message: ref.tr('no_gains'))
                      : Column(
                          children: [
                            for (final (i, tx) in list.indexed)
                              Reveal(
                                index: i,
                                offset: 8,
                                duration: AppMotion.row,
                                step: const Duration(milliseconds: 35),
                                child: AppTile(
                                  icon: Icons.local_shipping_rounded,
                                  title: ref.tr('tx_route',
                                      args: {'code': tx.codeTournee}),
                                  subtitle:
                                      '${fmtDateTime(tx.date)} · ${ref.tr('tx_scans', args: {
                                        'n': fmtInt(tx.scansCitoyen)
                                      })}',
                                  trailing: Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('+${fmtInt(tx.points)}',
                                          style: t.titleMedium?.copyWith(
                                              color: tx.statut ==
                                                      StatutTransaction.annulee
                                                  ? c.textMuted
                                                  : c.okText)),
                                      const SizedBox(height: 4),
                                      StatusPill(ref.tr(_status(tx.statut).$1),
                                          tone: _status(tx.statut).$2),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
