import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/pressable.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Panneau blanc arrondi du desktop (`Carte`) : surface, rayon 18, ombre douce, sans bordure.
/// [alert] l'entoure de rouge (élément en alerte). [onTap] le rend pressable.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = AppSpacing.card,
    this.onTap,
    this.color,
    this.alert = false,
    this.radius = AppRadii.card,
    this.semanticLabel,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? color;
  final bool alert;
  final double radius;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final card = Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? c.surface,
        borderRadius: BorderRadius.circular(radius),
        boxShadow: AppShadows.card(context.isDark),
        border: alert ? Border.all(color: c.alert, width: 2) : null,
      ),
      child: child,
    );
    if (onTap == null) return card;
    return Pressable(
      onTap: onTap,
      scale: 0.98,
      semanticLabel: semanticLabel,
      child: card,
    );
  }
}
