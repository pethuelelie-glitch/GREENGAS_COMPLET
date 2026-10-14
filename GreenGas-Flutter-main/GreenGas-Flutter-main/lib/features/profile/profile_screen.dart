import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/config.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/profile/profile_widgets.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/language_sheet.dart';

/// Profil et paramètres (ouverts depuis l'avatar) : identité, points, préférences, déconnexion.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    // On lit tout via `ref` avant de fermer l'écran (il est démonté pendant la déconnexion).
    final auth = ref.read(authRepoProvider);
    final tournee = ref.read(selectedTourneeIdProvider.notifier);
    final session = ref.read(sessionProvider.notifier);
    Navigator.of(context).popUntil((route) => route.isFirst);
    await auth.logout();
    tournee.set(null);
    session.set(null);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(sessionProvider);
    if (user == null) return const Scaffold();
    final citizen = user.role == Role.citoyen;
    final solde = citizen ? ref.watch(soldeProvider).valueOrNull : null;
    final dark = ref.watch(themeModeProvider) == ThemeMode.dark;
    final notifications = ref.watch(notificationsProvider);
    final lang = ref.watch(languageProvider);
    final valid =
        user.profilCitoyen?.statutValidation == StatutValidation.valide;

    return PageScaffold(
      title: ref.tr('profile'),
      children: [
        Reveal(
          child: IdentityCard(
            name: user.nom,
            role: ref.tr(citizen ? 'role_citizen' : 'role_collector'),
            status: citizen
                ? StatusPill(
                    ref.tr(valid ? 'account_valid' : 'account_pending'),
                    tone: valid ? Tone.ok : Tone.warn)
                : null,
            points: solde == null
                ? null
                : '${fmtInt(solde.solde)} ${ref.tr('points')}',
          ),
        ),
        SectionHeader(ref.tr('account')),
        Reveal(
          index: 1,
          child: AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                InfoRow(
                    icon: Icons.phone_rounded,
                    label: ref.tr('phone'),
                    value: displayPhone(user.telephone)),
                InfoRow(
                    icon: Icons.mail_rounded,
                    label: ref.tr('email'),
                    value: user.email ?? ref.tr('not_set')),
              ],
            ),
          ),
        ),
        SectionHeader(ref.tr('preferences')),
        Reveal(
          index: 2,
          child: AppCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                SettingRow(
                  icon: Icons.translate_rounded,
                  label: ref.tr('language'),
                  value: lang.label,
                  onTap: () => showLanguageSheet(context),
                ),
                SettingRow(
                  icon: Icons.dark_mode_rounded,
                  label: ref.tr('night_mode'),
                  toggle: dark,
                  onTap: () => ref.read(themeModeProvider.notifier).toggle(),
                ),
                SettingRow(
                  icon: Icons.notifications_rounded,
                  label: ref.tr('notifications'),
                  toggle: notifications,
                  onTap: () =>
                      ref.read(notificationsProvider.notifier).toggle(),
                ),
              ],
            ),
          ),
        ),
        if (!citizen) ...[
          SectionHeader(ref.tr('location')),
          Reveal(index: 3, child: _LocationCard()),
        ],
        const SizedBox(height: AppSpacing.xxl),
        AppButton(
          label: ref.tr('logout'),
          icon: Icons.logout_rounded,
          kind: ButtonKind.outline,
          onPressed: () => _logout(context, ref),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          '${ref.tr('server')} : ${AppConfig.apiBaseUrl}',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _LocationCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = ref.watch(userLocationProvider);
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          InfoRow(
            icon: Icons.my_location_rounded,
            label: ref.tr('position'),
            value: location.when(
              data: (l) =>
                  ref.tr(l.isFallback ? 'position_demo' : 'position_gps'),
              loading: () => '…',
              error: (_, __) => '-',
            ),
          ),
          SettingRow(
            icon: Icons.refresh_rounded,
            label: ref.tr('refresh_position'),
            onTap: () => ref.invalidate(userLocationProvider),
          ),
        ],
      ),
    );
  }
}
