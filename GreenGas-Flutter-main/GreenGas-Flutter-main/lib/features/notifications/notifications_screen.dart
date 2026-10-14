import 'dart:async';

import 'package:flutter/material.dart' hide Notification;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/notifications/notification_tile.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Liste des notifications de l'utilisateur connecté (contrat 1.4.0, `notification.txt`).
/// Le mobile ne crée rien : il lit, affiche tel quel, et marque comme lues.
class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  Timer? _refresh;

  @override
  void initState() {
    super.initState();
    _refresh = Timer.periodic(const Duration(seconds: 15), (_) {
      if (mounted) _reload();
    });
  }

  @override
  void dispose() {
    _refresh?.cancel();
    super.dispose();
  }

  void _reload() {
    ref.invalidate(notificationsListProvider);
    ref.invalidate(notificationsCountProvider);
  }

  Future<void> _pull() async {
    _reload();
    await ref.read(notificationsListProvider.future);
  }

  Future<void> _toutLire() =>
      _action(() => ref.read(notifRepoProvider).toutLire());

  Future<void> _ouvrir(Notification n) async {
    if (n.lue) return;
    await _action(() => ref.read(notifRepoProvider).marquerLue(n.id));
  }

  /// Lance [run] puis recharge la liste ; une erreur réseau s'affiche au lieu de remonter.
  Future<void> _action(Future<void> Function() run) async {
    try {
      await run();
    } catch (e) {
      if (mounted) showToast(context, friendlyError(e), error: true);
    }
    if (mounted) _reload();
  }

  /// Horodatage lisible : « il y a 5 min », sinon la date complète.
  String _relative(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.isNegative || diff.inDays >= 7) return fmtDateTime(d);
    if (diff.inMinutes < 1) return ref.tr('rel_now');
    if (diff.inMinutes < 60) {
      return ref.tr('rel_min', args: {'n': '${diff.inMinutes}'});
    }
    if (diff.inHours < 24) {
      return ref.tr('rel_hour', args: {'n': '${diff.inHours}'});
    }
    return ref.tr('rel_day', args: {'n': '${diff.inDays}'});
  }

  @override
  Widget build(BuildContext context) {
    final unread = ref.watch(notificationsCountProvider).valueOrNull ?? 0;
    final list = ref.watch(notificationsListProvider);

    return PageScaffold(
      title: ref.tr('notifications'),
      onRefresh: _pull,
      actions: [
        AnimatedSwitcher(
          duration: AppMotion.of(context, AppMotion.fast),
          child: unread > 0
              ? CircleIconButton(
                  icon: Icons.done_all_rounded,
                  tooltip: ref.tr('mark_all_read'),
                  onPressed: _toutLire,
                )
              : const SizedBox.shrink(),
        ),
      ],
      children: [
        ...list.when(
          skipLoadingOnRefresh: true,
          skipLoadingOnReload: true,
          loading: () => [Skeleton.tiles(count: 4)],
          error: (e, _) => [
            ErrorState(
              message: friendlyError(e),
              onRetry: _reload,
              retryLabel: ref.tr('retry'),
            ),
          ],
          data: (items) => items.isEmpty
              ? [
                  const SizedBox(height: AppSpacing.xxxl),
                  EmptyState(
                    icon: Icons.notifications_none_rounded,
                    title: ref.tr('all_read'),
                    message: ref.tr('no_notifications'),
                  ),
                ]
              : [
                  if (unread > 0)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: StatusPill(
                          ref.tr('notif_unread', args: {'n': '$unread'}),
                          tone: Tone.ok,
                          icon: Icons.mark_email_unread_rounded,
                        ),
                      ),
                    ),
                  for (final (i, n) in items.indexed)
                    Reveal(
                      index: i,
                      offset: 8,
                      duration: AppMotion.row,
                      step: const Duration(milliseconds: 35),
                      child: NotificationTile(
                        notification: n,
                        time: _relative(n.dateCreation),
                        fullDate: ref.tr('received_on',
                            args: {'date': fmtDateTime(n.dateCreation)}),
                        onRead: () => _ouvrir(n),
                      ),
                    ),
                ],
        ),
      ],
    );
  }
}
