import 'package:flutter/material.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/citizen/rewards/reward_look.dart';
import 'package:greengas/shared/design/design.dart';

/// Carte d'une récompense (maquette Planta « Popular plants ») : visuel teinté, nom, partenaire,
/// coût, et une jauge qui montre le chemin restant jusqu'à la récompense.
class RewardCard extends StatelessWidget {
  const RewardCard({
    super.key,
    required this.reward,
    required this.balance,
    required this.onTap,
    required this.pointsLabel,
  });

  final Recompense reward;
  final int balance;
  final VoidCallback onTap;

  /// « {n} pts » mis en forme par l'appelant (traduit).
  final String Function(int) pointsLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final look = RewardLook.of(context, reward.categorie);
    final progress = (balance / reward.coutPoints).clamp(0.0, 1.0);
    final affordable = progress >= 1;

    return AppCard(
      onTap: onTap,
      semanticLabel: '${reward.nom}, ${pointsLabel(reward.coutPoints)}',
      padding: const EdgeInsets.all(AppSpacing.sm + 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 92,
            width: double.infinity,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: look.tint,
              borderRadius: BorderRadius.circular(AppRadii.tile),
            ),
            child: IconBubble(
                icon: look.icon,
                color: Colors.white,
                background: look.color,
                size: 52),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(4, AppSpacing.md, 4, 2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 42,
                  child: Text(keepNumbersTogether(reward.nom),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: t.titleSmall?.copyWith(height: 1.25)),
                ),
                Text(reward.partenaire,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: t.bodySmall),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: Text(pointsLabel(reward.coutPoints),
                          style: t.titleSmall?.copyWith(color: c.forestInk)),
                    ),
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: affordable ? c.primary : c.greenPale,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        affordable
                            ? Icons.arrow_forward_rounded
                            : Icons.lock_rounded,
                        size: 17,
                        color: affordable ? c.onPrimary : c.textMuted,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                ProgressBar(value: progress),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
