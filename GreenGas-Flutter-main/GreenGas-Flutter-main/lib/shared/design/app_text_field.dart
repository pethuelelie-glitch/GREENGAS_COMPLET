import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:greengas/shared/design/app_colors.dart';
import 'package:greengas/shared/design/tokens.dart';

/// Champ de saisie du desktop (`Champ` + `Input`) : libellé au-dessus, contour fin, anneau vert
/// au focus. [obscure] ajoute l'œil pour afficher le mot de passe (libellés [showLabel]/[hideLabel]).
class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.label,
    this.controller,
    this.hint,
    this.prefixText,
    this.prefixIcon,
    this.keyboardType,
    this.textInputAction,
    this.validator,
    this.onChanged,
    this.onSubmitted,
    this.inputFormatters,
    this.textCapitalization = TextCapitalization.none,
    this.autofocus = false,
    this.obscure = false,
    this.showLabel,
    this.hideLabel,
    this.autofillHints,
    this.large = false,
  });

  final String label;
  final TextEditingController? controller;
  final String? hint;
  final String? prefixText;
  final IconData? prefixIcon;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final List<TextInputFormatter>? inputFormatters;
  final TextCapitalization textCapitalization;
  final bool autofocus;
  final bool obscure;
  final String? showLabel;
  final String? hideLabel;
  final Iterable<String>? autofillHints;

  /// Grande saisie centrée (poids d'une pesée).
  final bool large;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late bool _hidden = widget.obscure;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 6),
          child: Text(widget.label,
              style: t.labelMedium?.copyWith(color: c.textMuted)),
        ),
        TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          validator: widget.validator,
          onChanged: widget.onChanged,
          onFieldSubmitted: widget.onSubmitted,
          inputFormatters: widget.inputFormatters,
          textCapitalization: widget.textCapitalization,
          autofocus: widget.autofocus,
          obscureText: _hidden,
          autofillHints: widget.autofillHints,
          textAlign: widget.large ? TextAlign.center : TextAlign.start,
          style: widget.large
              ? t.headlineMedium
              : t.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: widget.hint,
            prefixText: widget.prefixText,
            prefixIcon:
                widget.prefixIcon == null ? null : Icon(widget.prefixIcon),
            contentPadding: widget.large
                ? const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg, vertical: AppSpacing.xl)
                : null,
            suffixIcon: widget.obscure
                ? IconButton(
                    tooltip: _hidden ? widget.showLabel : widget.hideLabel,
                    icon: Icon(_hidden
                        ? Icons.visibility_rounded
                        : Icons.visibility_off_rounded),
                    onPressed: () => setState(() => _hidden = !_hidden),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}
