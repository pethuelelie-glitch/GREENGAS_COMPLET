import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';

/// Petit client OSRM (https://project-osrm.org/) pour calculer un itinéraire entre plusieurs points.
/// N'utilise que le serveur public en démonstration : OK pour une maquette/hackathon.
/// Pour un vrai déploiement, mieux vaut un serveur privé ou Mapbox/GraphHopper.
class OsrmRouter {
  static const _base = 'https://router.project-osrm.org';

  /// Calcule une polyline (format polyline6 selon OSRM) pour un itinéraire.
  /// [points] = liste dans l'ordre (départ, ... , arrivée). Au moins 2 points.
  static Future<List<LatLng>> route(List<LatLng> points) async {
    if (points.length < 2) return List<LatLng>.from(points);
    final coords = points.map((p) => '${p.longitude},${p.latitude}').join(';');
    final uri = Uri.parse(
        '$_base/route/v1/driving/$coords?overview=full&geometries=polyline6');
    final res = await http.get(uri);
    if (res.statusCode != 200) {
      throw Exception('OSRM erreur ${res.statusCode}');
    }
    final data = jsonDecode(res.body);
    final routes = data['routes'] as List?;
    if (routes == null || routes.isEmpty) {
      throw Exception('Itinéraire introuvable');
    }
    final geom = routes[0]['geometry'] as String;
    return decodePolyline(geom);
  }

  /// Décode une polyline6 OSRM.
  static List<LatLng> decodePolyline(String encoded) {
    final len = encoded.length;
    final list = <LatLng>[];
    var index = 0;
    var lat = 0;
    var lng = 0;
    while (index < len) {
      // latitude
      var shift = 0;
      var result = 0;
      int byte;
      do {
        byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      final dlat = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      lat += dlat;
      // longitude
      shift = 0;
      result = 0;
      do {
        byte = encoded.codeUnitAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      final dlng = (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
      lng += dlng;
      list.add(LatLng(lat / 1e6, lng / 1e6));
    }
    return list;
  }
}
