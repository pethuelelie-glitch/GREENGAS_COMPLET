import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/features/collector/route/no_route_view.dart';
import 'package:greengas/features/collector/route/route_detail.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';

/// Onglet Tournée du collecteur : la tournée du jour, ou les prochaines s'il n'y en a pas.
class TourneeScreen extends ConsumerWidget {
  const TourneeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(currentTourneeProvider);
    return current.when(
      skipLoadingOnRefresh: true,
      skipLoadingOnReload: true,
      loading: () => ListView(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
        children: [
          const AppHeader(),
          const Skeleton(
              child: SkeletonBox(height: 190, radius: AppRadii.card)),
          const SizedBox(height: AppSpacing.lg),
          Skeleton.tiles(),
        ],
      ),
      error: (e, _) => ListView(
        children: [
          const AppHeader(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: ErrorState(
              message: friendlyError(e),
              onRetry: () => ref.invalidate(tourneesDuJourProvider),
              retryLabel: ref.tr('retry'),
            ),
          ),
        ],
      ),
      data: (t) => t == null
          ? const NoRouteView()
          : RouteDetail(key: ValueKey(t.id), summary: t),
    );
  }
}
