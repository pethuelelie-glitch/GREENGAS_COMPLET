import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// « Mes échanges » : récompenses obtenues, avec le numéro qui a reçu le forfait ou le crédit.
class ExchangeList extends ConsumerWidget {
  const ExchangeList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final exchanges = ref.watch(echangesProvider);
    final c = context.colors;
    return exchanges.when(
      skipLoadingOnRefresh: true,
      loading: () => Skeleton.tiles(count: 2),
      error: (_, __) => const SizedBox.shrink(),
      data: (list) => list.isEmpty
          ? EmptyState(
              compact: true,
              icon: Icons.redeem_rounded,
              message: ref.tr('no_exchanges'))
          : Column(
              children: [
                for (final (i, e) in list.indexed)
                  Reveal(
                    index: i,
                    offset: 8,
                    duration: AppMotion.row,
                    step: const Duration(milliseconds: 35),
                    child: AppTile(
                      icon: Icons.check_rounded,
                      iconColor: c.okText,
                      iconBackground: c.okBg,
                      title: keepNumbersTogether(e.nomRecompense),
                      subtitle: fmtDateTime(e.date) +
                          (e.telephoneBeneficiaire == null
                              ? ''
                              : '\n${ref.tr('sent_to', args: {
                                      'tel':
                                          displayPhone(e.telephoneBeneficiaire!)
                                    })}'),
                      trailing: Text(
                        '−${fmtInt(e.coutPoints)}',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(color: c.forestInk),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
