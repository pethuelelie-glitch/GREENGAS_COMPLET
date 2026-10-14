import 'package:flutter/material.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/shared/design/design.dart';

/// État d'un bac dans la tournée, déduit de la collecte du serveur (rien n'est calculé ici).
enum BacEtat {
  aCollecter('bin_to_collect', Tone.warn),
  enCours('bin_in_progress', Tone.neutral),
  collecte('bin_collected', Tone.ok);

  const BacEtat(this.labelKey, this.tone);
  final String labelKey;
  final Tone tone;

  /// Couleur de l'épingle sur la carte.
  Color pinColor(AppColors c) => switch (this) {
        BacEtat.aCollecter => c.warn,
        BacEtat.enCours => c.blue,
        BacEtat.collecte => c.neutral,
      };
}

/// Un bac de la tournée, sa collecte éventuelle et la distance depuis le collecteur.
class BacLine {
  const BacLine(this.bac, this.collecte, this.metres);
  final Bac bac;
  final Collecte? collecte;
  final double metres;

  BacEtat get etat => switch (collecte?.statut) {
        null => BacEtat.aCollecter,
        StatutCollecte.validee => BacEtat.collecte,
        _ => BacEtat.enCours,
      };
}

/// Libellé traduit du statut d'une tournée.
String tourneeStatusKey(StatutTournee s) => switch (s) {
      StatutTournee.planifiee => 'route_planned',
      StatutTournee.enCours => 'route_in_progress',
      StatutTournee.collectee => 'route_collected',
      StatutTournee.triee => 'route_sorted',
    };
