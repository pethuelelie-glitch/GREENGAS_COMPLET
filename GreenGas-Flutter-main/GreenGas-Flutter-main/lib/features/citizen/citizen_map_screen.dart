import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/core/location.dart';
import 'package:greengas/core/maps.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/map_parts.dart';
import 'package:latlong2/latlong.dart';

/// Carte citoyenne : le bac choisi (qui pulse), les bacs des alentours et l'itinéraire Google Maps.
class CitizenMapScreen extends ConsumerStatefulWidget {
  const CitizenMapScreen({super.key});

  @override
  ConsumerState<CitizenMapScreen> createState() => _CitizenMapScreenState();
}

class _CitizenMapScreenState extends ConsumerState<CitizenMapScreen> {
  UserLocation? _loc;
  BacPublic? _chosen;
  List<BacPublic> _proches = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final myCode = ref.read(sessionProvider)?.profilCitoyen?.codeBac;
      final loc = await LocationService.currentOrDemo();
      final bacs = await ref.read(bacRepoProvider).proches(loc.lat, loc.lng);
      final chosen = bacs.where((b) => b.code == myCode).firstOrNull;
      if (!mounted) return;
      setState(() {
        _loc = loc;
        _proches = bacs;
        _chosen = chosen ?? bacs.firstOrNull;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = friendlyError(e);
        _loading = false;
      });
    }
  }

  Future<void> _openGoogleMaps(BacPublic b) async {
    final ok = await ouvrirItineraireGoogleMaps(b.latitude!, b.longitude!);
    if (!ok && mounted) {
      showToast(context, ref.tr('open_gmaps_error'), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final chosen = _chosen;
    final others = _proches.where((b) => b.code != chosen?.code).toList();
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: EdgeInsets.only(bottom: FloatingDock.clearance(context)),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          AppHeader(title: ref.tr('nav_map')),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_loading)
                  const Skeleton(
                      child: SkeletonBox(height: 320, radius: AppRadii.card))
                else if (_error != null)
                  ErrorState(
                    message: '${ref.tr('map_load_error')}\n$_error',
                    onRetry: _load,
                    retryLabel: ref.tr('retry'),
                  )
                else ...[
                  Reveal(child: _map()),
                  if (chosen != null) ...[
                    SectionHeader(ref.tr('chosen_bac')),
                    Reveal(index: 1, child: _bacTile(chosen, mine: true)),
                  ],
                  SectionHeader(ref.tr('nearby_bins')),
                  if (others.isEmpty)
                    EmptyState(
                        compact: true,
                        icon: Icons.location_off_rounded,
                        message: ref.tr('no_nearby_bins'))
                  else
                    for (final (i, b) in others.indexed)
                      Reveal(index: i + 2, child: _bacTile(b)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _map() {
    final c = context.colors;
    final chosen = _chosen;
    final hasChosenCoords =
        chosen?.latitude != null && chosen?.longitude != null;
    final center = hasChosenCoords
        ? LatLng(chosen!.latitude!, chosen.longitude!)
        : LatLng(_loc!.lat, _loc!.lng);
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadii.card),
      child: SizedBox(
        height: 320,
        child: Stack(
          children: [
            FlutterMap(
              options: MapOptions(initialCenter: center, initialZoom: 15),
              children: [
                const OsmTiles(),
                MarkerLayer(
                  markers: [
                    positionMarker(LatLng(_loc!.lat, _loc!.lng)),
                    for (final b in _proches)
                      if (b.latitude != null && b.longitude != null)
                        bacMarker(
                          LatLng(b.latitude!, b.longitude!),
                          color: b.code == chosen?.code ? c.alert : c.forest,
                          highlight: b.code == chosen?.code,
                          label: b.residence.isEmpty ? b.code : b.residence,
                        ),
                  ],
                ),
                osmAttribution,
              ],
            ),
            if (hasChosenCoords)
              Positioned(
                right: AppSpacing.md,
                top: AppSpacing.md,
                child: AppButton(
                  label: ref.tr('directions'),
                  icon: Icons.navigation_rounded,
                  expand: false,
                  height: 48,
                  onPressed: () => _openGoogleMaps(chosen!),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _bacTile(BacPublic b, {bool mine = false}) {
    final c = context.colors;
    final d = b.distanceM;
    return AppTile(
      icon: mine ? Icons.home_rounded : Icons.delete_rounded,
      iconColor: mine ? Colors.white : c.forestInk,
      iconBackground: mine ? c.alert : c.greenPale,
      title: b.residence.isEmpty ? b.code : b.residence,
      subtitle: d == null
          ? b.code
          : '${b.code} · ${ref.tr('from_you', args: {'d': fmtDistance(d)})}',
      trailing: b.latitude == null
          ? null
          : CircleIconButton(
              icon: Icons.directions_rounded,
              tooltip: ref.tr('open_gmaps'),
              onPressed: () => _openGoogleMaps(b),
            ),
    );
  }
}
