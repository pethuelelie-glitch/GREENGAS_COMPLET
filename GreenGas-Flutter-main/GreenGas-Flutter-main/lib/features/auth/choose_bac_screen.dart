import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/core/geo.dart';
import 'package:greengas/core/location.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/auth/scan_bac_page.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/map_parts.dart';
import 'package:latlong2/latlong.dart';

/// À l'inscription, le citoyen n'a pas besoin de scanner un bac : une carte lui montre les bacs
/// autour de lui (le plus proche est présélectionné) et il touche le sien.
/// Renvoie le [BacPublic] choisi.
class ChooseBacScreen extends ConsumerStatefulWidget {
  const ChooseBacScreen({super.key});

  @override
  ConsumerState<ChooseBacScreen> createState() => _ChooseBacScreenState();
}

class _ChooseBacScreenState extends ConsumerState<ChooseBacScreen> {
  bool _loading = true;
  bool _notFound = false;
  String? _error;
  UserLocation? _loc;
  List<BacPublic> _bacs = const [];
  BacPublic? _selected;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _notFound = false;
    });
    try {
      final loc = await LocationService.currentOrDemo();
      final bacs = await ref.read(bacRepoProvider).proches(loc.lat, loc.lng);
      if (!mounted) return;
      setState(() {
        _loc = loc;
        _bacs = bacs;
        _selected = bacs.isEmpty ? null : bacs.first;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        // Route pas encore déployée (404) : on propose directement le scan du QR.
        _notFound = e is ApiException && e.status == 404;
        _error = friendlyError(e);
        _loading = false;
      });
    }
  }

  double? _distance(BacPublic b) {
    if (b.distanceM != null) return b.distanceM;
    final loc = _loc;
    if (loc == null || b.latitude == null || b.longitude == null) return null;
    return distanceMeters(loc.lat, loc.lng, b.latitude!, b.longitude!);
  }

  Future<void> _scanInstead() async {
    final code = await scanBacCode(context);
    if (code != null && mounted) {
      Navigator.of(context).pop(BacPublic(code: code, residence: ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final scan = AppButton(
      label: ref.tr('scan_instead'),
      icon: Icons.qr_code_scanner_rounded,
      kind: ButtonKind.outline,
      onPressed: _scanInstead,
    );
    return PageScaffold(
      title: ref.tr('choose_bac_title'),
      bottom: _loading || _error != null
          ? null
          : AppButton(
              label: ref.tr('choose_this'),
              icon: Icons.check_rounded,
              onPressed: _selected == null
                  ? null
                  : () => Navigator.of(context).pop(_selected),
            ),
      children: [
        if (_loading) ...[
          const Skeleton(
              child: SkeletonBox(height: 280, radius: AppRadii.card)),
          const SizedBox(height: AppSpacing.lg),
          Skeleton.tiles(),
        ] else if (_notFound)
          EmptyState(
            icon: Icons.map_rounded,
            message: ref.tr('bacs_notfound'),
            action: scan,
          )
        else if (_error != null) ...[
          ErrorState(
            message: '${ref.tr('bacs_error')}\n$_error',
            onRetry: _load,
            retryLabel: ref.tr('retry'),
          ),
          const SizedBox(height: AppSpacing.lg),
          scan,
        ] else ...[
          Reveal(child: _map()),
          if (_loc!.isFallback) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(ref.tr('demo_position'),
                style: Theme.of(context).textTheme.bodySmall),
          ],
          SectionHeader(ref.tr('choose_bac_hint')),
          for (var i = 0; i < _bacs.length; i++)
            Reveal(index: i + 1, child: _tile(_bacs[i], nearest: i == 0)),
          const SizedBox(height: AppSpacing.sm),
          TextButton.icon(
            onPressed: _scanInstead,
            icon: const Icon(Icons.qr_code_scanner_rounded),
            label: Text(ref.tr('scan_instead')),
          ),
        ],
      ],
    );
  }

  Widget _map() {
    final loc = _loc!;
    final c = context.colors;
    final withCoords =
        _bacs.where((b) => b.latitude != null && b.longitude != null).toList();
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadii.card),
      child: SizedBox(
        height: 280,
        child: FlutterMap(
          options: MapOptions(
            initialCameraFit: CameraFit.coordinates(
              coordinates: [
                LatLng(loc.lat, loc.lng),
                for (final b in withCoords.take(4))
                  LatLng(b.latitude!, b.longitude!),
              ],
              padding: const EdgeInsets.all(56),
              maxZoom: 17,
            ),
          ),
          children: [
            const OsmTiles(),
            MarkerLayer(
              markers: [
                positionMarker(LatLng(loc.lat, loc.lng)),
                for (final b in withCoords)
                  bacMarker(
                    LatLng(b.latitude!, b.longitude!),
                    color: b.code == _selected?.code ? c.alert : c.forest,
                    highlight: b.code == _selected?.code,
                    label: b.residence.isEmpty ? b.code : b.residence,
                    onTap: () => setState(() => _selected = b),
                  ),
              ],
            ),
            osmAttribution,
          ],
        ),
      ),
    );
  }

  Widget _tile(BacPublic b, {required bool nearest}) {
    final selected = b.code == _selected?.code;
    final d = _distance(b);
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final name = b.residence.isEmpty ? b.code : b.residence;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md - 2),
      child: Semantics(
        inMutuallyExclusiveGroup: true,
        selected: selected,
        child: AppCard(
          onTap: () => setState(() => _selected = b),
          color: selected ? c.greenPale : null,
          padding: const EdgeInsets.all(AppSpacing.md + 2),
          semanticLabel: name,
          child: Row(
            children: [
              AnimatedSwitcher(
                duration: AppMotion.of(context, AppMotion.fast),
                child: Icon(
                  selected
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_unchecked_rounded,
                  key: ValueKey(selected),
                  color: selected ? c.green : c.textMuted,
                  size: 26,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: t.titleSmall),
                    Row(
                      children: [
                        CodeText(b.code, size: 13),
                        if (d != null)
                          Flexible(
                            child: Text(
                                '  ·  ${ref.tr('from_you', args: {
                                      'd': fmtDistance(d)
                                    })}',
                                overflow: TextOverflow.ellipsis,
                                style: t.bodySmall),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              if (nearest)
                StatusPill(ref.tr('nearest'), icon: Icons.near_me_rounded),
            ],
          ),
        ),
      ),
    );
  }
}
