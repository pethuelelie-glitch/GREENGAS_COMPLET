import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';
import 'package:greengas/shared/scan_frame.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

/// Caméra qui lit les QR codes. Appelle [onCode] avec le contenu brut lu.
///
/// L'appelant doit ignorer les appels pendant qu'il traite un code
/// (un drapeau `_busy`), voir les écrans de scan.
class QrScannerView extends ConsumerStatefulWidget {
  const QrScannerView({super.key, required this.onCode, this.hint});

  final void Function(String code) onCode;
  final String? hint;

  @override
  ConsumerState<QrScannerView> createState() => _QrScannerViewState();
}

class _QrScannerViewState extends ConsumerState<QrScannerView>
    with WidgetsBindingObserver {
  final _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    formats: const [BarcodeFormat.qrCode],
  );

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  /// Coupe la caméra quand l'app passe en arrière-plan, la relance au retour.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _controller.start().catchError((_) {});
    } else if (state == AppLifecycleState.paused) {
      _controller.stop().catchError((_) {});
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    for (final barcode in capture.barcodes) {
      final value = barcode.rawValue;
      if (value != null && value.isNotEmpty) {
        widget.onCode(value);
        break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Stack(
      fit: StackFit.expand,
      children: [
        MobileScanner(
          controller: _controller,
          onDetect: _onDetect,
          errorBuilder: (context, error, child) => _ScannerError(
            message: ref.tr(
                error.errorCode == MobileScannerErrorCode.permissionDenied
                    ? 'camera_denied'
                    : 'camera_unavailable'),
          ),
        ),
        const IgnorePointer(child: Center(child: ScanFrame(size: 250))),
        Positioned(
          left: AppSpacing.xxl,
          right: AppSpacing.xxl,
          bottom: AppSpacing.xxxl + MediaQuery.paddingOf(context).bottom,
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg, vertical: AppSpacing.md),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(AppRadii.full),
              ),
              child: Text(
                widget.hint ?? ref.tr('scan_frame_hint'),
                textAlign: TextAlign.center,
                style: t.labelLarge?.copyWith(color: Colors.white),
              ),
            ),
          ),
        ),
        Positioned(
          top: MediaQuery.paddingOf(context).top + AppSpacing.sm,
          right: AppSpacing.lg,
          child: ValueListenableBuilder<MobileScannerState>(
            valueListenable: _controller,
            builder: (context, state, _) {
              // La lampe n'est proposée que si l'appareil en a une et que la caméra tourne
              // (sinon `toggleTorch()` lève une exception avant l'initialisation).
              final canTorch =
                  state.isRunning && state.torchState != TorchState.unavailable;
              if (!canTorch) return const SizedBox.shrink();
              final on = state.torchState == TorchState.on;
              return CircleIconButton(
                icon: on
                    ? Icons.flashlight_on_rounded
                    : Icons.flashlight_off_rounded,
                tooltip: ref.tr(on ? 'torch_off' : 'torch_on'),
                background:
                    on ? Colors.white : Colors.black.withValues(alpha: 0.45),
                foreground: on ? Colors.black : Colors.white,
                onPressed: () => _controller.toggleTorch().catchError((_) {}),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ScannerError extends StatelessWidget {
  const _ScannerError({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) => Container(
        color: context.colors.forest,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.no_photography_rounded,
                color: Colors.white, size: 48),
            const SizedBox(height: AppSpacing.lg),
            Text(message,
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .bodyLarge
                    ?.copyWith(color: Colors.white)),
          ],
        ),
      );
}
