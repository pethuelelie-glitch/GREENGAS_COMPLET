import 'package:flutter/material.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Pulsation du desktop (`animate-pulsation`) : un anneau grossit (×1,9) en s'effaçant, 2 s en boucle.
/// Marque un élément « vivant » (bac choisi, logo). Fixe si les animations sont désactivées.
class PulseRing extends StatefulWidget {
  const PulseRing({
    super.key,
    required this.color,
    required this.size,
    this.child,
    this.strokeWidth = 2,
  });

  final Color color;
  final double size;
  final Widget? child;
  final double strokeWidth;

  @override
  State<PulseRing> createState() => _PulseRingState();
}

class _PulseRingState extends State<PulseRing>
    with SingleTickerProviderStateMixin {
  late final _controller =
      AnimationController(vsync: this, duration: AppMotion.pulse);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (AppMotion.reduced(context)) {
      _controller.stop();
    } else if (!_controller.isAnimating) {
      _controller.repeat();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ring = Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: widget.color, width: widget.strokeWidth),
      ),
    );
    return SizedBox.square(
      dimension: widget.size * 1.9,
      child: Stack(
        alignment: Alignment.center,
        children: [
          RepaintBoundary(
            child: AnimatedBuilder(
              animation: _controller,
              child: ring,
              builder: (_, child) {
                final v = Curves.easeOut.transform(_controller.value);
                return Opacity(
                  opacity: (0.9 * (1 - v)).clamp(0, 1),
                  child: Transform.scale(scale: 1 + 0.9 * v, child: child),
                );
              },
            ),
          ),
          if (widget.child != null) widget.child!,
        ],
      ),
    );
  }
}
