import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/bac_qr.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/collector/collecte_screen.dart';
import 'package:greengas/features/collector/collector_nav.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/scanner_page.dart';

/// Le collecteur scanne le QR du bac : le serveur ouvre la collecte, puis le collecteur saisit
/// le poids relevé (`source = manuel`, contrat 1.5.0) avant de valider.
class CollectorScanScreen extends ConsumerStatefulWidget {
  const CollectorScanScreen({super.key});

  @override
  ConsumerState<CollectorScanScreen> createState() =>
      _CollectorScanScreenState();
}

class _CollectorScanScreenState extends ConsumerState<CollectorScanScreen> {
  bool _busy = false;

  Future<void> _scan(Tournee tournee) async {
    if (_busy) return;
    final raw = await openScanner(context, hint: ref.tr('scan_bin_hint'));
    if (raw == null || !mounted) return;
    setState(() => _busy = true);
    try {
      final code = BacQr.parse(raw);
      if (code == null) {
        await showResultSheet(context,
            tone: Tone.alert,
            title: ref.tr('qr_unknown_title'),
            message: ref.tr('qr_unknown_text'));
        return;
      }
      final collecte =
          await ref.read(tourneeRepoProvider).ouvrirCollecte(tournee.id, code);
      ref.invalidate(tourneeDetailProvider(tournee.id));
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute<void>(
          builder: (_) => CollecteScreen(collecte: collecte)));
      ref.invalidate(tourneeDetailProvider(tournee.id));
      ref.invalidate(tourneesDuJourProvider);
    } catch (e) {
      if (!mounted) return;
      // BAC_HORS_TOURNEE, BAC_DEJA_COLLECTE, TOURNEE_STATUT_INVALIDE : message du serveur tel quel.
      await showResultSheet(context,
          tone: Tone.alert,
          title: ref.tr('collect_failed'),
          message: friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tournee = ref.watch(currentTourneeProvider).valueOrNull;
    final active = tournee != null && tournee.statut == StatutTournee.enCours;
    final c = context.colors;
    final t = Theme.of(context).textTheme;

    return ListView(
      padding: EdgeInsets.only(bottom: FloatingDock.clearance(context)),
      children: [
        AppHeader(title: ref.tr('scan_bin')),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
          child: active
              ? Reveal(
                  child: Container(
                    padding: const EdgeInsets.all(AppSpacing.xxl),
                    decoration: BoxDecoration(
                      color: c.forest,
                      borderRadius: BorderRadius.circular(AppRadii.card),
                      boxShadow: AppShadows.floating(context.isDark),
                    ),
                    child: Column(
                      children: [
                        PulseRing(
                          color: c.onForestMuted,
                          size: 96,
                          child: IconBubble(
                            icon: Icons.qr_code_scanner_rounded,
                            color: c.forest,
                            background: c.onForestMuted,
                            size: 96,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(ref.tr('route_code', args: {'code': tournee.code}),
                            style: t.titleLarge?.copyWith(color: Colors.white)),
                        const SizedBox(height: AppSpacing.xs),
                        Text(ref.tr('collector_scan_info'),
                            textAlign: TextAlign.center,
                            style:
                                t.bodyMedium?.copyWith(color: c.onForestMuted)),
                        const SizedBox(height: AppSpacing.xl),
                        AppButton(
                          label: ref.tr('scan_bin'),
                          icon: Icons.qr_code_scanner_rounded,
                          kind: ButtonKind.light,
                          busy: _busy,
                          onPressed: () => _scan(tournee),
                        ),
                      ],
                    ),
                  ),
                )
              : AppCard(
                  child: EmptyState(
                    compact: true,
                    icon: Icons.route_rounded,
                    message: ref.tr(tournee == null
                        ? 'no_route_today'
                        : 'start_route_first'),
                    action: tournee == null
                        ? null
                        : AppButton(
                            label: ref.tr('nav_route'),
                            icon: Icons.route_rounded,
                            kind: ButtonKind.outline,
                            height: 48,
                            expand: false,
                            onPressed: () => CollectorNav.of(context)
                                .goTo(CollectorTab.route),
                          ),
                  ),
                ),
        ),
      ],
    );
  }
}
