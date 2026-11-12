import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import 'auth_api.dart';
import 'auth_controller.dart';
import 'auth_widgets.dart';

/// Đăng ký: nhập thông tin → nhận mã 6 số qua email → xác minh là vào app luôn.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;
  ApiException? _error;

  @override
  void dispose() {
    for (final c in [_name, _email, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  String? get _mismatch =>
      _confirm.text.isNotEmpty && _confirm.text != _password.text ? 'Mật khẩu xác nhận không khớp' : null;

  bool get _valid =>
      _name.text.trim().isNotEmpty &&
      isValidEmail(_email.text) &&
      _password.text.length >= 6 &&
      _confirm.text == _password.text;

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    final email = _email.text.trim();
    try {
      await ref.read(authApiProvider).register(name: _name.text.trim(), email: email, password: _password.text);
      if (mounted) context.push('/verify-email', extra: email);
    } catch (e) {
      if (mounted) setState(() => _error = ApiException.from(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    void changed(_) => setState(() {});
    return AuthScaffold(
      title: 'Tạo tài khoản',
      subtitle: const Text('Miễn phí. Mã xác minh sẽ được gửi về email của bạn.'),
      children: [
        AutofillGroup(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            TextField(
              controller: _name,
              autofocus: true,
              textCapitalization: TextCapitalization.words,
              autofillHints: const [AutofillHints.name],
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: 'Họ và tên',
                prefixIcon: const Icon(Icons.person_outline),
                errorText: _error?.fieldError('name'),
              ),
              onChanged: changed,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: 'Email',
                prefixIcon: const Icon(Icons.mail_outline),
                errorText: _error?.fieldError('email'),
              ),
              onChanged: changed,
            ),
            const SizedBox(height: 12),
            PasswordField(
              controller: _password,
              label: 'Mật khẩu (ít nhất 6 ký tự)',
              errorText: _error?.fieldError('password'),
              onChanged: changed,
            ),
            const SizedBox(height: 12),
            PasswordField(
              controller: _confirm,
              label: 'Nhập lại mật khẩu',
              errorText: _mismatch,
              textInputAction: TextInputAction.done,
              onChanged: changed,
              onSubmitted: (_) => _valid ? _submit() : null,
            ),
          ]),
        ),
        FormError(_error != null && _error!.fieldErrors.isEmpty ? _error!.message : null),
        const SizedBox(height: 20),
        SubmitButton(label: 'Đăng ký', loading: _loading, onPressed: _valid ? _submit : null),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Text('Đã có tài khoản?'),
          TextButton(onPressed: () => context.pop(), child: const Text('Đăng nhập')),
        ]),
      ],
    );
  }
}

/// Nhập mã 6 số gửi về email sau khi đăng ký.
class VerifyEmailScreen extends ConsumerStatefulWidget {
  const VerifyEmailScreen({super.key, required this.email});

  final String email;

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _code = TextEditingController();
  bool _loading = false;
  bool _resending = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Thành công → router tự chuyển vào app (trạng thái đăng nhập đổi)
      await ref.read(authProvider.notifier).verifyEmail(widget.email, _code.text);
    } catch (e) {
      if (mounted) setState(() => _error = ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() => _resending = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(authApiProvider).resendCode(widget.email);
      messenger.showSnackBar(const SnackBar(content: Text('Đã gửi lại mã xác minh')));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(ApiException.from(e).message)));
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) => AuthScaffold(
        title: 'Xác minh email',
        subtitle: Text.rich(TextSpan(children: [
          const TextSpan(text: 'Nhập mã 6 số vừa gửi tới\n'),
          TextSpan(text: widget.email, style: const TextStyle(fontWeight: FontWeight.w700)),
        ])),
        children: [
          CodeField(
            controller: _code,
            errorText: _error,
            onChanged: (v) {
              setState(() {});
              if (v.length == 6 && !_loading) _verify();
            },
          ),
          const SizedBox(height: 20),
          SubmitButton(label: 'Xác minh', loading: _loading, onPressed: _code.text.length == 6 ? _verify : null),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _resending ? null : _resend,
            child: Text(_resending ? 'Đang gửi…' : 'Không nhận được mã? Gửi lại'),
          ),
        ],
      );
}
