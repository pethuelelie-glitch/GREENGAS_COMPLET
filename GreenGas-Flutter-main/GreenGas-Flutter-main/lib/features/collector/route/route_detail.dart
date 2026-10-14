import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/core/location.dart';
import 'package:greengas/core/maps.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/collector/route/bac_line.dart';
import 'package:greengas/features/collector/route/bin_sheet.dart';
import 'package:greengas/features/collector/route/next_bin_card.dart';
import 'package:greengas/features/collector/route/route_banner.dart';
import 'package:greengas/features/collector/route/route_map.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';

/// Tournée du jour : bannière de progression, action (démarrer, clôturer), prochain bac, carte,
/// puis la liste des bacs (à collecter d'abord, du plus proche au plus loin).
class RouteDetail extends ConsumerStatefulWidget {
  const RouteDetail({super.key, required this.summary});
  final Tournee summary;

  @override
  ConsumerState<RouteDetail> createState() => _RouteDetailState();
}

class _RouteDetailState extends ConsumerState<RouteDetail> {
  bool _busy = false;

  Future<void> _action(Future<Tournee> Function() run) async {
    setState(() => _busy = true);
    try {
      await run();
      ref.invalidate(tourneesDuJourProvider);
      ref.invalidate(tourneeDetailProvider(widget.summary.id));
    } catch (e) {
      if (!mounted) return;
      await showResultSheet(context,
          tone: Tone.alert,
          title: ref.tr('action_failed'),
          message: friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _directions(BacLine l) async {
    final ok =
        await ouvrirItineraireGoogleMaps(l.bac.latitude, l.bac.longitude);
    if (!ok && mounted) {
      showToast(context, ref.tr('open_gmaps_error'), error: true);
    }
  }

  Future<void> _refresh() async {
    ref.invalidate(tourneesDuJourProvider);
    ref.invalidate(tourneeDetailProvider(widget.summary.id));
    await ref.read(tourneeDetailProvider(widget.summary.id).future);
  }

  List<BacLine> _lines(Tournee t, UserLocation? location) {
    if (location == null) return const [];
    final byCode = {for (final c in t.collectes) c.codeBac: c};
    final lines = [
      for (final b in t.bacs)
        BacLine(
            b,
            byCode[b.code],
            LocationService.meters(
                location.lat, location.lng, b.latitude, b.longitude)),
    ];
    lines.sort((a, b) {
      final byEtat = (a.etat == BacEtat.collecte ? 1 : 0)
          .compareTo(b.etat == BacEtat.collecte ? 1 : 0);
      return byEtat != 0 ? byEtat : a.metres.compareTo(b.metres);
    });
    return lines;
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(tourneeDetailProvider(widget.summary.id));
    final location = ref.watch(userLocationProvider).valueOrNull;
    final t = detail.valueOrNull ?? widget.summary;
    final repo = ref.read(tourneeRepoProvider);
    final lines = _lines(t, location);
    final next = lines.where((l) => l.etat == BacEtat.aCollecter).firstOrNull;
    final allDone = t.bacs.isNotEmpty && t.nbBacsCollectes == t.nbBacs;
    final details = ref.tr('route_site', args: {'site': t.codeSite}) +
        (t.poidsCollecteKg > 0 ? ' · ${fmtKg(t.poidsCollecteKg)}' : '');

    return RefreshIndicator(
      onRefresh: _refresh,
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
                Reveal(
                  child: RouteBanner(
                    code: t.code,
                    date: fmtIsoDay(t.date),
                    status: ref.tr(tourneeStatusKey(t.statut)),
                    collected: t.nbBacsCollectes,
                    total: t.nbBacs,
                    collectedLabel: ref.tr('bins_collected'),
                    details: details,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                if (t.statut == StatutTournee.planifiee)
                  AppButton(
                    label: ref.tr('start_route'),
                    icon: Icons.play_arrow_rounded,
                    busy: _busy,
                    onPressed: () => _action(() => repo.demarrer(t.id)),
                  ),
                if (t.statut == StatutTournee.enCours && allDone)
                  AppButton(
                    label: ref.tr('finish_route'),
                    icon: Icons.flag_rounded,
                    busy: _busy,
                    onPressed: () => _action(() => repo.cloturer(t.id)),
                  ),
                if (t.statut == StatutTournee.enCours &&
                    !allDone &&
                    next != null)
                  Reveal(
                    index: 1,
                    child: NextBinCard(
                        line: next, onDirections: () => _directions(next)),
                  ),
                if (t.statut == StatutTournee.collectee ||
                    t.statut == StatutTournee.triee)
                  NoticeBanner(
                    text: ref.tr(t.statut == StatutTournee.collectee
                        ? 'route_done_text'
                        : 'route_sorted_text'),
                    tone: Tone.ok,
                  ),
                if (location != null && t.bacs.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.lg),
                  Reveal(
                    index: 2,
                    child: RouteMap(
                      location: location,
                      lines: lines,
                      statut: t.statut,
                      onTap: (l) => showBinSheet(context, l),
                    ),
                  ),
                ],
                SectionHeader(ref.tr('route_bins')),
                if (detail.isLoading && t.bacs.isEmpty)
                  Skeleton.tiles()
                else
                  for (final (i, l) in lines.indexed)
                    Reveal(
                      index: i,
                      offset: 8,
                      duration: AppMotion.row,
                      step: const Duration(milliseconds: 35),
                      child: AppTile(
                        icon: Icons.delete_rounded,
                        iconColor: Colors.white,
                        iconBackground: l.etat.pinColor(context.colors),
                        title: '${l.bac.code} · ${l.bac.residence}',
                        subtitle:
                            '${fmtDistance(l.metres)} · ${ref.tr('scans_since_last', args: {
                              'n': '${l.bac.scansValidesPeriode}'
                            })}',
                        badge: StatusPill(ref.tr(l.etat.labelKey),
                            tone: l.etat.tone),
                        onTap: () => showBinSheet(context, l),
                      ),
                    ),
                const SizedBox(height: AppSpacing.sm),
                Text(ref.tr('bins_every_4_days'),
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
