import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import 'auth_api.dart';
import 'auth_widgets.dart';

enum _Step { email, code, password }

/// Quên mật khẩu: gửi mã về email → xác minh mã → đặt mật khẩu mới (như ForgotPassword.tsx).
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key, this.initialEmail});

  final String? initialEmail;

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  _Step _step = _Step.email;
  late final _email = TextEditingController(text: widget.initialEmail ?? '');
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _loading = false;
  ApiException? _error;

  AuthApi get _api => ref.read(authApiProvider);

  @override
  void dispose() {
    for (final c in [_email, _code, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await action();
    } catch (e) {
      if (mounted) setState(() => _error = ApiException.from(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _sendCode() => _run(() async {
        await _api.sendResetCode(_email.text.trim());
        setState(() => _step = _Step.code);
      });

  void _verifyCode() => _run(() async {
        await _api.verifyResetCode(_email.text.trim(), _code.text);
        setState(() => _step = _Step.password);
      });

  void _reset() => _run(() async {
        await _api.resetPassword(email: _email.text.trim(), code: _code.text, password: _password.text);
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Đã đặt lại mật khẩu. Hãy đăng nhập bằng mật khẩu mới.')));
        context.pop();
      });

  @override
  Widget build(BuildContext context) {
    final generalError = _error != null && _error!.fieldErrors.isEmpty ? _error!.message : null;
    void changed(_) => setState(() {});

    return switch (_step) {
      _Step.email => AuthScaffold(
          title: 'Quên mật khẩu',
          subtitle: const Text('Nhập email tài khoản, chúng tôi sẽ gửi mã để đặt lại mật khẩu.'),
          children: [
            TextField(
              controller: _email,
              autofocus: true,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: InputDecoration(
                labelText: 'Email',
                prefixIcon: const Icon(Icons.mail_outline),
                errorText: _error?.fieldError('email'),
              ),
              onChanged: changed,
              onSubmitted: (_) => isValidEmail(_email.text) ? _sendCode() : null,
            ),
            FormError(generalError),
            const SizedBox(height: 20),
            SubmitButton(
              label: 'Gửi mã',
              loading: _loading,
              onPressed: isValidEmail(_email.text) ? _sendCode : null,
            ),
          ],
        ),
      _Step.code => AuthScaffold(
          title: 'Nhập mã xác minh',
          subtitle: Text.rich(TextSpan(children: [
            const TextSpan(text: 'Mã 6 số đã được gửi tới\n'),
            TextSpan(text: _email.text.trim(), style: const TextStyle(fontWeight: FontWeight.w700)),
          ])),
          children: [
            CodeField(
              controller: _code,
              errorText: _error?.fieldError('code') ?? generalError,
              onChanged: (v) {
                setState(() {});
                if (v.length == 6 && !_loading) _verifyCode();
              },
            ),
            const SizedBox(height: 20),
            SubmitButton(label: 'Tiếp tục', loading: _loading, onPressed: _code.text.length == 6 ? _verifyCode : null),
            TextButton(
              onPressed: _loading ? null : () => _run(() => _api.sendResetCode(_email.text.trim())),
              child: const Text('Gửi lại mã'),
            ),
          ],
        ),
      _Step.password => AuthScaffold(
          title: 'Đặt mật khẩu mới',
          children: [
            PasswordField(
              controller: _password,
              label: 'Mật khẩu mới (ít nhất 6 ký tự)',
              errorText: _error?.fieldError('password'),
              onChanged: changed,
            ),
            const SizedBox(height: 12),
            PasswordField(
              controller: _confirm,
              label: 'Nhập lại mật khẩu mới',
              errorText: _confirm.text.isNotEmpty && _confirm.text != _password.text ? 'Mật khẩu xác nhận không khớp' : null,
              textInputAction: TextInputAction.done,
              onChanged: changed,
            ),
            FormError(generalError),
            const SizedBox(height: 20),
            SubmitButton(
              label: 'Đặt lại mật khẩu',
              loading: _loading,
              onPressed: _password.text.length >= 6 && _confirm.text == _password.text ? _reset : null,
            ),
          ],
        ),
    };
  }
}
