import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:greengas/data/providers.dart';
import 'package:greengas/l10n/app_lang.dart';
import 'package:greengas/l10n/strings_en.dart';
import 'package:greengas/l10n/strings_fr.dart';
import 'package:greengas/l10n/strings_local.dart';

/// Textes de l'interface par langue. Clé absente dans une langue : on retombe sur le français.
///
/// Une table par langue : strings_fr.dart (référence), strings_en.dart, strings_local.dart (dioula et
/// baoulé, partiels). Pour ajouter une traduction, il suffit d'ajouter la clé dans la table de la langue.
const Map<AppLang, Map<String, String>> _tables = {
  AppLang.fr: frStrings,
  AppLang.en: enStrings,
  AppLang.dyu: dyuStrings,
  AppLang.bci: bciStrings,
};

String translate(AppLang lang, String key, {Map<String, String>? args}) {
  var text = _tables[lang]?[key] ?? frStrings[key] ?? key;
  args?.forEach((k, v) => text = text.replaceAll('{$k}', v));
  return text;
}

extension TranslateRef on WidgetRef {
  /// Texte traduit dans la langue choisie (l'écran se reconstruit si la langue change).
  String tr(String key, {Map<String, String>? args}) =>
      translate(watch(languageProvider), key, args: args);
}
