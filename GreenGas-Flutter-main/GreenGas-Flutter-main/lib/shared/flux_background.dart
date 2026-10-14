import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Fond décoratif du desktop (`FondFlux`) : des flux de collecte en pointillés convergent
/// lentement vers un point (le bac, le digesteur). Isolé dans un `RepaintBoundary` ; immobile si
/// le téléphone demande moins d'animations.
class FluxBackground extends StatefulWidget {
  const FluxBackground({super.key, this.focus = const Alignment(0, -0.1)});

  /// Point de convergence des flux.
  final Alignment focus;

  @override
  State<FluxBackground> createState() => _FluxBackgroundState();
}

class _FluxBackgroundState extends State<FluxBackground>
    with SingleTickerProviderStateMixin {
  late final _flow = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 2800));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (AppMotion.reduced(context)) {
      _flow.stop();
    } else if (!_flow.isAnimating) {
      _flow.repeat();
    }
  }

  @override
  void dispose() {
    _flow.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
        child: RepaintBoundary(
          child: CustomPaint(
            size: Size.infinite,
            painter: _FluxPainter(
              progress: _flow,
              color: context.colors.green,
              focus: widget.focus,
            ),
          ),
        ),
      );
}

class _FluxPainter extends CustomPainter {
  _FluxPainter(
      {required this.progress, required this.color, required this.focus})
      : super(repaint: progress);

  final Animation<double> progress;
  final Color color;
  final Alignment focus;

  /// Départs des flux, en fractions de l'écran (hors champ pour certains).
  static const _starts = [
    Offset(-0.1, 0.05),
    Offset(0.3, -0.08),
    Offset(1.1, 0.12),
    Offset(1.08, 0.62),
    Offset(-0.08, 0.7),
    Offset(0.75, 1.05),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final target = focus.alongSize(size);
    final line = Paint()
      ..color = color.withValues(alpha: 0.22)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < _starts.length; i++) {
      final s = Offset(_starts[i].dx * size.width, _starts[i].dy * size.height);
      final mid = Offset.lerp(s, target, 0.5)!;
      final bend = Offset((i.isEven ? 1 : -1) * size.width * 0.12, 0);
      final path = Path()
        ..moveTo(s.dx, s.dy)
        ..quadraticBezierTo(
            mid.dx + bend.dx, mid.dy + bend.dy, target.dx, target.dy);
      // Les pointillés avancent vers la cible (tiret 4, espace 14 comme le desktop).
      final shift = (progress.value + i * 0.17) % 1 * 18;
      for (final metric in path.computeMetrics()) {
        for (var d = shift; d < metric.length; d += 18) {
          canvas.drawPath(metric.extractPath(d, d + 4), line);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _FluxPainter old) =>
      old.color != color || old.focus != focus;
}
