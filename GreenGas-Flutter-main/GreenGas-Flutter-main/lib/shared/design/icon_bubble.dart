import 'package:flutter/material.dart';

/// Icône dans un rond teinté (tuiles, catégories, états vides).
class IconBubble extends StatelessWidget {
  const IconBubble({
    super.key,
    required this.icon,
    required this.color,
    required this.background,
    this.size = 44,
    this.iconSize,
  });

  final IconData icon;
  final Color color;
  final Color background;
  final double size;
  final double? iconSize;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: background, shape: BoxShape.circle),
        child: Icon(icon, color: color, size: iconSize ?? size * 0.5),
      );
}
