import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/typography.dart';

/// Code d'objet (BAC-014, TRN-…) en JetBrains Mono, comme `CodeObjet` du desktop.
class CodeText extends StatelessWidget {
  const CodeText(this.code, {super.key, this.size = 15, this.color});

  final String code;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) => Text(
        code,
        style:
            AppTypography.code(color ?? context.colors.forestInk, size: size),
      );
}
