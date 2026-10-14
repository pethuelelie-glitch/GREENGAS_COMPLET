import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/qr_scanner_view.dart';

/// Ouvre la caméra en plein écran et renvoie le premier QR code lu (contenu brut), ou null.
Future<String?> openScanner(BuildContext context, {String? hint}) =>
    Navigator.of(context).push<String>(MaterialPageRoute<String>(
        fullscreenDialog: true, builder: (_) => ScannerPage(hint: hint)));

/// Caméra plein écran : fond noir, cadre de visée, bouton fermer et lampe.
class ScannerPage extends ConsumerStatefulWidget {
  const ScannerPage({super.key, this.hint});
  final String? hint;

  @override
  ConsumerState<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends ConsumerState<ScannerPage> {
  bool _done = false;

  void _onCode(String raw) {
    if (_done) return;
    _done = true;
    HapticFeedback.mediumImpact();
    Navigator.of(context).pop(raw);
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          fit: StackFit.expand,
          children: [
            QrScannerView(onCode: _onCode, hint: widget.hint),
            Positioned(
              top: MediaQuery.paddingOf(context).top + AppSpacing.sm,
              left: AppSpacing.lg,
              child: CircleIconButton(
                icon: Icons.close_rounded,
                tooltip: ref.tr('close'),
                background: Colors.black.withValues(alpha: 0.45),
                foreground: Colors.white,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
