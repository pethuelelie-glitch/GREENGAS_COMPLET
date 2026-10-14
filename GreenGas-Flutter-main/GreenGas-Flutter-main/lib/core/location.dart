import 'package:geolocator/geolocator.dart';
import 'package:greengas/core/config.dart';
import 'package:greengas/core/geo.dart';

class UserLocation {
  const UserLocation(this.lat, this.lng, {this.isFallback = false});
  final double lat;
  final double lng;

  /// true quand le GPS est refusé ou indisponible (position de démonstration).
  final bool isFallback;
}

class LocationService {
  const LocationService._();

  static const _demo = UserLocation(
    AppConfig.demoLat,
    AppConfig.demoLng,
    isFallback: true,
  );

  /// Position réelle, ou null si refusée / indisponible (le scan est alors envoyé sans position).
  static Future<UserLocation?> currentOrNull() async {
    final loc = await currentOrDemo();
    return loc.isFallback ? null : loc;
  }

  static Future<UserLocation> currentOrDemo() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return _demo;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return _demo;
      }
      final p = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 8),
        ),
      );
      return UserLocation(p.latitude, p.longitude);
    } catch (_) {
      return _demo;
    }
  }

  static double meters(double lat1, double lng1, double lat2, double lng2) =>
      distanceMeters(lat1, lng1, lat2, lng2);
}
