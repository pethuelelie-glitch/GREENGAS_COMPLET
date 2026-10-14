import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';

/// Initiales d'un nom (« Awa Diop » → « AD »).
String initialsOf(String nom) {
  final parts =
      nom.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return '?';
  if (parts.length == 1) return parts.first[0].toUpperCase();
  return (parts.first[0] + parts[1][0]).toUpperCase();
}

/// Pastille d'initiales du desktop (`PucesSession`) : rond vert forêt, texte blanc.
class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.name, this.size = 48});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: context.colors.forest,
          shape: BoxShape.circle,
          border: Border.all(color: context.colors.surface, width: 2.5),
        ),
        child: Text(
          initialsOf(name),
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: size * 0.36,
          ),
        ),
      );
}
