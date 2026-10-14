import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/pressable.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Titre de section, avec un lien pilule à droite (« Voir tout »), comme la maquette Planta.
class SectionHeader extends StatelessWidget {
  const SectionHeader(
    this.title, {
    super.key,
    this.actionLabel,
    this.onAction,
    this.padding =
        const EdgeInsets.fromLTRB(0, AppSpacing.xxl, 0, AppSpacing.md),
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Padding(
      padding: padding,
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text(title, style: t.titleLarge),
            ),
          ),
          if (actionLabel != null && onAction != null)
            Pressable(
              onTap: onAction,
              semanticLabel: actionLabel,
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: AppSpacing.touch),
                child: Center(
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    decoration: BoxDecoration(
                      color: c.surface,
                      borderRadius: BorderRadius.circular(AppRadii.full),
                      boxShadow: AppShadows.chip(context.isDark),
                    ),
                    child: Text(actionLabel!,
                        style: t.labelMedium?.copyWith(color: c.forestInk)),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
