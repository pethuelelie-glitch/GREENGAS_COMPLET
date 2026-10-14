import 'package:flutter/material.dart';
import 'package:greengas/domain/models.dart';
import 'package:greengas/shared/design/design.dart';

/// Apparence d'une catégorie de récompense : couleurs des séries du desktop (docs/DESIGN_TOKENS.md §2.3).
class RewardLook {
  const RewardLook(this.icon, this.color, this.labelKey);
  final IconData icon;
  final Color color;

  /// Clé de traduction du nom de la catégorie.
  final String labelKey;

  /// Fond pâle de la catégorie (visuels, chips).
  Color get tint => color.withValues(alpha: 0.13);

  static RewardLook of(BuildContext context, RecompenseCategorie cat) {
    final c = context.colors;
    return switch (cat) {
      RecompenseCategorie.internet =>
        RewardLook(Icons.wifi_rounded, c.blue, 'rw_internet'),
      RecompenseCategorie.appel =>
        RewardLook(Icons.phone_in_talk_rounded, c.gold, 'rw_call'),
      RecompenseCategorie.bon =>
        RewardLook(Icons.redeem_rounded, c.forestInk, 'rw_voucher'),
      RecompenseCategorie.don =>
        RewardLook(Icons.park_rounded, c.olive, 'rw_donation'),
    };
  }
}
