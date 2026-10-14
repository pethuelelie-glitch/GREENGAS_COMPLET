import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';

/// Aucune tournée aujourd'hui : message, puis les prochaines tournées planifiées.
class NoRouteView extends ConsumerWidget {
  const NoRouteView({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref.invalidate(tourneesDuJourProvider);
    ref.invalidate(prochainesTourneesProvider);
    await ref.read(tourneesDuJourProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final next = ref.watch(prochainesTourneesProvider).valueOrNull ?? const [];
    return RefreshIndicator(
      onRefresh: () => _refresh(ref),
      child: ListView(
        padding: EdgeInsets.only(bottom: FloatingDock.clearance(context)),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const AppHeader(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppCard(
                  child: EmptyState(
                    compact: true,
                    icon: Icons.event_available_rounded,
                    title: ref.tr('no_route_today'),
                    message: ref.tr('bins_every_4_days'),
                    action: AppButton(
                      label: ref.tr('refresh'),
                      icon: Icons.refresh_rounded,
                      kind: ButtonKind.outline,
                      height: 48,
                      expand: false,
                      onPressed: () => _refresh(ref),
                    ),
                  ),
                ),
                if (next.isNotEmpty) ...[
                  SectionHeader(ref.tr('next_routes')),
                  for (final (i, t) in next.indexed)
                    Reveal(
                      index: i,
                      child: AppTile(
                        icon: Icons.event_rounded,
                        title: '${t.code} · ${fmtIsoDay(t.date)}',
                        subtitle: ref.tr('route_site_bins',
                            args: {'site': t.codeSite, 'n': '${t.nbBacs}'}),
                        badge: StatusPill(ref.tr('route_planned'),
                            tone: Tone.neutral, icon: Icons.schedule_rounded),
                      ),
                    ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
