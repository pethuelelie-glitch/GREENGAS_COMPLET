import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/services.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Onglet du dock.
class DockItem {
  const DockItem(this.icon, this.label);
  final IconData icon;
  final String label;
}

/// Dock flottant (élément signature) : pilule détachée des bords, rond actif plein qui glisse vers
/// l'onglet choisi avec un ressort (léger rebond) et s'étire pendant le trajet. Les onglets inactifs
/// sont des icônes dans de petits ronds clairs. Seul le dock se redessine pendant l'animation.
class FloatingDock extends StatefulWidget {
  const FloatingDock({
    super.key,
    required this.index,
    required this.items,
    required this.onSelect,
  });

  final int index;
  final List<DockItem> items;
  final ValueChanged<int> onSelect;

  static const height = 72.0;
  static const _active = 56.0;
  static const _bubble = 44.0;

  /// Rembourrage bas à laisser au contenu qui défile sous le dock.
  static double clearance(BuildContext context) =>
      height + 12 + MediaQuery.paddingOf(context).bottom + AppSpacing.lg;

  @override
  State<FloatingDock> createState() => _FloatingDockState();
}

class _FloatingDockState extends State<FloatingDock>
    with SingleTickerProviderStateMixin {
  late final _position = AnimationController.unbounded(
      vsync: this, value: widget.index.toDouble());

  @override
  void didUpdateWidget(covariant FloatingDock old) {
    super.didUpdateWidget(old);
    if (old.index == widget.index) return;
    final target = widget.index.toDouble();
    if (AppMotion.reduced(context)) {
      _position.value = target;
    } else {
      _position.animateWith(SpringSimulation(
          AppMotion.dockSpring, _position.value, target, _position.velocity));
    }
  }

  @override
  void dispose() {
    _position.dispose();
    super.dispose();
  }

  void _select(int i) {
    if (i == widget.index) return;
    HapticFeedback.selectionClick();
    widget.onSelect(i);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final dark = context.isDark;
    return Padding(
      padding: EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg,
          12 + MediaQuery.paddingOf(context).bottom),
      child: RepaintBoundary(
        child: Container(
          height: FloatingDock.height,
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(AppRadii.full),
            boxShadow: AppShadows.dock(dark),
            border: dark ? Border.all(color: c.border) : null,
          ),
          child: LayoutBuilder(
            builder: (context, box) {
              final slot = box.maxWidth / widget.items.length;
              return AnimatedBuilder(
                animation: _position,
                builder: (context, _) {
                  final v = _position.value;
                  // Étirement : nul sur un onglet, maximal à mi-chemin (morphing du rond).
                  final travel = (v - v.roundToDouble()).abs();
                  final width = FloatingDock._active * (1 + 0.7 * travel);
                  return Stack(
                    children: [
                      Positioned(
                        left: v * slot + (slot - width) / 2,
                        top: (FloatingDock.height - FloatingDock._active) / 2,
                        width: width,
                        height: FloatingDock._active,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: c.primary,
                            borderRadius: BorderRadius.circular(AppRadii.full),
                            boxShadow: AppShadows.floating(dark),
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          for (var i = 0; i < widget.items.length; i++)
                            Expanded(
                              child: _DockButton(
                                item: widget.items[i],
                                selected: i == widget.index,
                                // 1 quand le rond actif est sur cet onglet, 0 dès qu'il s'en éloigne.
                                presence: (1 - (v - i).abs()).clamp(0.0, 1.0),
                                onTap: () => _select(i),
                              ),
                            ),
                        ],
                      ),
                    ],
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}

class _DockButton extends StatelessWidget {
  const _DockButton({
    required this.item,
    required this.selected,
    required this.presence,
    required this.onTap,
  });

  final DockItem item;
  final bool selected;
  final double presence;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final fg = Color.lerp(c.forestInk, c.onPrimary, presence)!;
    return Semantics(
      button: true,
      selected: selected,
      label: item.label,
      excludeSemantics: true,
      child: Tooltip(
        message: item.label,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                Opacity(
                  opacity: 1 - presence,
                  child: Container(
                    width: FloatingDock._bubble,
                    height: FloatingDock._bubble,
                    decoration: BoxDecoration(
                        color: c.greenPale, shape: BoxShape.circle),
                  ),
                ),
                Transform.scale(
                  scale: 1 + 0.12 * presence,
                  child: Icon(item.icon, color: fg, size: 24),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
