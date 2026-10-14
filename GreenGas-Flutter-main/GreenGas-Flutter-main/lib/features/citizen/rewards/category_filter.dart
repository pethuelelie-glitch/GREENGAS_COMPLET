import 'package:flutter/material.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/citizen/rewards/reward_look.dart';
import 'package:greengas/shared/design/design.dart';

/// Filtres de la boutique (maquette Planta « Category ») : pilules défilantes, la sélection se
/// remplit de vert forêt.
class CategoryFilter extends StatelessWidget {
  const CategoryFilter({
    super.key,
    required this.categories,
    required this.selected,
    required this.allLabel,
    required this.labelOf,
    required this.onSelect,
  });

  final List<RecompenseCategorie> categories;
  final RecompenseCategorie? selected;
  final String allLabel;
  final String Function(String key) labelOf;
  final ValueChanged<RecompenseCategorie?> onSelect;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      clipBehavior: Clip.none,
      child: Row(
        children: [
          _Pill(
            label: allLabel,
            icon: Icons.apps_rounded,
            selected: selected == null,
            onTap: () => onSelect(null),
          ),
          for (final cat in categories) ...[
            const SizedBox(width: AppSpacing.sm),
            Builder(builder: (context) {
              final look = RewardLook.of(context, cat);
              return _Pill(
                label: labelOf(look.labelKey),
                icon: look.icon,
                selected: selected == cat,
                onTap: () => onSelect(cat),
              );
            }),
          ],
        ],
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = selected ? c.onPrimary : c.text;
    return Semantics(
      selected: selected,
      inMutuallyExclusiveGroup: true,
      child: Pressable(
        onTap: onTap,
        semanticLabel: label,
        child: AnimatedContainer(
          duration: AppMotion.of(context, AppMotion.base),
          curve: AppMotion.out,
          height: AppSpacing.touch,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          decoration: BoxDecoration(
            color: selected ? c.primary : c.surface,
            borderRadius: BorderRadius.circular(AppRadii.full),
            boxShadow: AppShadows.chip(context.isDark),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: fg),
              const SizedBox(width: 6),
              Text(label,
                  style: Theme.of(context)
                      .textTheme
                      .labelLarge
                      ?.copyWith(color: fg)),
            ],
          ),
        ),
      ),
    );
  }
}
