const _months = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
const _days = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

String fmtDate(DateTime d) => '${d.day} ${_months[d.month - 1]}';
String fmtDayDate(DateTime d) => '${_days[d.weekday - 1]} ${fmtDate(d)}';

String fmtTime(DateTime d) =>
    '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';

String fmtKg(double kg) => '${kg.toStringAsFixed(1).replaceAll('.', ',')} kg';

String fmtInt(int n) {
  final s = n.abs().toString();
  final b = StringBuffer(n < 0 ? '-' : '');
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write('\u202F');
    b.write(s[i]);
  }
  return b.toString();
}

String fmtDistance(double meters) => meters < 1000
    ? '${(meters / 10).round() * 10} m'
    : '${(meters / 1000).toStringAsFixed(1).replaceAll('.', ',')} km';

/// Date et heure d'un horodatage de l'API (déjà converti en heure locale).
String fmtDateTime(DateTime d) => '${fmtDate(d)} à ${fmtTime(d)}';

/// "2026-10-13" -> "mar. 13 oct."
String fmtIsoDay(String isoDate) {
  final p = isoDate.split('-');
  return fmtDayDate(
      DateTime(int.parse(p[0]), int.parse(p[1]), int.parse(p[2])));
}
