import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/citizen/rewards/category_filter.dart';
import 'package:greengas/features/citizen/rewards/exchange_list.dart';
import 'package:greengas/features/citizen/rewards/reward_flow.dart';
import 'package:greengas/features/citizen/rewards/reward_grid.dart';
import 'package:greengas/features/citizen/rewards/reward_look.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';

/// Boutique : solde, filtres par catégorie, récompenses par catégorie, puis « Mes échanges ».
class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key});

  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  Timer? _refresh;
  RecompenseCategorie? _filter;

  @override
  void initState() {
    super.initState();
    // Le solde change quand la collecte est triée côté serveur : rafraîchi tant que l'onglet est visible.
    _refresh = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) ref.invalidate(soldeProvider);
    });
  }

  @override
  void dispose() {
    _refresh?.cancel();
    super.dispose();
  }

  Future<void> _pullToRefresh() async {
    ref.invalidate(recompensesProvider);
    ref.invalidate(echangesProvider);
    ref.invalidate(soldeProvider);
    await ref.read(soldeProvider.future);
  }

  @override
  Widget build(BuildContext context) {
    final solde = ref.watch(soldeProvider).valueOrNull;
    final balance = solde?.solde ?? 0;
    final rewards = ref.watch(recompensesProvider);
    final t = Theme.of(context).textTheme;
    final c = context.colors;

    return RefreshIndicator(
      onRefresh: _pullToRefresh,
      child: ListView(
        padding: EdgeInsets.only(bottom: FloatingDock.clearance(context)),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          AppHeader(title: ref.tr('shop')),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Reveal(
                  child: AppCard(
                    child: Row(
                      children: [
                        IconBubble(
                            icon: Icons.stars_rounded,
                            color: c.goldText,
                            background: c.goldPale,
                            size: 48),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Text(ref.tr('points_available'),
                              style:
                                  t.labelMedium?.copyWith(color: c.textMuted)),
                        ),
                        solde == null
                            ? Text('…', style: t.headlineMedium)
                            : AnimatedNumber(
                                value: balance,
                                format: (v) => fmtInt(v.round()),
                                style: t.headlineMedium),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                rewards.when(
                  skipLoadingOnRefresh: true,
                  loading: () => const Skeleton(
                      child: SkeletonBox(height: 260, radius: AppRadii.card)),
                  error: (e, _) => ErrorState(
                    message: friendlyError(e),
                    onRetry: () => ref.invalidate(recompensesProvider),
                    retryLabel: ref.tr('retry'),
                  ),
                  data: (list) =>
                      _catalogue(list.where((r) => r.actif).toList(), balance),
                ),
                SectionHeader(ref.tr('my_exchanges')),
                const ExchangeList(),
                const SizedBox(height: AppSpacing.lg),
                Text(ref.tr('rewards_footer'),
                    textAlign: TextAlign.center, style: t.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _catalogue(List<Recompense> rewards, int balance) {
    final categories = RecompenseCategorie.values
        .where((cat) => rewards.any((r) => r.categorie == cat))
        .toList();
    if (categories.isEmpty) {
      return EmptyState(
          compact: true,
          icon: Icons.redeem_rounded,
          message: ref.tr('no_rewards'));
    }
    final shown = _filter == null ? categories : [_filter!];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CategoryFilter(
          categories: categories,
          selected: _filter,
          allLabel: ref.tr('shop_all'),
          labelOf: (key) => ref.tr(key),
          onSelect: (cat) => setState(() => _filter = cat),
        ),
        // Le changement de filtre fait apparaître la nouvelle sélection en fondu.
        AnimatedSwitcher(
          duration: AppMotion.of(context, AppMotion.base),
          child: Column(
            key: ValueKey(_filter),
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final cat in shown) ...[
                SectionHeader(ref.tr(RewardLook.of(context, cat).labelKey)),
                RewardGrid(
                  rewards: rewards.where((r) => r.categorie == cat).toList(),
                  balance: balance,
                  onTap: (r) => openReward(context, ref, r),
                  pointsLabel: (n) => ref.tr('n_pts', args: {'n': fmtInt(n)}),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
