import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Squelette de chargement du desktop (`.squelette`) : bloc vert pâle traversé par un reflet
/// (1,4 s, en boucle). Un seul reflet pour tout le groupe, isolé dans un `RepaintBoundary`.
class Skeleton extends StatefulWidget {
  const Skeleton({super.key, required this.child});

  /// Formes du squelette ([SkeletonBox]).
  final Widget child;

  /// Liste de [count] lignes façon tuile, prête à l'emploi.
  static Widget tiles({int count = 3}) => Skeleton(
        child: Column(
          children: [
            for (var i = 0; i < count; i++)
              const Padding(
                padding: EdgeInsets.only(bottom: AppSpacing.md - 2),
                child: SkeletonBox(height: 68, radius: AppRadii.card),
              ),
          ],
        ),
      );

  @override
  State<Skeleton> createState() => _SkeletonState();
}

class _SkeletonState extends State<Skeleton>
    with SingleTickerProviderStateMixin {
  late final _controller =
      AnimationController(vsync: this, duration: AppMotion.shimmer);

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
    final c = context.colors;
    return ExcludeSemantics(
      child: RepaintBoundary(
        child: AnimatedBuilder(
          animation: _controller,
          child: widget.child,
          builder: (_, child) => ShaderMask(
            blendMode: BlendMode.srcATop,
            shaderCallback: (rect) {
              final dx = (_controller.value * 3 - 1) * rect.width;
              return LinearGradient(
                colors: [
                  c.greenPale,
                  c.surface.withValues(alpha: 0.7),
                  c.greenPale,
                ],
                stops: const [0.35, 0.5, 0.65],
              ).createShader(Rect.fromLTWH(
                  dx - rect.width, 0, rect.width * 2, rect.height));
            },
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Une forme de squelette (bloc arrondi vert pâle).
class SkeletonBox extends StatelessWidget {
  const SkeletonBox(
      {super.key, this.width, required this.height, this.radius = AppRadii.md});

  final double? width;
  final double height;
  final double radius;

  @override
  Widget build(BuildContext context) => Container(
        width: width ?? double.infinity,
        height: height,
        decoration: BoxDecoration(
          color: context.colors.greenPale,
          borderRadius: BorderRadius.circular(radius),
        ),
      );
}
