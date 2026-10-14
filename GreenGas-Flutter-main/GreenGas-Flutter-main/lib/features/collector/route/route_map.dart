import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/location.dart';
import 'package:greengas/core/routing_osrm.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/collector/route/bac_line.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/map_parts.dart';
import 'package:latlong2/latlong.dart';

/// Carte de la tournée : itinéraire OSRM (tournée en cours), épingles colorées par état,
/// prochain bac qui pulse. Toucher une épingle ouvre la fiche du bac.
class RouteMap extends ConsumerStatefulWidget {
  const RouteMap({
    super.key,
    required this.location,
    required this.lines,
    required this.statut,
    required this.onTap,
  });

  final UserLocation location;
  final List<BacLine> lines;
  final StatutTournee statut;
  final void Function(BacLine) onTap;

  @override
  ConsumerState<RouteMap> createState() => _RouteMapState();
}

class _RouteMapState extends ConsumerState<RouteMap> {
  List<LatLng> _route = const [];
  bool _routeLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.statut == StatutTournee.enCours && widget.lines.isNotEmpty) {
      Future.microtask(_loadRoute);
    }
  }

  @override
  void didUpdateWidget(covariant RouteMap old) {
    super.didUpdateWidget(old);
    if (widget.statut == StatutTournee.enCours &&
        widget.lines.isNotEmpty &&
        (old.statut != widget.statut ||
            old.lines.length != widget.lines.length)) {
      Future.microtask(_loadRoute);
    }
  }

  /// Itinéraire : position actuelle puis les bacs dans l'ordre de la liste (les plus proches d'abord).
  Future<void> _loadRoute() async {
    setState(() => _routeLoading = true);
    try {
      final r = await OsrmRouter.route([
        LatLng(widget.location.lat, widget.location.lng),
        for (final l in widget.lines) LatLng(l.bac.latitude, l.bac.longitude),
      ]);
      if (mounted) setState(() => _route = r);
    } catch (_) {
      // Sans itinéraire, la carte reste utile avec les épingles.
    } finally {
      if (mounted) setState(() => _routeLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final next =
        widget.lines.where((l) => l.etat == BacEtat.aCollecter).firstOrNull;
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadii.card),
      child: SizedBox(
        height: 300,
        child: Stack(
          children: [
            FlutterMap(
              options: MapOptions(
                initialCameraFit: CameraFit.coordinates(
                  coordinates: [
                    LatLng(widget.location.lat, widget.location.lng),
                    for (final l in widget.lines)
                      LatLng(l.bac.latitude, l.bac.longitude),
                  ],
                  padding: const EdgeInsets.all(48),
                  maxZoom: 17,
                ),
              ),
              children: [
                const OsmTiles(),
                if (_route.isNotEmpty)
                  PolylineLayer(polylines: [
                    Polyline(
                      points: _route,
                      color: c.forest,
                      strokeWidth: 5,
                      borderColor: Colors.white,
                      borderStrokeWidth: 2,
                    ),
                  ]),
                MarkerLayer(
                  markers: [
                    positionMarker(
                        LatLng(widget.location.lat, widget.location.lng)),
                    for (final l in widget.lines)
                      bacMarker(
                        LatLng(l.bac.latitude, l.bac.longitude),
                        color: l.etat.pinColor(c),
                        highlight: identical(l, next),
                        label: '${l.bac.code}, ${ref.tr(l.etat.labelKey)}',
                        onTap: () => widget.onTap(l),
                      ),
                  ],
                ),
                osmAttribution,
              ],
            ),
            if (_routeLoading)
              Positioned(
                top: AppSpacing.md,
                left: AppSpacing.md,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(AppRadii.full),
                    boxShadow: AppShadows.chip(context.isDark),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox.square(
                          dimension: 14,
                          child: CircularProgressIndicator(strokeWidth: 2)),
                      const SizedBox(width: AppSpacing.sm),
                      Text(ref.tr('route_loading'),
                          style: Theme.of(context).textTheme.labelMedium),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
