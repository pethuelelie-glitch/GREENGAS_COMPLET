import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_card.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/icon_bubble.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Ligne d'une liste (dépôt, gain, bac, échange) : rond d'icône, titre, sous-titre, élément à droite.
class AppTile extends StatelessWidget {
  const AppTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.badge,
    this.onTap,
    this.iconColor,
    this.iconBackground,
    this.titleStyle,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;

  /// Pastille sous le sous-titre (statut) : laisse toute la largeur au titre, contrairement à
  /// [trailing].
  final Widget? badge;
  final VoidCallback? onTap;
  final Color? iconColor;
  final Color? iconBackground;
  final TextStyle? titleStyle;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md - 2),
      child: AppCard(
        onTap: onTap,
        semanticLabel: subtitle == null ? title : '$title, $subtitle',
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        child: Row(
          children: [
            IconBubble(
              icon: icon,
              color: iconColor ?? context.colors.forestInk,
              background: iconBackground ?? context.colors.greenPale,
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: titleStyle ?? t.titleSmall),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(subtitle!, style: t.bodySmall),
                  ],
                  if (badge != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    badge!,
                  ],
                ],
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: AppSpacing.sm),
              // L'élément de droite garde sa taille, sans jamais écraser le titre (texte agrandi).
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 132),
                child: trailing,
              ),
            ],
            if (onTap != null && trailing == null)
              Icon(Icons.chevron_right_rounded,
                  color: context.colors.textMuted),
          ],
        ),
      ),
    );
  }
}
