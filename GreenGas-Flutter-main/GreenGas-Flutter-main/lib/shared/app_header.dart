import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/profile/profile_screen.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/notification_bell.dart';

/// En-tête des onglets (maquette Planta) : avatar (ouvre le profil), salutation ou titre, cloche.
/// Défile avec le contenu ; respecte la zone de la barre d'état.
class AppHeader extends ConsumerWidget {
  const AppHeader({super.key, this.title, this.subtitle});

  /// Titre de l'onglet ; sans titre, l'en-tête salue l'utilisateur.
  final String? title;
  final String? subtitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionProvider);
    if (user == null) return const SizedBox.shrink();
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final greeting = title == null;

    return Padding(
      padding: EdgeInsets.fromLTRB(
          AppSpacing.screen,
          MediaQuery.paddingOf(context).top + AppSpacing.md,
          AppSpacing.screen,
          AppSpacing.lg),
      child: Row(
        children: [
          Pressable(
            onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const ProfileScreen())),
            semanticLabel: ref.tr('profile'),
            scale: 0.92,
            child: Avatar(name: user.nom),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Reveal(
              offset: 6,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    greeting
                        ? ref.tr('welcome')
                        : (subtitle ??
                            ref.tr(user.role == Role.citoyen
                                ? 'role_citizen'
                                : 'role_collector')),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: t.labelMedium?.copyWith(color: c.textMuted),
                  ),
                  Semantics(
                    header: true,
                    child: Text(
                      greeting ? user.nom : title!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: greeting ? t.titleLarge : t.headlineSmall,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          const NotificationBell(),
        ],
      ),
    );
  }
}
