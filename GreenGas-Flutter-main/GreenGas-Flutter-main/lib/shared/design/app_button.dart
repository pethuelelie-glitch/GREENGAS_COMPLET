import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/pressable.dart';

enum ButtonKind {
  /// Plein, couleur d'action (vert forêt en clair).
  primary,

  /// Contour vert forêt (`contour` du desktop).
  outline,

  /// Plein rouge (déconnexion, action destructrice).
  danger,

  /// Blanc sur fond vert forêt (bannières).
  light,
}

/// Bouton pilule du desktop, 56 px de haut, réduit au toucher. [busy] affiche un indicateur
/// et désactive le bouton pendant un envoi (`enCours`).
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.kind = ButtonKind.primary,
    this.busy = false,
    this.expand = true,
    this.height = 56,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final ButtonKind kind;
  final bool busy;
  final bool expand;
  final double height;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (bg, fg, border) = switch (kind) {
      ButtonKind.primary => (c.primary, c.onPrimary, null),
      ButtonKind.outline => (c.surface, c.forestInk, c.forestInk),
      ButtonKind.danger => (c.alert, Colors.white, null),
      ButtonKind.light => (Colors.white, c.forest, null),
    };
    final enabled = onPressed != null && !busy;
    final style = ButtonStyle(
      minimumSize:
          WidgetStatePropertyAll(Size(expand ? double.infinity : 64, height)),
      backgroundColor: WidgetStatePropertyAll(
          enabled || busy ? bg : bg.withValues(alpha: 0.45)),
      foregroundColor: WidgetStatePropertyAll(fg),
      overlayColor: WidgetStatePropertyAll(fg.withValues(alpha: 0.08)),
      side: WidgetStatePropertyAll(border == null
          ? BorderSide.none
          : BorderSide(color: border, width: 1.5)),
    );
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (busy)
          SizedBox.square(
            dimension: 20,
            child: CircularProgressIndicator(strokeWidth: 2.4, color: fg),
          )
        else if (icon != null)
          Icon(icon, size: 21),
        if (busy || icon != null) const SizedBox(width: 10),
        Flexible(
          child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
    return PressScale(
      enabled: enabled,
      child: Semantics(
        liveRegion: busy,
        child: FilledButton(
          onPressed: enabled ? onPressed : null,
          style: style,
          child: content,
        ),
      ),
    );
  }
}
