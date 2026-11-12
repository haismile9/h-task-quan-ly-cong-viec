import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/theme.dart';
import 'auth_api.dart';
import 'auth_controller.dart';
import 'auth_widgets.dart';

enum _Step { email, code, profile, setup }

/// Đăng ký như Trello: email → mã 6 số → họ tên + mật khẩu
/// → "Đang thiết lập tài khoản" (server tạo tài khoản + bảng mẫu) → mở thẳng bảng mẫu.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  _Step _step = _Step.email;
  final _email = TextEditingController();
  final _code = TextEditingController();
  final _name = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  ApiException? _error;

  AuthApi get _api => ref.read(authApiProvider);
  String get _mail => _email.text.trim();

  @override
  void dispose() {
    for (final c in [_email, _code, _name, _password]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<bool> _run(Future<void> Function() action) async {
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await action();
      return true;
    } catch (e) {
      if (mounted) setState(() => _error = ApiException.from(e));
      return false;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _start() => _run(() async {
        await _api.signupStart(_mail);
        setState(() => _step = _Step.code);
      });

  void _verify() => _run(() async {
        await _api.signupVerifyCode(_mail, _code.text);
        setState(() => _step = _Step.profile);
      });

  Future<void> _complete() async {
    final router = GoRouter.of(context);
    setState(() => _step = _Step.setup);
    final ok = await _run(() async {
      // Giữ màn hình "Đang thiết lập" tối thiểu một chút cho khỏi chớp
      final results = await Future.wait([
        _api.signupComplete(email: _mail, code: _code.text, name: _name.text.trim(), password: _password.text),
        Future<void>.delayed(const Duration(milliseconds: 1200)),
      ]);
      final json = results.first as Map<String, dynamic>;
      await ref.read(authProvider.notifier).signInWith(json);
      await LoginPrefs.save(email: _mail, remember: true);
      router.go('/boards/${json['project_id']}');
    });
    if (!ok && mounted) setState(() => _step = _Step.profile);
  }

  @override
  Widget build(BuildContext context) {
    final generalError = _error != null && _error!.fieldErrors.isEmpty ? _error!.message : null;
    void changed(_) => setState(() {});

    return switch (_step) {
      _Step.email => AuthScaffold(
          title: 'Đăng ký để tiếp tục',
          subtitle: const Text('Miễn phí. Bắt đầu quản lý công việc cùng nhóm của bạn.'),
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
              onSubmitted: (_) => isValidEmail(_mail) ? _start() : null,
            ),
            FormError(generalError),
            const SizedBox(height: 20),
            SubmitButton(label: 'Tiếp tục', loading: _loading, onPressed: isValidEmail(_mail) ? _start : null),
            const SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text('Đã có tài khoản?'),
              TextButton(onPressed: () => context.pop(), child: const Text('Đăng nhập')),
            ]),
          ],
        ),
      _Step.code => AuthScaffold(
          title: 'Nhập mã xác minh',
          subtitle: Text.rich(TextSpan(children: [
            const TextSpan(text: 'Mã 6 số đã được gửi tới\n'),
            TextSpan(text: _mail, style: const TextStyle(fontWeight: FontWeight.w700)),
          ])),
          children: [
            CodeField(
              controller: _code,
              errorText: _error?.fieldError('code') ?? generalError,
              onChanged: (v) {
                setState(() {});
                if (v.length == 6 && !_loading) _verify();
              },
            ),
            const SizedBox(height: 20),
            SubmitButton(label: 'Xác minh', loading: _loading, onPressed: _code.text.length == 6 ? _verify : null),
            TextButton(
              onPressed: _loading
                  ? null
                  : () async {
                      final messenger = ScaffoldMessenger.of(context);
                      if (await _run(() => _api.signupStart(_mail))) {
                        messenger.showSnackBar(const SnackBar(content: Text('Đã gửi lại mã xác minh')));
                      }
                    },
              child: const Text('Không nhận được mã? Gửi lại'),
            ),
            TextButton(
              onPressed: () => setState(() {
                _code.clear();
                _error = null;
                _step = _Step.email;
              }),
              child: const Text('Dùng email khác'),
            ),
          ],
        ),
      _Step.profile => AuthScaffold(
          title: 'Hoàn tất thiết lập tài khoản',
          subtitle: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Flexible(child: Text(_mail, overflow: TextOverflow.ellipsis)),
            const SizedBox(width: 4),
            const Icon(Icons.verified, size: 18, color: Color(0xFF22A06B)),
          ]),
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
                PasswordField(
                  controller: _password,
                  label: 'Tạo mật khẩu',
                  errorText: _error?.fieldError('password'),
                  textInputAction: TextInputAction.done,
                  onChanged: changed,
                ),
              ]),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: LinearProgressIndicator(
                value: (_password.text.length / 12).clamp(0, 1),
                minHeight: 4,
                color: _password.text.length >= 12
                    ? const Color(0xFF22A06B)
                    : _password.text.length >= 8
                        ? brandBlue
                        : const Color(0xFFE2B203),
                backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
              ),
            ),
            const SizedBox(height: 4),
            Text('Mật khẩu phải gồm ít nhất 8 ký tự',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant)),
            FormError(generalError),
            const SizedBox(height: 20),
            SubmitButton(
              label: 'Tạo tài khoản',
              loading: _loading,
              onPressed: _name.text.trim().isNotEmpty && _password.text.length >= 8 ? _complete : null,
            ),
          ],
        ),
      _Step.setup => const AuthScaffold(
          showBack: false,
          title: 'Đang thiết lập tài khoản…',
          subtitle: Text('Chúng tôi đang tạo tài khoản và bảng đầu tiên cho bạn.'),
          children: [
            SizedBox(height: 16),
            Center(child: CircularProgressIndicator()),
          ],
        ),
    };
  }
}
