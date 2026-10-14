import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/pressable.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Bouton pilule avec rond-flèche à gauche (landing et échange, comme la maquette Planta).
class ArrowPillButton extends StatelessWidget {
  const ArrowPillButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
    this.icon = Icons.arrow_forward_rounded,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool busy;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onPressed != null && !busy;
    return Pressable(
      onTap: enabled ? onPressed : null,
      haptic: true,
      semanticLabel: label,
      child: AnimatedOpacity(
        opacity: enabled || busy ? 1 : 0.45,
        duration: AppMotion.of(context, AppMotion.fast),
        child: Container(
          height: 64,
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: c.primary,
            borderRadius: BorderRadius.circular(AppRadii.full),
            boxShadow: AppShadows.floating(context.isDark),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: c.onPrimary,
                  shape: BoxShape.circle,
                ),
                child: busy
                    ? Padding(
                        padding: const EdgeInsets.all(14),
                        child: CircularProgressIndicator(
                            strokeWidth: 2.4, color: c.primary),
                      )
                    : Icon(icon, color: c.primary),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 48),
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .labelLarge
                        ?.copyWith(color: c.onPrimary, fontSize: 16.5),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
