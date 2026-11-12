import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme.dart';

/// Khung chung cho các màn hình chưa đăng nhập: logo, tiêu đề, nội dung giữa màn hình.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({super.key, required this.title, this.subtitle, required this.children, this.showBack = true});

  final String title;
  final Widget? subtitle;
  final List<Widget> children;
  final bool showBack;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: showBack ? AppBar() : null,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                const HTaskLogo(),
                const SizedBox(height: 28),
                Text(title,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                if (subtitle != null) ...[
                  const SizedBox(height: 6),
                  DefaultTextStyle.merge(
                    textAlign: TextAlign.center,
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                    child: subtitle!,
                  ),
                ],
                const SizedBox(height: 24),
                ...children,
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

class HTaskLogo extends StatelessWidget {
  const HTaskLogo({super.key});

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: brandBlue, borderRadius: BorderRadius.circular(10)),
            child: const Text('H',
                style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic)),
          ),
          const SizedBox(width: 10),
          Text('H-Task',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
        ],
      );
}

/// Ô nhập mã 6 số (chỉ nhận chữ số, tự điền mã từ SMS/email nếu hệ điều hành gợi ý).
class CodeField extends StatelessWidget {
  const CodeField({super.key, required this.controller, this.errorText, this.onChanged, this.onSubmitted});

  final TextEditingController controller;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) => TextField(
        controller: controller,
        autofocus: true,
        keyboardType: TextInputType.number,
        autofillHints: const [AutofillHints.oneTimeCode],
        inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w700),
        decoration: InputDecoration(hintText: '••••••', errorText: errorText, counterText: ''),
        onChanged: onChanged,
        onSubmitted: onSubmitted,
      );
}

/// Nút chính có vòng xoay khi đang gửi.
class SubmitButton extends StatelessWidget {
  const SubmitButton({super.key, required this.label, required this.loading, required this.onPressed});

  final String label;
  final bool loading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => FilledButton(
        style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
        onPressed: loading ? null : onPressed,
        child: loading
            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : Text(label),
      );
}

/// Ô mật khẩu có nút ẩn/hiện.
class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.controller,
    required this.label,
    this.errorText,
    this.onChanged,
    this.autofillHints = const [AutofillHints.newPassword],
    this.textInputAction = TextInputAction.next,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String label;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final Iterable<String> autofillHints;
  final TextInputAction textInputAction;
  final ValueChanged<String>? onSubmitted;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) => TextField(
        controller: widget.controller,
        obscureText: _obscure,
        autofillHints: widget.autofillHints,
        textInputAction: widget.textInputAction,
        onSubmitted: widget.onSubmitted,
        decoration: InputDecoration(
          labelText: widget.label,
          prefixIcon: const Icon(Icons.lock_outline),
          errorText: widget.errorText,
          suffixIcon: IconButton(
            tooltip: _obscure ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
            icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
            onPressed: () => setState(() => _obscure = !_obscure),
          ),
        ),
        onChanged: widget.onChanged,
      );
}

/// Dòng báo lỗi chung (lỗi không gắn với ô nào).
class FormError extends StatelessWidget {
  const FormError(this.message, {super.key});

  final String? message;

  @override
  Widget build(BuildContext context) => message == null
      ? const SizedBox.shrink()
      : Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Text(message!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        );
}

bool isValidEmail(String s) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s.trim());
