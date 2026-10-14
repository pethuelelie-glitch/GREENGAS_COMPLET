import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/config.dart';
import 'package:greengas/core/phone.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/features/auth/auth_scaffold.dart';
import 'package:greengas/features/auth/demo_card.dart';
import 'package:greengas/features/auth/signup_screen.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Connexion commune à tous les rôles : téléphone + mot de passe (guide §5).
/// Le rôle n'est jamais choisi ici : c'est le serveur qui le renvoie.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    super.dispose();
  }

  void _fillDemo(String phone) {
    _phone.text = phone;
    _password.text = AppConfig.demoPassword;
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!(_form.currentState?.validate() ?? false)) return;
    setState(() => _busy = true);
    try {
      final user = await ref
          .read(authRepoProvider)
          .login(normalizePhone(_phone.text), _password.text);
      if (!mounted) return;
      // Ferme la page de connexion : l'aiguillage par rôle prend le relais.
      Navigator.of(context).popUntil((route) => route.isFirst);
      ref.read(sessionProvider.notifier).set(user);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      await showResultSheet(context,
          tone: Tone.alert,
          title: ref.tr('login_failed'),
          message: friendlyError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Form(
      key: _form,
      child: AuthScaffold(
        title: ref.tr('login_title'),
        subtitle: ref.tr('login_subtitle'),
        children: [
          AppTextField(
            controller: _phone,
            label: ref.tr('phone'),
            hint: '07 01 02 03 04',
            prefixText: '+225 ',
            prefixIcon: Icons.phone_rounded,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.telephoneNumber],
            validator: (v) => isValidPhone(normalizePhone(v ?? ''))
                ? null
                : ref.tr('phone_invalid'),
          ),
          const SizedBox(height: AppSpacing.lg),
          AppTextField(
            controller: _password,
            label: ref.tr('password'),
            prefixIcon: Icons.lock_rounded,
            obscure: true,
            showLabel: ref.tr('show_password'),
            hideLabel: ref.tr('hide_password'),
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.password],
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: AppSpacing.xxl),
          AppButton(
            label: ref.tr(_busy ? 'logging_in' : 'login'),
            busy: _busy,
            onPressed: _submit,
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(child: Divider(color: c.border)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: Text(ref.tr('or'),
                    style: Theme.of(context).textTheme.bodySmall),
              ),
              Expanded(child: Divider(color: c.border)),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          AppButton(
            label: ref.tr('create_account'),
            icon: Icons.person_add_alt_1_rounded,
            kind: ButtonKind.outline,
            onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const SignUpScreen())),
          ),
          if (AppConfig.useMock) ...[
            const SizedBox(height: AppSpacing.xxl),
            DemoCard(
              title: ref.tr('demo_mode'),
              text:
                  ref.tr('demo_password', args: {'p': AppConfig.demoPassword}),
              accounts: [
                (ref.tr('role_citizen'), () => _fillDemo('+2250701020304')),
                (ref.tr('role_collector'), () => _fillDemo('+2250700000002')),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
