import 'package:flutter/widgets.dart';

/// Onglets du collecteur, dans l'ordre du dock.
enum CollectorTab { route, scan }

/// Permet à un onglet d'en ouvrir un autre (Scanner → Tournée pour la démarrer).
class CollectorNav extends InheritedWidget {
  const CollectorNav({super.key, required this.goTo, required super.child});

  final ValueChanged<CollectorTab> goTo;

  static CollectorNav of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<CollectorNav>()!;

  @override
  bool updateShouldNotify(CollectorNav old) => false;
}
