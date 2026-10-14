import 'dart:async';

import 'package:flutter/material.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Apparition du desktop (`apparition`) : l'élément monte de [offset] px en apparaissant.
/// [index] décale l'entrée pour une cascade (60 ms par élément, plafonné à 8).
/// Joue une seule fois, au montage ; rien ne bouge si les animations sont désactivées.
class Reveal extends StatefulWidget {
  const Reveal({
    super.key,
    required this.child,
    this.index = 0,
    this.offset = 14,
    this.duration = AppMotion.reveal,
    this.step = const Duration(milliseconds: 60),
  });

  final Widget child;
  final int index;
  final double offset;
  final Duration duration;
  final Duration step;

  @override
  State<Reveal> createState() => _RevealState();
}

class _RevealState extends State<Reveal> with SingleTickerProviderStateMixin {
  late final _controller =
      AnimationController(vsync: this, duration: widget.duration);
  late final _curve =
      CurvedAnimation(parent: _controller, curve: AppMotion.out);
  Timer? _delay;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_started) return;
    _started = true;
    if (AppMotion.reduced(context)) {
      _controller.value = 1;
      return;
    }
    final wait = widget.step * widget.index.clamp(0, 8);
    if (wait == Duration.zero) {
      _controller.forward();
    } else {
      _delay = Timer(wait, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _delay?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _curve,
        child: widget.child,
        builder: (_, child) => Opacity(
          opacity: _curve.value,
          child: Transform.translate(
            offset: Offset(0, widget.offset * (1 - _curve.value)),
            child: child,
          ),
        ),
      );
}
