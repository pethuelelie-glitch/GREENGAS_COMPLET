import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/pressable.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Bouton rond (retour, cloche, partage) : surface blanche et ombre de puce, 48 px.
class CircleIconButton extends StatelessWidget {
  const CircleIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    required this.tooltip,
    this.background,
    this.foreground,
    this.size = 48,
    this.child,
  });

  final IconData icon;
  final VoidCallback? onPressed;
  final String tooltip;
  final Color? background;
  final Color? foreground;
  final double size;

  /// Contenu à la place de l'icône (icône animée, pastille…).
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Tooltip(
      message: tooltip,
      child: Pressable(
        onTap: onPressed,
        scale: 0.92,
        semanticLabel: tooltip,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: background ?? c.surface,
            shape: BoxShape.circle,
            boxShadow:
                background == null ? AppShadows.chip(context.isDark) : null,
          ),
          child: child ??
              Icon(icon, color: foreground ?? c.text, size: size * 0.46),
        ),
      ),
    );
  }
}
