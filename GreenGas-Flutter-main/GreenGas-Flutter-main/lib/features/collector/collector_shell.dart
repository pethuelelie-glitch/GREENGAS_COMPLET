import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/features/collector/collector_nav.dart';
import 'package:greengas/features/collector/collector_scan_screen.dart';
import 'package:greengas/features/collector/tournee_screen.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Collecteur : Tournée et Scanner, dans le dock flottant. Profil depuis l'avatar de l'en-tête.
class CollectorShell extends ConsumerStatefulWidget {
  const CollectorShell({super.key});

  @override
  ConsumerState<CollectorShell> createState() => _CollectorShellState();
}

class _CollectorShellState extends ConsumerState<CollectorShell> {
  CollectorTab _tab = CollectorTab.route;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: CollectorNav(
        goTo: (t) => setState(() => _tab = t),
        child: TabSwitcher(
          index: _tab.index,
          child: switch (_tab) {
            CollectorTab.route => const TourneeScreen(),
            CollectorTab.scan => const CollectorScanScreen(),
          },
        ),
      ),
      bottomNavigationBar: FloatingDock(
        index: _tab.index,
        onSelect: (i) => setState(() => _tab = CollectorTab.values[i]),
        items: [
          DockItem(Icons.route_rounded, ref.tr('nav_route')),
          DockItem(Icons.qr_code_scanner_rounded, ref.tr('nav_scan')),
        ],
      ),
    );
  }
}
