import 'package:flutter/material.dart' hide Notification;
import 'package:greengas/domain/models.dart';
import 'package:greengas/shared/design/design.dart';

/// Carte d'une notification (`ElementNotification` du desktop) : icône colorée selon le niveau,
/// texte plus marqué et point tant qu'elle n'est pas lue. Glisser vers la gauche la marque comme lue.
class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    required this.time,
    required this.fullDate,
    required this.onRead,
  });

  final Notification notification;
  final String time;
  final String fullDate;
  final Future<void> Function() onRead;

  static IconData _icon(TypeNotification t) => switch (t) {
        TypeNotification.pointsCredites => Icons.add_circle_rounded,
        TypeNotification.pointsEnAttente => Icons.hourglass_top_rounded,
        TypeNotification.pointsAnnules => Icons.remove_circle_rounded,
        TypeNotification.echangeEffectue => Icons.redeem_rounded,
        TypeNotification.tourneePlanifiee => Icons.local_shipping_rounded,
      };

  static Tone _tone(NiveauNotification n) => switch (n) {
        NiveauNotification.info => Tone.ok,
        NiveauNotification.attention => Tone.warn,
        NiveauNotification.critique => Tone.alert,
      };

  @override
  Widget build(BuildContext context) {
    final n = notification;
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final unread = !n.lue;
    final tone = _tone(n.niveau);

    final card = Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md - 2),
      child: AppCard(
        onTap: unread ? onRead : null,
        semanticLabel: '${n.titre}. ${n.message}. $time',
        padding: const EdgeInsets.all(AppSpacing.md + 2),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            IconBubble(
              icon: _icon(n.type),
              color: c.toneColor(tone),
              background: c.toneBg(tone),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          n.titre,
                          style: t.titleSmall?.copyWith(
                            fontWeight:
                                unread ? FontWeight.w800 : FontWeight.w600,
                            color: unread ? c.text : c.textMuted,
                          ),
                        ),
                      ),
                      AnimatedOpacity(
                        opacity: unread ? 1 : 0,
                        duration: AppMotion.of(context, AppMotion.base),
                        child: Container(
                          width: 10,
                          height: 10,
                          margin: const EdgeInsets.only(left: AppSpacing.sm),
                          decoration: BoxDecoration(
                              color: c.toneColor(tone), shape: BoxShape.circle),
                        ),
                      ),
                    ],
                  ),
                  if (n.message.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Text(n.message, style: t.bodyMedium),
                  ],
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.schedule_rounded,
                          size: 14, color: c.textMuted),
                      const SizedBox(width: 4),
                      Text(time,
                          style: t.labelSmall?.copyWith(color: c.textMuted)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    final withTooltip = Tooltip(message: fullDate, child: card);
    if (!unread) return withTooltip;
    return Dismissible(
      key: ValueKey(n.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        await onRead();
        return false; // la notification reste, simplement marquée lue
      },
      background: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.md - 2),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.xl),
        decoration: BoxDecoration(
          color: c.green,
          borderRadius: BorderRadius.circular(AppRadii.card),
        ),
        child: const Icon(Icons.done_all_rounded, color: Colors.white),
      ),
      child: withTooltip,
    );
  }
}
