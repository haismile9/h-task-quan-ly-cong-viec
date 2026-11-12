import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/backgrounds.dart';
import 'auth_api.dart';
import 'auth_controller.dart';
import 'auth_widgets.dart';

final _invitationProvider =
    FutureProvider.autoDispose.family<InvitationInfo, String>((ref, token) => ref.read(authApiProvider).invitation(token));

enum _Step { intro, code, profile }

/// Mở từ link mời (htask://app/invite/<token>): người chưa có tài khoản xác minh mã gửi về email,
/// đặt họ tên + mật khẩu là vào thẳng bảng; người đã có tài khoản chỉ cần đăng nhập (như AcceptInvitation.tsx).
class AcceptInvitationScreen extends ConsumerStatefulWidget {
  const AcceptInvitationScreen({super.key, required this.token});

  final String token;

  @override
  ConsumerState<AcceptInvitationScreen> createState() => _AcceptInvitationScreenState();
}

class _AcceptInvitationScreenState extends ConsumerState<AcceptInvitationScreen> {
  _Step _step = _Step.intro;
  final _code = TextEditingController();
  final _name = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  ApiException? _error;

  AuthApi get _api => ref.read(authApiProvider);

  @override
  void dispose() {
    for (final c in [_code, _name, _password]) {
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

  Widget _projectCard(InvitationInfo invite) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 20),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SizedBox(height: 56, child: BoardBackground(value: invite.projectBackground, thumb: true)),
        Padding(
          padding: const EdgeInsets.all(12),
          child: Text.rich(TextSpan(children: [
            TextSpan(text: invite.inviterName ?? 'Một thành viên', style: const TextStyle(fontWeight: FontWeight.w700)),
            const TextSpan(text: ' mời bạn vào bảng '),
            TextSpan(
              text: invite.projectName,
              style: TextStyle(fontWeight: FontWeight.w700, color: theme.colorScheme.primary),
            ),
          ])),
        ),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final invite = ref.watch(_invitationProvider(widget.token));
    final me = ref.watch(authProvider).valueOrNull;
    final generalError = _error != null && _error!.fieldErrors.isEmpty ? _error!.message : null;

    return invite.when(
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (e, _) => AuthScaffold(
        title: 'Không mở được lời mời',
        subtitle: Text(ApiException.from(e).message),
        children: [
          SubmitButton(label: 'Về trang chủ', loading: false, onPressed: () => context.go('/boards')),
        ],
      ),
      data: (inv) {
        // Email đã có tài khoản (hoặc lời mời đã dùng): chỉ cần đăng nhập.
        if (inv.hasAccount || inv.accepted) {
          final signedInAsInvitee = me != null && me.email.toLowerCase() == inv.email.toLowerCase();
          return AuthScaffold(
            title: 'Bạn đã có tài khoản',
            subtitle: Text.rich(TextSpan(children: [
              const TextSpan(text: 'Lời mời dành cho '),
              TextSpan(text: inv.email, style: const TextStyle(fontWeight: FontWeight.w700)),
            ])),
            children: [
              _projectCard(inv),
              if (signedInAsInvitee)
                SubmitButton(
                  label: 'Mở bảng',
                  loading: false,
                  onPressed: () => context.go('/boards/${inv.projectId}'),
                )
              else ...[
                if (me != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text('Bạn đang đăng nhập bằng ${me.email}. Hãy đăng xuất rồi đăng nhập bằng ${inv.email}.',
                        textAlign: TextAlign.center),
                  ),
                SubmitButton(
                  label: me == null ? 'Đăng nhập để vào bảng' : 'Đăng xuất',
                  loading: false,
                  onPressed: () async {
                    if (me != null) await ref.read(authProvider.notifier).logout();
                    if (context.mounted) context.go('/login');
                  },
                ),
              ],
            ],
          );
        }

        return switch (_step) {
          _Step.intro => AuthScaffold(
              title: 'Tham gia H-Task',
              subtitle: Text.rich(TextSpan(children: [
                const TextSpan(text: 'Chúng tôi sẽ gửi mã xác minh tới\n'),
                TextSpan(text: inv.email, style: const TextStyle(fontWeight: FontWeight.w700)),
              ])),
              children: [
                _projectCard(inv),
                FormError(generalError),
                const SizedBox(height: 8),
                SubmitButton(
                  label: 'Gửi mã xác minh',
                  loading: _loading,
                  onPressed: () => _run(() async {
                    await _api.sendInvitationCode(widget.token);
                    setState(() => _step = _Step.code);
                  }),
                ),
              ],
            ),
          _Step.code => AuthScaffold(
              title: 'Nhập mã xác minh',
              subtitle: Text.rich(TextSpan(children: [
                const TextSpan(text: 'Mã 6 số đã được gửi tới\n'),
                TextSpan(text: inv.email, style: const TextStyle(fontWeight: FontWeight.w700)),
              ])),
              children: [
                CodeField(
                  controller: _code,
                  errorText: _error?.fieldError('code') ?? generalError,
                  onChanged: (v) {
                    setState(() {});
                    if (v.length == 6 && !_loading) {
                      _run(() async {
                        await _api.verifyInvitationCode(widget.token, v);
                        setState(() => _step = _Step.profile);
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _loading ? null : () => _run(() => _api.sendInvitationCode(widget.token)),
                  child: const Text('Gửi lại mã'),
                ),
              ],
            ),
          _Step.profile => AuthScaffold(
              title: 'Hoàn tất tài khoản',
              subtitle: Text(inv.email),
              children: [
                TextField(
                  controller: _name,
                  autofocus: true,
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    labelText: 'Họ và tên',
                    prefixIcon: const Icon(Icons.person_outline),
                    errorText: _error?.fieldError('name'),
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 12),
                PasswordField(
                  controller: _password,
                  label: 'Mật khẩu (ít nhất 8 ký tự)',
                  errorText: _error?.fieldError('password'),
                  textInputAction: TextInputAction.done,
                  onChanged: (_) => setState(() {}),
                ),
                FormError(generalError),
                const SizedBox(height: 20),
                SubmitButton(
                  label: 'Tạo tài khoản và vào bảng',
                  loading: _loading,
                  onPressed: _name.text.trim().isEmpty || _password.text.length < 8
                      ? null
                      : () => _run(() async {
                            final router = GoRouter.of(context);
                            final json = await _api.acceptInvitation(
                              widget.token,
                              code: _code.text,
                              name: _name.text.trim(),
                              password: _password.text,
                            );
                            await ref.read(authProvider.notifier).signInWith(json);
                            router.go('/boards/${json['project_id'] ?? inv.projectId}');
                          }),
                ),
              ],
            ),
        };
      },
    );
  }
}
