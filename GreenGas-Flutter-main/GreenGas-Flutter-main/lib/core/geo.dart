import 'dart:math';

/// Distance en mètres entre deux points GPS (formule de haversine).
/// Sert seulement à l'affichage (tri des bacs proches) : aucune règle métier.
double distanceMeters(double lat1, double lng1, double lat2, double lng2) {
  const earth = 6371000.0;
  double rad(double d) => d * pi / 180;
  final dLat = rad(lat2 - lat1);
  final dLng = rad(lng2 - lng1);
  final a = pow(sin(dLat / 2), 2) +
      cos(rad(lat1)) * cos(rad(lat2)) * pow(sin(dLng / 2), 2);
  return earth * 2 * atan2(sqrt(a), sqrt(1 - a));
}
