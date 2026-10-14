import 'package:flutter/material.dart';

/// Logo GreenGas. [white] : version blanche pour les bandeaux verts, couleurs d'origine sinon.
class Logo extends StatelessWidget {
  const Logo({super.key, this.white = false, this.height = 28});
  final bool white;
  final double height;

  @override
  Widget build(BuildContext context) => Image.asset(
        white ? 'assets/images/logo_white.png' : 'assets/images/logo.png',
        height: height,
        fit: BoxFit.contain,
        semanticLabel: 'GreenGas',
      );
}
