import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Choix en segments du desktop (`ChoixSegmente`) : une pastille glisse vers l'option choisie
/// avec un ressort. Options de même largeur ; zone tactile de 48 px.
class SegmentedChoice<T> extends StatelessWidget {
  const SegmentedChoice({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    required this.labelOf,
  });

  final List<T> options;
  final T value;
  final ValueChanged<T> onChanged;
  final String Function(T) labelOf;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final index = options.indexOf(value).clamp(0, options.length - 1);
    const spring = AppMotion.snappyCurve;
    return Container(
      height: 56,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: c.greenPale,
        borderRadius: BorderRadius.circular(AppRadii.full),
      ),
      child: LayoutBuilder(
        builder: (context, box) {
          final w = box.maxWidth / options.length;
          return Stack(
            children: [
              AnimatedPositioned(
                duration: AppMotion.of(context, spring.settle),
                curve: spring,
                left: index * w,
                top: 0,
                bottom: 0,
                width: w,
                child: Container(
                  decoration: BoxDecoration(
                    color: c.primary,
                    borderRadius: BorderRadius.circular(AppRadii.full),
                    boxShadow: AppShadows.chip(context.isDark),
                  ),
                ),
              ),
              Row(
                children: [
                  for (final o in options)
                    Expanded(
                      child: Semantics(
                        inMutuallyExclusiveGroup: true,
                        selected: o == value,
                        button: true,
                        child: GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: () => onChanged(o),
                          child: Center(
                            child: AnimatedDefaultTextStyle(
                              duration: AppMotion.of(context, AppMotion.fast),
                              style: t.labelLarge!.copyWith(
                                  color:
                                      o == value ? c.onPrimary : c.textMuted),
                              child: Text(labelOf(o),
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}
