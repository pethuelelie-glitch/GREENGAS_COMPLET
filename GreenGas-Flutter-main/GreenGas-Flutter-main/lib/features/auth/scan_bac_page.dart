import 'package:flutter/material.dart';
import 'package:greengas/domain/bac_qr.dart';
import 'package:greengas/shared/scanner_page.dart';

/// Scanne le QR d'un bac et renvoie son code (ex. `BAC-014`), ou null. Alternative à la carte.
Future<String?> scanBacCode(BuildContext context) async {
  final raw = await openScanner(context);
  return raw == null ? null : BacQr.parse(raw);
}
