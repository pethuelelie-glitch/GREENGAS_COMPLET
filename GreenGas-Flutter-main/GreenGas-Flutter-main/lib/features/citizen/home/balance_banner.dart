import 'package:flutter/material.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/shared/design/design.dart';

/// Bannière verte de l'accueil (le « bandeau promo » de la maquette) : solde de points qui défile,
/// points en attente, puis le grand bouton « Scanner un bac » — ou le message de limite du jour.
class BalanceBanner extends StatelessWidget {
  const BalanceBanner({
    super.key,
    required this.label,
    required this.points,
    required this.unit,
    required this.scanLabel,
    required this.onScan,
    this.pending,
    this.limitMessage,
    this.busy = false,
  });

  final String label;

  /// Solde, ou null pendant le premier chargement.
  final int? points;
  final String unit;
  final String scanLabel;
  final VoidCallback onScan;
  final String? pending;

  /// Si renseigné, le plafond du jour est atteint : le message remplace le bouton.
  final String? limitMessage;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return Container(
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: c.forest,
        borderRadius: BorderRadius.circular(AppRadii.card),
        boxShadow: AppShadows.floating(context.isDark),
      ),
      child: Stack(
        children: [
          // Grand « G » en filigrane, comme le visuel de la maquette.
          Positioned(
            right: -28,
            bottom: -36,
            child: Opacity(
              opacity: 0.12,
              child: Image.asset('assets/images/logo_g.png',
                  width: 170,
                  color: Colors.white,
                  colorBlendMode: BlendMode.srcIn,
                  excludeFromSemantics: true),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: t.labelMedium?.copyWith(color: c.onForestMuted)),
                const SizedBox(height: AppSpacing.xs),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    if (points == null)
                      Text('…',
                          style: t.displaySmall?.copyWith(color: Colors.white))
                    else
                      AnimatedNumber(
                        value: points!,
                        format: (v) => fmtInt(v.round()),
                        style: t.displaySmall?.copyWith(color: Colors.white),
                      ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(unit,
                        style: t.titleSmall?.copyWith(color: c.onForestMuted)),
                  ],
                ),
                if (pending != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Container(
                    padding: const EdgeInsets.fromLTRB(8, 5, 12, 5),
                    decoration: BoxDecoration(
                      color: c.goldPale,
                      borderRadius: BorderRadius.circular(AppRadii.full),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.hourglass_top_rounded,
                            size: 15, color: c.goldText),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(pending!,
                              style:
                                  t.labelMedium?.copyWith(color: c.goldText)),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.lg),
                AnimatedSwitcher(
                  duration: AppMotion.of(context, AppMotion.base),
                  child: limitMessage != null
                      ? _LimitReached(message: limitMessage!)
                      : AppButton(
                          key: const ValueKey('scan'),
                          label: scanLabel,
                          icon: Icons.qr_code_scanner_rounded,
                          kind: ButtonKind.light,
                          busy: busy,
                          onPressed: onScan,
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LimitReached extends StatelessWidget {
  const _LimitReached({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) => Container(
        key: const ValueKey('limit'),
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.md + 2),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(AppRadii.tile),
        ),
        child: Row(
          children: [
            const Icon(Icons.hourglass_bottom_rounded, color: Colors.white),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(message,
                  style: Theme.of(context)
                      .textTheme
                      .labelMedium
                      ?.copyWith(color: Colors.white)),
            ),
          ],
        ),
      );
}
