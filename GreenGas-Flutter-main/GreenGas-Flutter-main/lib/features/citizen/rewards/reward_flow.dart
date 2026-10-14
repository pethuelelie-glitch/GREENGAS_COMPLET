import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/citizen/rewards/reward_detail_screen.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Ouvre le détail d'une récompense ; après un échange, rafraîchit le solde et les échanges,
/// puis confirme (avec le numéro qui reçoit le forfait ou le crédit).
Future<void> openReward(
    BuildContext context, WidgetRef ref, Recompense reward) async {
  final echange = await Navigator.of(context).push<Echange>(
    MaterialPageRoute<Echange>(
        builder: (_) => RewardDetailScreen(reward: reward)),
  );
  if (echange == null || !context.mounted) return;
  ref.invalidate(soldeProvider);
  ref.invalidate(echangesProvider);
  final tel = echange.telephoneBeneficiaire;
  await showResultSheet(
    context,
    title: ref.tr('exchange_done'),
    message:
        '${keepNumbersTogether(reward.nom)} · ${fmtInt(reward.coutPoints)} ${ref.tr('points')}'
        '${tel == null ? '' : '\n${ref.tr('sent_to', args: {
                'tel': displayPhone(tel)
              })}'}',
  );
}
