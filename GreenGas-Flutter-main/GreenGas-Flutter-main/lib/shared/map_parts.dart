import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:latlong2/latlong.dart';

/// Fond de carte OpenStreetMap.
class OsmTiles extends StatelessWidget {
  const OsmTiles({super.key});

  @override
  Widget build(BuildContext context) => TileLayer(
        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        userAgentPackageName: 'ci.greengas.app',
      );
}

/// Mention des sources de la carte, à placer en dernier dans les couches.
const osmAttribution = RichAttributionWidget(
  attributions: [TextSourceAttribution('© OpenStreetMap contributors')],
);

/// Position de l'utilisateur : point bleu (série 2 du desktop) cerclé de blanc, qui pulse.
Marker positionMarker(LatLng point) =>
    Marker(point: point, width: 40, height: 40, child: const _PositionDot());

class _PositionDot extends StatelessWidget {
  const _PositionDot();

  @override
  Widget build(BuildContext context) {
    final blue = context.colors.blue;
    return PulseRing(
      color: blue,
      size: 20,
      child: Container(
        width: 18,
        height: 18,
        decoration: BoxDecoration(
          color: blue,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 3),
          boxShadow: AppShadows.chip(context.isDark),
        ),
      ),
    );
  }
}

/// Épingle d'un bac. [highlight] l'agrandit et la fait pulser (bac choisi, prochain bac).
Marker bacMarker(
  LatLng point, {
  required Color color,
  bool highlight = false,
  VoidCallback? onTap,
  String? label,
}) {
  final size = highlight ? 50.0 : 38.0;
  return Marker(
    point: point,
    width: size * 1.9,
    height: size * 1.9,
    child: _BacPin(
        color: color,
        size: size,
        highlight: highlight,
        onTap: onTap,
        label: label),
  );
}

class _BacPin extends StatelessWidget {
  const _BacPin({
    required this.color,
    required this.size,
    required this.highlight,
    this.onTap,
    this.label,
  });

  final Color color;
  final double size;
  final bool highlight;
  final VoidCallback? onTap;
  final String? label;

  @override
  Widget build(BuildContext context) {
    final pin = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 3),
        boxShadow: AppShadows.floating(context.isDark),
      ),
      child: Icon(Icons.delete_rounded, color: Colors.white, size: size * 0.48),
    );
    // Apparition à l'échelle du desktop (`apparitionEchelle`) : 0,6 → 1 avec un ressort vif.
    return Semantics(
      button: onTap != null,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: Center(
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.6, end: 1),
            duration: AppMotion.of(context, AppMotion.snappyCurve.settle),
            curve: AppMotion.snappyCurve,
            builder: (_, v, child) => Transform.scale(scale: v, child: child),
            child: highlight
                ? PulseRing(color: color, size: size, child: pin)
                : pin,
          ),
        ),
      ),
    );
  }
}
