import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Points du carrousel : le point actif s'allonge en pilule. Chaque point se touche (48 px).
class PageDots extends StatelessWidget {
  const PageDots({
    super.key,
    required this.count,
    required this.index,
    required this.onTap,
    required this.labelOf,
  });

  final int count;
  final int index;
  final ValueChanged<int> onTap;
  final String Function(int) labelOf;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        for (var i = 0; i < count; i++)
          Semantics(
            button: true,
            selected: i == index,
            label: labelOf(i),
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => onTap(i),
              child: SizedBox(
                height: AppSpacing.touch,
                child: Center(
                  child: AnimatedContainer(
                    duration: AppMotion.of(context, AppMotion.base),
                    curve: AppMotion.out,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: i == index ? 28 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: i == index ? c.primary : c.border,
                      borderRadius: BorderRadius.circular(AppRadii.full),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
