import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Les autres rôles (opérateur, responsable, référent, administrateur, capteur) utilisent le Control Center.
class WrongRoleScreen extends ConsumerWidget {
  const WrongRoleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PageScaffold(
      title: ref.tr('wrong_role_title'),
      bottom: AppButton(
        label: ref.tr('logout'),
        icon: Icons.logout_rounded,
        kind: ButtonKind.outline,
        onPressed: () async {
          final auth = ref.read(authRepoProvider);
          final session = ref.read(sessionProvider.notifier);
          await auth.logout();
          session.set(null);
        },
      ),
      children: [
        const SizedBox(height: AppSpacing.xxxl),
        EmptyState(
          icon: Icons.desktop_windows_rounded,
          title: ref.tr('wrong_role_caption'),
          message: ref.tr('wrong_role_text'),
        ),
      ],
    );
  }
}
