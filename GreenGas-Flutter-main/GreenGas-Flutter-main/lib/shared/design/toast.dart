import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';

/// Toast pilule du desktop : vert forêt (succès, info) ou rouge (erreur), icône + texte.
void showToast(BuildContext context, String message, {bool error = false}) {
  final c = context.colors;
  final messenger = ScaffoldMessenger.of(context);
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(SnackBar(
    backgroundColor: error ? c.alert : c.forest,
    content: Row(
      children: [
        Icon(error ? Icons.error_rounded : Icons.check_circle_rounded,
            color: Colors.white, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(message)),
      ],
    ),
  ));
}
