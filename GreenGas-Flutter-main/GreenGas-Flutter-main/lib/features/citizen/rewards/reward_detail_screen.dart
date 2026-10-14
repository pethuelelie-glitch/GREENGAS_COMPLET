import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/core/phone.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/citizen/rewards/recipient_picker.dart';
import 'package:greengas/features/citizen/rewards/reward_hero.dart';
import 'package:greengas/features/citizen/rewards/reward_look.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Détail d'une récompense (maquette Planta, écran de détail) : visuel en haut, panneau blanc
/// arrondi, puces d'information, choix du numéro qui reçoit, gros bouton « Échanger ».
/// Renvoie l'[Echange] effectué.
class RewardDetailScreen extends ConsumerStatefulWidget {
  const RewardDetailScreen({super.key, required this.reward});
  final Recompense reward;

  @override
  ConsumerState<RewardDetailScreen> createState() => _RewardDetailScreenState();
}

class _RewardDetailScreenState extends ConsumerState<RewardDetailScreen> {
  final _other = TextEditingController();
  bool _forOther = false;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _other.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final user = ref.read(sessionProvider)!;
    String? beneficiary;
    if (widget.reward.versUnNumero) {
      beneficiary = _forOther ? normalizePhone(_other.text) : user.telephone;
      if (!isValidPhone(beneficiary)) {
        setState(() => _error = ref.tr('phone_invalid'));
        return;
      }
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final echange = await ref
          .read(pointsRepoProvider)
          .echanger(widget.reward.id, telephoneBeneficiaire: beneficiary);
      if (mounted) Navigator.of(context).pop(echange);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _error = friendlyError(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reward;
    final c = context.colors;
    final t = Theme.of(context).textTheme;
    final look = RewardLook.of(context, r.categorie);
    final user = ref.watch(sessionProvider)!;
    final balance = ref.watch(soldeProvider).valueOrNull?.solde;
    final missing = balance == null ? 0 : r.coutPoints - balance;
    final points = ref.tr('n_points', args: {'n': fmtInt(r.coutPoints)});

    return PopScope(
      canPop: !_busy,
      child: Scaffold(
        backgroundColor: Color.alphaBlend(look.tint, c.background),
        body: Column(
          children: [
            Expanded(
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                      child: RewardHero(look: look, backLabel: ref.tr('back'))),
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(AppSpacing.xxl,
                          AppSpacing.xxl, AppSpacing.xxl, AppSpacing.xl),
                      decoration: BoxDecoration(
                        color: c.surface,
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(32)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: AppSpacing.sm,
                            runSpacing: AppSpacing.sm,
                            children: [
                              StatusPill(points,
                                  tone: Tone.neutral,
                                  icon: Icons.stars_rounded),
                              StatusPill(ref.tr(look.labelKey),
                                  tone: Tone.neutral, icon: look.icon),
                              if (balance != null)
                                missing > 0
                                    ? StatusPill(
                                        ref.tr('missing',
                                            args: {'n': fmtInt(missing)}),
                                        tone: Tone.warn)
                                    : StatusPill(ref.tr('available'),
                                        tone: Tone.ok),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          Semantics(
                              header: true,
                              child: Text(keepNumbersTogether(r.nom),
                                  style: t.headlineSmall)),
                          const SizedBox(height: AppSpacing.xs),
                          Text(r.partenaire,
                              style:
                                  t.bodyMedium?.copyWith(color: c.textMuted)),
                          if (r.description.isNotEmpty) ...[
                            const SizedBox(height: AppSpacing.lg),
                            Text(r.description, style: t.bodyLarge),
                          ],
                          if (r.versUnNumero) ...[
                            SectionHeader(ref.tr('who_receives')),
                            RecipientPicker(
                              forOther: _forOther,
                              onChanged: (v) => setState(() {
                                _forOther = v;
                                _error = null;
                              }),
                              controller: _other,
                              myNumber: user.telephone,
                            ),
                          ],
                          if (_error != null) ...[
                            const SizedBox(height: AppSpacing.lg),
                            NoticeBanner(text: _error!, tone: Tone.alert),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              color: c.surface,
              padding: EdgeInsets.fromLTRB(
                  AppSpacing.xl,
                  AppSpacing.sm,
                  AppSpacing.xl,
                  AppSpacing.lg + MediaQuery.paddingOf(context).bottom),
              child: missing > 0
                  ? AppButton(
                      label: ref.tr('missing', args: {'n': fmtInt(missing)}),
                      icon: Icons.lock_rounded,
                      onPressed: null,
                    )
                  : ArrowPillButton(
                      label: ref.tr('confirm_exchange',
                          args: {'n': fmtInt(r.coutPoints)}),
                      busy: _busy,
                      onPressed: balance == null ? null : _confirm,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
