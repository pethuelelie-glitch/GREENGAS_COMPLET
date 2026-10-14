import 'package:url_launcher/url_launcher.dart';

/// Ouvre l'itinéraire vers [latitude],[longitude] dans l'application Google Maps
/// (ou le navigateur par défaut). URL universelle, sans clé d'API.
///
/// Sert de complément à la carte `flutter_map` (OSM/OSRM) : celle-ci affiche l'itinéraire,
/// Google Maps apporte le guidage pas-à-pas. Renvoie `false` si rien ne peut l'ouvrir.
Future<bool> ouvrirItineraireGoogleMaps(
  double latitude,
  double longitude, {
  String modeDeplacement = 'driving',
}) async {
  final uri = Uri.https('www.google.com', '/maps/dir/', {
    'api': '1',
    'destination': '$latitude,$longitude',
    'travelmode': modeDeplacement,
  });
  try {
    return await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    return false; // aucune application ni navigateur ne sait ouvrir le lien
  }
}
