import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/core/format.dart';
import 'package:greengas/core/location.dart';
import 'package:greengas/data/api_client.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/domain/bac_qr.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/features/citizen/home/balance_banner.dart';
import 'package:greengas/features/citizen/home/deposit_history.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/app_header.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/scanner_page.dart';

/// Accueil du citoyen (onglet Scanner) : solde et bouton de scan dans la bannière verte, puis
/// l'historique des dépôts. Les récompenses sont dans l'onglet Boutique.
class CitizenScanScreen extends ConsumerStatefulWidget {
  const CitizenScanScreen({super.key});

  @override
  ConsumerState<CitizenScanScreen> createState() => _CitizenScanScreenState();
}

class _CitizenScanScreenState extends ConsumerState<CitizenScanScreen> {
  bool _busy = false;
  Timer? _refresh;

  @override
  void initState() {
    super.initState();
    // Le solde change quand la collecte est triée côté serveur : on le rafraîchit tant que
    // l'onglet est visible (le shell ne construit que l'onglet actif, le minuteur s'arrête au départ).
    // On relit aussi `max_scans_par_jour` : si l'admin le change, l'app le suit (contrat 1.6.0).
    _refresh = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) {
        ref.invalidate(soldeProvider);
        ref.invalidate(plafondScansProvider);
      }
    });
  }

  @override
  void dispose() {
    _refresh?.cancel();
    super.dispose();
  }

  Future<void> _pullToRefresh() async {
    ref.invalidate(scansProvider);
    ref.invalidate(soldeProvider);
    ref.invalidate(plafondScansProvider);
    await ref.read(soldeProvider.future);
  }

  /// Dépôts comptés aujourd'hui (même règle que le serveur : `compte == true` et date du jour).
  int _countedToday(List<Scan>? scans) =>
      scans?.where((s) => s.compte && _isToday(s.horodatage)).length ?? 0;

  Future<void> _scan() async {
    if (_busy) return;
    final raw = await openScanner(context, hint: ref.tr('scan_hint'));
    if (raw == null || !mounted) return;
    // Blocage à l'avance : inutile d'envoyer un dépôt qu'on sait déjà refusé côté serveur.
    final plafond = ref.read(plafondScansProvider).valueOrNull;
    if (plafond != null &&
        _countedToday(ref.read(scansProvider).valueOrNull) >= plafond) {
      await showResultSheet(context,
          success: false,
          title: ref.tr('scan_limit_title'),
          message: ref.tr('scan_limit_reached', args: {'n': '$plafond'}));
      return;
    }
    setState(() => _busy = true);
    try {
      await _handle(raw);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _handle(String raw) async {
    final code = BacQr.parse(raw);
    if (code == null) {
      await showResultSheet(context,
          tone: Tone.alert,
          title: ref.tr('qr_unknown_title'),
          message: ref.tr('qr_unknown_text'));
      return;
    }
    try {
      // La position sert au contrôle de distance fait par le serveur. Sans elle, le scan
      // est envoyé quand même (statut non_localise : compté mais signalé).
      final loc = await LocationService.currentOrNull();
      final scan = await ref
          .read(scanRepoProvider)
          .scan(code, latitude: loc?.lat, longitude: loc?.lng);
      ref.invalidate(scansProvider);
      ref.invalidate(soldeProvider);
      if (!mounted) return;
      final (title, text, tone) = switch (scan.statut) {
        StatutScan.valide => ('deposit_ok_title', 'deposit_ok_text', Tone.ok),
        StatutScan.nonLocalise => (
            'deposit_ok_title',
            'deposit_noloc_text',
            Tone.ok
          ),
        StatutScan.horsZone => (
            'deposit_far_title',
            'deposit_far_text',
            Tone.warn
          ),
        StatutScan.refusePlafond => (
            'scan_limit_title',
            'deposit_limit_text',
            Tone.warn
          ),
      };
      await showResultSheet(context,
          tone: tone, title: ref.tr(title), message: ref.tr(text));
    } catch (e) {
      if (!mounted) return;
      await showResultSheet(context,
          tone: Tone.alert,
          title: ref.tr('scan_failed'),
          message: friendlyError(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(sessionProvider)!;
    final solde = ref.watch(soldeProvider).valueOrNull;
    final scans = ref.watch(scansProvider).valueOrNull;
    final plafond = ref.watch(plafondScansProvider).valueOrNull;
    final pendingAccount =
        user.profilCitoyen?.statutValidation != StatutValidation.valide;
    final quotaReached = plafond != null && _countedToday(scans) >= plafond;

    return RefreshIndicator(
      onRefresh: _pullToRefresh,
      child: ListView(
        padding: EdgeInsets.only(bottom: FloatingDock.clearance(context)),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const AppHeader(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screen),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (pendingAccount) ...[
                  NoticeBanner(
                      text: ref.tr('account_pending_banner'),
                      icon: Icons.hourglass_top_rounded),
                  const SizedBox(height: AppSpacing.md),
                ],
                Reveal(
                  child: BalanceBanner(
                    label: ref.tr('my_points'),
                    points: solde?.solde,
                    unit: ref.tr('points'),
                    pending: (solde != null && solde.pointsEnAttente > 0)
                        ? ref.tr('pending_points',
                            args: {'n': fmtInt(solde.pointsEnAttente)})
                        : null,
                    scanLabel: ref.tr('scan_bin'),
                    onScan: _scan,
                    busy: _busy,
                    limitMessage: quotaReached
                        ? ref.tr('scan_limit_reached', args: {'n': '$plafond'})
                        : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded,
                        size: 18, color: context.colors.textMuted),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(ref.tr('scan_info'),
                          style: Theme.of(context).textTheme.bodySmall),
                    ),
                  ],
                ),
                SectionHeader(ref.tr('deposits_history')),
                const DepositHistory(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Vrai si [d] tombe le jour calendaire courant (heure locale).
bool _isToday(DateTime d) {
  final l = d.toLocal();
  final n = DateTime.now();
  return l.year == n.year && l.month == n.month && l.day == n.day;
}
