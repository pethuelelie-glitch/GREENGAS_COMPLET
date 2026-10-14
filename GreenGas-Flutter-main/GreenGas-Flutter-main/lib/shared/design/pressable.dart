import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Retour de pression du desktop (`active:scale-[0.97]`) : l'élément s'enfonce légèrement.
/// Le toucher est suivi par un [Listener] : il ne gêne pas les gestes des widgets enfants.
class PressScale extends StatefulWidget {
  const PressScale(
      {super.key, required this.child, this.scale = 0.97, this.enabled = true});

  final Widget child;
  final double scale;
  final bool enabled;

  @override
  State<PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<PressScale> {
  bool _down = false;

  void _set(bool v) {
    if (!widget.enabled || _down == v) return;
    setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) => Listener(
        onPointerDown: (_) => _set(true),
        onPointerUp: (_) => _set(false),
        onPointerCancel: (_) => _set(false),
        child: AnimatedScale(
          scale: _down ? widget.scale : 1,
          duration: AppMotion.of(context, AppMotion.press),
          curve: Curves.easeOut,
          child: widget.child,
        ),
      );
}

/// Zone pressable sans habillage Material (cartes, tuiles) : réduction au toucher + action.
class Pressable extends StatelessWidget {
  const Pressable({
    super.key,
    required this.child,
    this.onTap,
    this.scale = 0.97,
    this.semanticLabel,
    this.haptic = false,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final String? semanticLabel;

  /// Petite vibration au toucher (actions importantes : scan, échange).
  final bool haptic;

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Semantics(
      button: enabled,
      enabled: enabled,
      label: semanticLabel,
      child: PressScale(
        scale: scale,
        enabled: enabled,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: enabled
              ? () {
                  if (haptic) HapticFeedback.lightImpact();
                  onTap!();
                }
              : null,
          child: child,
        ),
      ),
    );
  }
}
