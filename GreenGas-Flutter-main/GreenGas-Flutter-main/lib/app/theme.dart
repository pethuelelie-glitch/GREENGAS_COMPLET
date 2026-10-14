import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/tokens.dart';
import 'package:greengas/shared/design/typography.dart';

/// Thème Material 3 construit sur les jetons du desktop (docs/DESIGN_TOKENS.md).
/// Les couleurs propres à GreenGas sont lues via `context.colors` ([AppColors]).
abstract final class AppTheme {
  static ThemeData get light => _build(AppColors.light, Brightness.light);
  static ThemeData get dark => _build(AppColors.dark, Brightness.dark);

  static ThemeData _build(AppColors c, Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final scheme = ColorScheme(
      brightness: brightness,
      primary: c.primary,
      onPrimary: c.onPrimary,
      primaryContainer: c.greenPale,
      onPrimaryContainer: c.forestInk,
      secondary: c.green,
      onSecondary: dark ? c.background : Colors.white,
      secondaryContainer: c.greenPale,
      onSecondaryContainer: c.forestInk,
      tertiary: c.gold,
      onTertiary: Colors.white,
      tertiaryContainer: c.goldPale,
      onTertiaryContainer: c.goldText,
      error: c.alert,
      onError: Colors.white,
      errorContainer: c.alertBg,
      onErrorContainer: c.alertText,
      surface: c.surface,
      onSurface: c.text,
      onSurfaceVariant: c.textMuted,
      surfaceContainerLowest: c.surface,
      surfaceContainerLow: c.surface,
      surfaceContainer: c.surface,
      surfaceContainerHigh: c.surface,
      surfaceContainerHighest: c.greenPale,
      outline: c.border,
      outlineVariant: c.border,
      shadow: Colors.black,
      scrim: c.scrim,
      inverseSurface: c.forest,
      onInverseSurface: Colors.white,
      inversePrimary: c.onForestMuted,
    );
    final text = AppTypography.textTheme(c.text, c.textMuted);
    final pill = WidgetStatePropertyAll<OutlinedBorder>(RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadii.full)));
    OutlineInputBorder field(Color color, double width) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.field),
          borderSide: BorderSide(color: color, width: width),
        );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      extensions: [c],
      fontFamily: AppTypography.family,
      textTheme: text,
      scaffoldBackgroundColor: c.background,
      canvasColor: c.background,
      splashFactory: InkSparkle.splashFactory,
      dividerTheme: DividerThemeData(color: c.border, thickness: 1, space: 1),
      iconTheme: IconThemeData(color: c.text, size: 22),
      appBarTheme: AppBarTheme(
        backgroundColor: c.background,
        foregroundColor: c.text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: text.titleLarge,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: ButtonStyle(
          minimumSize: const WidgetStatePropertyAll(Size(64, 52)),
          padding: const WidgetStatePropertyAll(
              EdgeInsets.symmetric(horizontal: 24)),
          shape: pill,
          textStyle: WidgetStatePropertyAll(text.labelLarge),
          backgroundColor: WidgetStateProperty.resolveWith((s) =>
              s.contains(WidgetState.disabled)
                  ? c.primary.withValues(alpha: 0.4)
                  : c.primary),
          foregroundColor: WidgetStateProperty.resolveWith((s) =>
              s.contains(WidgetState.disabled)
                  ? c.onPrimary.withValues(alpha: 0.8)
                  : c.onPrimary),
          overlayColor:
              WidgetStatePropertyAll(c.onPrimary.withValues(alpha: 0.08)),
          elevation: const WidgetStatePropertyAll(0),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: ButtonStyle(
          minimumSize: const WidgetStatePropertyAll(Size(64, 52)),
          padding: const WidgetStatePropertyAll(
              EdgeInsets.symmetric(horizontal: 22)),
          shape: pill,
          textStyle: WidgetStatePropertyAll(text.labelLarge),
          foregroundColor: WidgetStatePropertyAll(c.forestInk),
          backgroundColor: WidgetStatePropertyAll(c.surface),
          side: WidgetStatePropertyAll(
              BorderSide(color: c.forestInk, width: 1.5)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: ButtonStyle(
          minimumSize: const WidgetStatePropertyAll(Size(48, 48)),
          shape: pill,
          textStyle: WidgetStatePropertyAll(text.labelLarge),
          foregroundColor: WidgetStatePropertyAll(c.forestInk),
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: ButtonStyle(
          minimumSize: const WidgetStatePropertyAll(Size(48, 48)),
          foregroundColor: WidgetStatePropertyAll(c.text),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: c.surface,
        hintStyle: text.bodyMedium?.copyWith(color: c.textMuted),
        prefixStyle: text.bodyLarge
            ?.copyWith(color: c.textMuted, fontWeight: FontWeight.w600),
        prefixIconColor: c.textMuted,
        suffixIconColor: c.textMuted,
        errorStyle: text.labelMedium?.copyWith(color: c.alert),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        border: field(c.border, 1),
        enabledBorder: field(c.border, 1),
        focusedBorder: field(c.green, 2),
        errorBorder: field(c.alert, 1.5),
        focusedErrorBorder: field(c.alert, 2),
        disabledBorder: field(c.border, 1),
      ),
      chipTheme: ChipThemeData(
        shape: const StadiumBorder(),
        side: BorderSide.none,
        backgroundColor: c.surface,
        selectedColor: c.primary,
        checkmarkColor: c.onPrimary,
        showCheckmark: false,
        labelStyle: text.labelMedium,
        secondaryLabelStyle: text.labelMedium?.copyWith(color: c.onPrimary),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        elevation: 0,
        pressElevation: 0,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((s) =>
            s.contains(WidgetState.selected) ? c.onPrimary : c.textMuted),
        trackColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? c.primary : c.greenPale),
        trackOutlineColor: WidgetStateProperty.resolveWith(
            (s) => s.contains(WidgetState.selected) ? c.primary : c.border),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: c.green,
        linearTrackColor: c.greenPale,
        circularTrackColor: Colors.transparent,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: c.forest,
        contentTextStyle: text.labelLarge?.copyWith(color: Colors.white),
        actionTextColor: c.onForestMuted,
        shape: const StadiumBorder(),
        elevation: 6,
        insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 112),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        modalBarrierColor: c.scrim,
        showDragHandle: true,
        dragHandleColor: c.border,
        shape: const RoundedRectangleBorder(
            borderRadius:
                BorderRadius.vertical(top: Radius.circular(AppRadii.sheet))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: c.surface,
        surfaceTintColor: Colors.transparent,
        barrierColor: c.scrim,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.card)),
        titleTextStyle: text.titleLarge,
        contentTextStyle: text.bodyMedium,
      ),
      listTileTheme: ListTileThemeData(
        iconColor: c.forestInk,
        titleTextStyle: text.titleMedium,
        subtitleTextStyle: text.bodySmall,
        minVerticalPadding: 12,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.tile)),
      ),
      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: dark ? c.backgroundDeep : c.text,
          borderRadius: BorderRadius.circular(AppRadii.md),
        ),
        textStyle: text.labelMedium?.copyWith(color: Colors.white),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(builders: {
        TargetPlatform.android: _FadeRiseTransitionsBuilder(),
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.windows: _FadeRiseTransitionsBuilder(),
        TargetPlatform.linux: _FadeRiseTransitionsBuilder(),
        TargetPlatform.macOS: _FadeRiseTransitionsBuilder(),
      }),
    );
  }
}

/// Transition de page du desktop : fondu + léger glissement vers le haut (320 ms, `EASE_SORTIE`).
class _FadeRiseTransitionsBuilder extends PageTransitionsBuilder {
  const _FadeRiseTransitionsBuilder();

  @override
  Duration get transitionDuration => AppMotion.page;

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(
        parent: animation, curve: AppMotion.out, reverseCurve: Curves.easeIn);
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, 0.04), end: Offset.zero)
            .animate(curved),
        child: child,
      ),
    );
  }
}
