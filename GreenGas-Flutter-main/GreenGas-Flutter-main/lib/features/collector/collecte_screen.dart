import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/collector/collecte/collecte_parts.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Suivi d'une collecte : le collecteur saisit le poids du bac (`source = manuel`), puis valide.
class CollecteScreen extends ConsumerStatefulWidget {
  const CollecteScreen({super.key, required this.collecte});
  final Collecte collecte;

  @override
  ConsumerState<CollecteScreen> createState() => _CollecteScreenState();
}

class _CollecteScreenState extends ConsumerState<CollecteScreen> {
  late Collecte _c = widget.collecte;
  final _poidsCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _poidsCtrl.dispose();
    super.dispose();
  }

  /// Poids saisi (> 0), ou null tant que la saisie n'est pas valide. La virgule est acceptée.
  double? get _poidsSaisi {
    final v = double.tryParse(_poidsCtrl.text.trim().replaceAll(',', '.'));
    return (v == null || v <= 0) ? null : v;
  }

  Future<void> _run(Future<Collecte> Function() call, String failKey) async {
    setState(() => _busy = true);
    try {
      final c = await call();
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      setState(() => _c = c);
    } catch (e) {
      if (!mounted) return;
      await showResultSheet(context,
          tone: Tone.alert, title: ref.tr(failKey), message: friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _enregistrerPesee() {
    final poids = _poidsSaisi;
    if (poids == null) return;
    _run(() => ref.read(tourneeRepoProvider).saisirPesee(_c.id, poids),
        'weighing_refused');
  }

  void _valider() => _run(
      () => ref.read(tourneeRepoProvider).valider(_c.id), 'validation_failed');

  String _sourceLabel(String? source) => ref.tr(switch (source) {
        'capteur' => 'source_sensor',
        'manuel' => 'source_manual',
        _ => 'source_simulated',
      });

  @override
  Widget build(BuildContext context) {
    final step = switch (_c.statut) {
      StatutCollecte.enAttentePesee => 0,
      StatutCollecte.pesee => 1,
      StatutCollecte.validee => 2,
    };
    final aVerifier = _c.statutControle == StatutControle.aVerifier;

    return PageScaffold(
      title: ref.tr('collect_title'),
      bottom: switch (_c.statut) {
        StatutCollecte.enAttentePesee => AppButton(
            label: ref.tr(_busy ? 'saving' : 'save_weighing'),
            icon: Icons.scale_rounded,
            busy: _busy,
            onPressed: _poidsSaisi == null ? null : _enregistrerPesee,
          ),
        StatutCollecte.pesee => AppButton(
            label: ref.tr(_busy ? 'validating' : 'validate_collect'),
            icon: Icons.check_rounded,
            busy: _busy,
            onPressed: _valider,
          ),
        StatutCollecte.validee => AppButton(
            label: ref.tr('finish'),
            onPressed: () => Navigator.of(context).pop(),
          ),
      },
      children: [
        StepTracker(
          current: step,
          labels: [
            ref.tr('step_weigh'),
            ref.tr('step_validate'),
            ref.tr('step_done')
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        AnimatedSwitcher(
          duration: AppMotion.of(context, AppMotion.base),
          child: Column(
            key: ValueKey(_c.statut),
            crossAxisAlignment: CrossAxisAlignment.start,
            children: switch (_c.statut) {
              StatutCollecte.enAttentePesee => [
                  BinHeader(code: _c.codeBac, label: ref.tr('scanned_bin')),
                  const SizedBox(height: AppSpacing.lg),
                  AppCard(
                    child: Column(
                      children: [
                        DataLine(ref.tr('bin_tare'), fmtKg(_c.tareKg)),
                        const SizedBox(height: AppSpacing.md),
                        AppTextField(
                          controller: _poidsCtrl,
                          label: ref.tr('gross_weight'),
                          hint: ref.tr('weight_example'),
                          large: true,
                          autofocus: true,
                          keyboardType: const TextInputType.numberWithOptions(
                              decimal: true),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(
                                RegExp(r'[0-9.,]')),
                          ],
                          onChanged: (_) => setState(() {}),
                          onSubmitted: (_) => _enregistrerPesee(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  NoticeBanner(
                      text: ref.tr('gross_weight_hint'),
                      tone: Tone.neutral,
                      icon: Icons.info_outline_rounded),
                ],
              StatutCollecte.pesee => [
                  BinHeader(code: _c.codeBac, label: ref.tr('weight_received')),
                  const SizedBox(height: AppSpacing.lg),
                  AppCard(
                    child: Column(
                      children: [
                        AnimatedNumber(
                          value: _c.poidsBrutKg ?? 0,
                          format: (v) => fmtKg(v.toDouble()),
                          style: Theme.of(context)
                              .textTheme
                              .displayMedium
                              ?.copyWith(color: context.colors.forestInk),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        DataLine(ref.tr('bin_tare'), fmtKg(_c.tareKg)),
                        DataLine(ref.tr('source'), _sourceLabel(_c.source)),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  NoticeBanner(
                      text: ref.tr('net_weight_hint'),
                      tone: Tone.neutral,
                      icon: Icons.info_outline_rounded),
                ],
              StatutCollecte.validee => [
                  BinHeader(
                    code: _c.codeBac,
                    label: ref.tr('collect_validated'),
                    trailing: StatusPill(
                        ref.tr(aVerifier ? 'to_check' : 'normal'),
                        tone: aVerifier ? Tone.warn : Tone.ok),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  AppCard(
                    child: Column(
                      children: [
                        DataLine(
                            ref.tr('net_weight'), fmtKg(_c.poidsNetKg ?? 0)),
                        DataLine(
                            ref.tr('scans_counted'), '${_c.scansValides ?? 0}'),
                        DataLine(ref.tr('kg_per_scan'),
                            _c.kgParScan == null ? '-' : fmtKg(_c.kgParScan!)),
                      ],
                    ),
                  ),
                  if (aVerifier) ...[
                    const SizedBox(height: AppSpacing.md),
                    NoticeBanner(text: ref.tr('collect_to_check_hint')),
                  ],
                ],
            },
          ),
        ),
      ],
    );
  }
}
