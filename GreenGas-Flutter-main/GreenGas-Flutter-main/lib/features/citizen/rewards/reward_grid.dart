import 'package:flutter/material.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/citizen/rewards/reward_card.dart';
import 'package:greengas/shared/design/design.dart';

/// Grille de récompenses sur deux colonnes, cartes de même hauteur, apparition en cascade.
class RewardGrid extends StatelessWidget {
  const RewardGrid({
    super.key,
    required this.rewards,
    required this.balance,
    required this.onTap,
    required this.pointsLabel,
  });

  final List<Recompense> rewards;
  final int balance;
  final void Function(Recompense) onTap;
  final String Function(int) pointsLabel;

  @override
  Widget build(BuildContext context) {
    Widget card(int i) => Reveal(
          index: i,
          child: RewardCard(
            reward: rewards[i],
            balance: balance,
            onTap: () => onTap(rewards[i]),
            pointsLabel: pointsLabel,
          ),
        );
    return Column(
      children: [
        for (var i = 0; i < rewards.length; i += 2)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: card(i)),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                    child: i + 1 < rewards.length
                        ? card(i + 1)
                        : const SizedBox.shrink()),
              ],
            ),
          ),
      ],
    );
  }
}
