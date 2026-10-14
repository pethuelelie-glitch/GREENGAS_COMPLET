import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// « Qui reçoit ? » : son propre numéro ou celui d'un proche (forfait internet, crédit d'appel).
class RecipientPicker extends ConsumerWidget {
  const RecipientPicker({
    super.key,
    required this.forOther,
    required this.onChanged,
    required this.controller,
    required this.myNumber,
  });

  final bool forOther;
  final ValueChanged<bool> onChanged;
  final TextEditingController controller;
  final String myNumber;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SegmentedChoice<bool>(
          options: const [false, true],
          value: forOther,
          onChanged: onChanged,
          labelOf: (o) => ref.tr(o ? 'other_number' : 'my_number'),
        ),
        const SizedBox(height: AppSpacing.md),
        AnimatedSize(
          duration: AppMotion.of(context, AppMotion.base),
          curve: AppMotion.out,
          alignment: Alignment.topCenter,
          child: forOther
              ? AppTextField(
                  controller: controller,
                  label: ref.tr('phone'),
                  hint: '07 01 02 03 04',
                  prefixText: '+225 ',
                  prefixIcon: Icons.phone_rounded,
                  keyboardType: TextInputType.phone,
                  autofocus: true,
                )
              : Row(
                  children: [
                    Icon(Icons.phone_iphone_rounded, color: c.forestInk),
                    const SizedBox(width: AppSpacing.sm),
                    // Le numéro n'est jamais tronqué : il se réduit si le texte est agrandi.
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child:
                            Text(displayPhone(myNumber), style: t.titleMedium),
                      ),
                    ),
                  ],
                ),
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.info_outline_rounded, size: 18, color: c.textMuted),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: Text(ref.tr('number_hint'), style: t.bodySmall)),
          ],
        ),
      ],
    );
  }
}
