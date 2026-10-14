import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/features/notifications/notifications_screen.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Cloche des notifications (contrat 1.4.0), comme `Cloche` du desktop : elle oscille quand une
/// notification arrive et sa pastille surgit avec un ressort.
class NotificationBell extends ConsumerStatefulWidget {
  const NotificationBell({super.key});

  @override
  ConsumerState<NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends ConsumerState<NotificationBell>
    with SingleTickerProviderStateMixin {
  late final _swing =
      AnimationController(vsync: this, duration: AppMotion.bell);
  Timer? _poll;

  /// Rotation 0 → −16 → 14 → −10 → 6 → 0° (desktop), autour du haut de la cloche.
  static final _angle = TweenSequence<double>([
    for (final (a, b) in const [
      (0.0, -16.0),
      (-16.0, 14.0),
      (14.0, -10.0),
      (-10.0, 6.0),
      (6.0, 0.0)
    ])
      TweenSequenceItem(tween: Tween(begin: a, end: b), weight: 1),
  ]);

  @override
  void initState() {
    super.initState();
    _poll = Timer.periodic(const Duration(seconds: 20), (_) {
      if (mounted) ref.invalidate(notificationsCountProvider);
    });
  }

  @override
  void dispose() {
    _poll?.cancel();
    _swing.dispose();
    super.dispose();
  }

  Future<void> _open() async {
    await Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const NotificationsScreen()));
    if (mounted) ref.invalidate(notificationsCountProvider);
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(notificationsCountProvider, (prev, next) {
      final before = prev?.valueOrNull ?? 0;
      final now = next.valueOrNull ?? 0;
      if (now > before && !AppMotion.reduced(context)) _swing.forward(from: 0);
    });
    final count = ref.watch(notificationsCountProvider).valueOrNull ?? 0;
    final c = context.colors;
    final label = count > 0
        ? ref.tr('notifications_unread', args: {'n': '$count'})
        : ref.tr('notifications');

    return CircleIconButton(
      icon: Icons.notifications_none_rounded,
      tooltip: label,
      onPressed: _open,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          AnimatedBuilder(
            animation: _swing,
            builder: (_, child) => Transform.rotate(
              angle: _angle.evaluate(_swing) * math.pi / 180,
              alignment: const Alignment(0, -0.8),
              child: child,
            ),
            child:
                Icon(Icons.notifications_none_rounded, color: c.text, size: 24),
          ),
          if (count > 0)
            Positioned(
              top: 6,
              right: 6,
              child: TweenAnimationBuilder<double>(
                key: ValueKey(count),
                tween: Tween(begin: 0.4, end: 1),
                duration:
                    AppMotion.of(context, const Duration(milliseconds: 450)),
                curve: Curves.elasticOut,
                builder: (_, v, child) =>
                    Transform.scale(scale: v, child: child),
                child: Container(
                  constraints:
                      const BoxConstraints(minWidth: 18, minHeight: 18),
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: c.alert,
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: c.surface, width: 1.5),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    count > 9 ? '9+' : '$count',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
