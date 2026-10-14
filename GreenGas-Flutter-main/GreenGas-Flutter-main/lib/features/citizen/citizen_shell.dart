import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/features/citizen/citizen_map_screen.dart';
import 'package:greengas/features/citizen/citizen_nav.dart';
import 'package:greengas/features/citizen/citizen_scan_screen.dart';
import 'package:greengas/features/citizen/gains_screen.dart';
import 'package:greengas/features/citizen/shop_screen.dart';
import 'package:greengas/l10n/strings.dart';
import 'package:greengas/shared/design/design.dart';

/// Citoyen : Scanner (accueil), Boutique, Gains et Carte, dans un dock flottant.
/// Profil et paramètres s'ouvrent depuis l'avatar de l'en-tête.
class CitizenShell extends ConsumerStatefulWidget {
  const CitizenShell({super.key});

  @override
  ConsumerState<CitizenShell> createState() => _CitizenShellState();
}

class _CitizenShellState extends ConsumerState<CitizenShell> {
  CitizenTab _tab = CitizenTab.scan;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: TabSwitcher(
        index: _tab.index,
        child: switch (_tab) {
          CitizenTab.scan => const CitizenScanScreen(),
          CitizenTab.shop => const ShopScreen(),
          CitizenTab.gains => const GainsScreen(),
          CitizenTab.map => const CitizenMapScreen(),
        },
      ),
      bottomNavigationBar: FloatingDock(
        index: _tab.index,
        onSelect: (i) => setState(() => _tab = CitizenTab.values[i]),
        items: [
          DockItem(Icons.qr_code_scanner_rounded, ref.tr('nav_scan')),
          DockItem(Icons.redeem_rounded, ref.tr('nav_shop')),
          DockItem(Icons.savings_rounded, ref.tr('nav_gains')),
          DockItem(Icons.map_rounded, ref.tr('nav_map')),
        ],
      ),
    );
  }
}
