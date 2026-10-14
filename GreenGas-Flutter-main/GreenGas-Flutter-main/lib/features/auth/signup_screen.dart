import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/core/phone.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/auth/auth_scaffold.dart';
import 'package:greengas/features/auth/bac_choice_card.dart';
import 'package:greengas/features/auth/choose_bac_screen.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Inscription : crée uniquement un compte `citoyen` (le rôle est fixé par le serveur).
/// Contrat 1.3.0 : le compte est actif et connecté dès l'inscription (plus de code SMS).
class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  BacPublic? _bac;
  bool _bacMissing = false;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _chooseBac() async {
    final bac = await Navigator.of(context).push<BacPublic>(
      MaterialPageRoute<BacPublic>(builder: (_) => const ChooseBacScreen()),
    );
    if (bac != null) {
      setState(() {
        _bac = bac;
        _bacMissing = false;
      });
    }
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    if (!(_form.currentState?.validate() ?? false)) return;
    if (_bac == null) {
      setState(() => _bacMissing = true);
      return;
    }
    setState(() => _busy = true);
    try {
      final user = await ref.read(authRepoProvider).signUp(
            nom: _name.text.trim(),
            telephone: normalizePhone(_phone.text),
            motDePasse: _password.text,
            codeBac: _bac!.code,
            email: _email.text.trim().isEmpty ? null : _email.text.trim(),
          );
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
      ref.read(sessionProvider.notifier).set(user);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      await showResultSheet(context,
          tone: Tone.alert,
          title: ref.tr('signup_failed'),
          message: friendlyError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final bac = _bac;
    return Form(
      key: _form,
      child: AuthScaffold(
        title: ref.tr('create_account'),
        subtitle: ref.tr('signup_subtitle'),
        children: [
          AppTextField(
            controller: _name,
            label: ref.tr('full_name'),
            prefixIcon: Icons.person_rounded,
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.name],
            validator: (v) => (v == null || v.trim().isEmpty)
                ? ref.tr('full_name_required')
                : null,
          ),
          const SizedBox(height: AppSpacing.lg),
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
            controller: _email,
            label: ref.tr('email_optional'),
            prefixIcon: Icons.mail_rounded,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.email],
            validator: (v) {
              final value = (v ?? '').trim();
              if (value.isEmpty) return null;
              return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value)
                  ? null
                  : ref.tr('email_invalid');
            },
          ),
          const SizedBox(height: AppSpacing.lg),
          AppTextField(
            controller: _password,
            label: ref.tr('password'),
            prefixIcon: Icons.lock_rounded,
            obscure: true,
            showLabel: ref.tr('show_password'),
            hideLabel: ref.tr('hide_password'),
            autofillHints: const [AutofillHints.newPassword],
            validator: (v) =>
                (v == null || v.length < 8) ? ref.tr('password_min') : null,
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(ref.tr('my_bac'), style: t.titleMedium),
          const SizedBox(height: AppSpacing.sm),
          BacChoiceCard(
            title: bac == null
                ? null
                : (bac.residence.isEmpty ? bac.code : bac.residence),
            code: bac?.code,
            distance: bac?.distanceM == null
                ? null
                : ref.tr('from_you', args: {'d': fmtDistance(bac!.distanceM!)}),
            actionLabel: ref.tr(bac == null ? 'choose_bac' : 'change_bac'),
            onChoose: _chooseBac,
            error: _bacMissing ? ref.tr('bac_required') : null,
          ),
          const SizedBox(height: AppSpacing.xxl),
          AppButton(
            label: ref.tr(_busy ? 'creating' : 'create_account'),
            busy: _busy,
            onPressed: _submit,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(ref.tr('signup_active'),
              textAlign: TextAlign.center, style: t.bodySmall),
        ],
      ),
    );
  }
}
