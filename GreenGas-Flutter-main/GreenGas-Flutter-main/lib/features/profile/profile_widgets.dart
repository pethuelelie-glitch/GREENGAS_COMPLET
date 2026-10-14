import 'package:flutter/material.dart';
import 'package:greengas/shared/design/design.dart';

/// Carte d'identité du profil : avatar, nom, rôle, statut et points.
class IdentityCard extends StatelessWidget {
  const IdentityCard({
    super.key,
    required this.name,
    required this.role,
    this.status,
    this.points,
  });

  final String name;
  final String role;
  final Widget? status;
  final String? points;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return AppCard(
      color: c.forest,
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Row(
        children: [
          Avatar(name: name, size: 68),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: t.titleLarge?.copyWith(color: Colors.white)),
                const SizedBox(height: 2),
                Text(role,
                    style: t.labelMedium?.copyWith(color: c.onForestMuted)),
                if (status != null || points != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Wrap(
                    spacing: AppSpacing.sm,
                    runSpacing: AppSpacing.xs,
                    children: [
                      if (status != null) status!,
                      if (points != null)
                        StatusPill(points!,
                            tone: Tone.ok, icon: Icons.stars_rounded),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Ligne d'information (libellé à gauche, valeur à droite).
class InfoRow extends StatelessWidget {
  const InfoRow(
      {super.key,
      required this.icon,
      required this.label,
      required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Semantics(
      label: '$label : $value',
      excludeSemantics: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        child: Row(
          children: [
            IconBubble(
                icon: icon,
                color: context.colors.forestInk,
                background: context.colors.greenPale,
                size: 40),
            const SizedBox(width: AppSpacing.md),
            Text(label,
                style: t.bodyMedium?.copyWith(color: context.colors.textMuted)),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(value,
                  textAlign: TextAlign.end,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: t.titleSmall),
            ),
          ],
        ),
      ),
    );
  }
}

/// Ligne de réglage : soit un interrupteur ([toggle]), soit une valeur avec chevron.
class SettingRow extends StatelessWidget {
  const SettingRow({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.value,
    this.toggle,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final String? value;
  final bool? toggle;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    return MergeSemantics(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadii.card),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 64),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: Row(
              children: [
                IconBubble(
                    icon: icon,
                    color: c.forestInk,
                    background: c.greenPale,
                    size: 40),
                const SizedBox(width: AppSpacing.md),
                Expanded(child: Text(label, style: t.titleSmall)),
                if (value != null)
                  Text(value!,
                      style: t.bodyMedium?.copyWith(color: c.textMuted)),
                if (toggle != null)
                  Switch(value: toggle!, onChanged: (_) => onTap())
                else
                  Icon(Icons.chevron_right_rounded, color: c.textMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
