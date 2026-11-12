import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/env.dart';
import '../../core/theme_mode.dart';
import '../../models/dashboard.dart';
import '../../widgets/avatar.dart';
import '../auth/auth_controller.dart';
import '../my_tasks/my_tasks_repository.dart';

/// Tab "Tài khoản": hồ sơ, tổng quan công việc, cài đặt, đăng xuất.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  void _toast(BuildContext context, String text) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> _editName(BuildContext context, WidgetRef ref, String current) async {
    final controller = TextEditingController(text: current);
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Họ và tên'),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          onSubmitted: (v) => Navigator.pop(ctx, v),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Lưu')),
        ],
      ),
    );
    final text = name?.trim() ?? '';
    if (text.isEmpty || text == current) return;
    try {
      await ref.read(authProvider.notifier).updateName(text);
      if (context.mounted) _toast(context, 'Đã cập nhật họ tên');
    } catch (e) {
      if (context.mounted) _toast(context, ApiException.from(e).message);
    }
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đăng xuất?'),
        content: const Text('Bạn sẽ cần đăng nhập lại để xem các bảng của mình.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Huỷ')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Đăng xuất')),
        ],
      ),
    );
    if (ok == true) await ref.read(authProvider.notifier).logout();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final user = ref.watch(authProvider).valueOrNull;
    final dashboard = ref.watch(dashboardProvider);
    final themeMode = ref.watch(themeModeProvider);

    Widget card(List<Widget> children) => Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 16),
          color: theme.colorScheme.surface,
          clipBehavior: Clip.antiAlias,
          child: Column(children: children),
        );
    Widget heading(String text) => Padding(
          padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
          child: Text(text.toUpperCase(),
              style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w700, letterSpacing: 0.8, color: theme.colorScheme.onSurfaceVariant)),
        );

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(dashboardProvider.future),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
                child: Text('Tài khoản', style: theme.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800)),
              ),
              if (user != null)
                card([
                  ListTile(
                    contentPadding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
                    leading: Avatar(name: user.name, size: 52),
                    title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                    subtitle: Text(user.email),
                    trailing: IconButton(
                      tooltip: 'Sửa họ tên',
                      icon: const Icon(Icons.edit_outlined),
                      onPressed: () => _editName(context, ref, user.name),
                    ),
                  ),
                ]),
              heading('Tổng quan'),
              dashboard.when(
                skipLoadingOnReload: true,
                loading: () => const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => card([ListTile(title: Text(ApiException.from(e).message))]),
                data: (d) => _Overview(dashboard: d),
              ),
              heading('Cài đặt'),
              card([
                SwitchListTile(
                  secondary: const Icon(Icons.mail_outline),
                  title: const Text('Email nhắc việc sắp đến hạn'),
                  subtitle: const Text('Gửi lúc 8:00 mỗi sáng'),
                  value: user?.emailDeadlineReminders ?? true,
                  onChanged: user == null
                      ? null
                      : (v) {
                          final messenger = ScaffoldMessenger.of(context);
                          ref.read(authProvider.notifier).setDeadlineReminders(v).catchError((Object e) {
                            messenger.showSnackBar(SnackBar(content: Text(ApiException.from(e).message)));
                          });
                        },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.dark_mode_outlined),
                  title: const Text('Giao diện'),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: SegmentedButton<ThemeMode>(
                      showSelectedIcon: false,
                      segments: const [
                        ButtonSegment(value: ThemeMode.light, label: Text('Sáng')),
                        ButtonSegment(value: ThemeMode.dark, label: Text('Tối')),
                        ButtonSegment(value: ThemeMode.system, label: Text('Hệ thống')),
                      ],
                      selected: {themeMode},
                      onSelectionChanged: (s) => ref.read(themeModeProvider.notifier).set(s.first),
                    ),
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.lock_outline),
                  title: const Text('Đổi mật khẩu'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => showModalBottomSheet<void>(
                    context: context,
                    useRootNavigator: true,
                    isScrollControlled: true,
                    showDragHandle: true,
                    builder: (_) => const _ChangePasswordSheet(),
                  ),
                ),
              ]),
              card([
                ListTile(
                  leading: Icon(Icons.logout, color: theme.colorScheme.error),
                  title: Text('Đăng xuất', style: TextStyle(color: theme.colorScheme.error)),
                  onTap: () => _confirmLogout(context, ref),
                ),
              ]),
              Text('Máy chủ: ${Env.apiUrl}',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Số việc của tôi + tiến độ từng bảng (GET /dashboard).
class _Overview extends StatelessWidget {
  const _Overview({required this.dashboard});

  final Dashboard dashboard;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final mine = dashboard.mine;

    Widget stat(String label, int value, Color color) => Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(children: [
              Text('$value', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800, color: color)),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 13)),
            ]),
          ),
        );

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Row(children: [
        stat('Đã xong', mine.completed, const Color(0xFF22A06B)),
        const SizedBox(width: 8),
        stat('Chưa xong', mine.open, theme.colorScheme.primary),
        const SizedBox(width: 8),
        stat('Quá hạn', mine.overdue, theme.colorScheme.error),
      ]),
      const SizedBox(height: 4),
      Padding(
        padding: const EdgeInsets.fromLTRB(4, 4, 4, 8),
        child: Text('Thẻ được giao cho bạn ở mọi bảng',
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ),
      if (dashboard.projects.isNotEmpty)
        Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 16),
          color: theme.colorScheme.surface,
          clipBehavior: Clip.antiAlias,
          child: Column(children: [
            for (final p in dashboard.projects)
              ListTile(
                onTap: () => context.push('/boards/${p.id}'),
                title: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                subtitle: Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: p.summary.progress,
                      minHeight: 6,
                      color: const Color(0xFF22A06B),
                      backgroundColor: theme.colorScheme.surfaceContainerHighest,
                    ),
                  ),
                ),
                trailing: Text('${p.summary.completed}/${p.summary.total}',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
          ]),
        ),
    ]);
  }
}

class _ChangePasswordSheet extends ConsumerStatefulWidget {
  const _ChangePasswordSheet();

  @override
  ConsumerState<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends ConsumerState<_ChangePasswordSheet> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  ApiException? _error;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  String? get _mismatch =>
      _confirm.text.isNotEmpty && _confirm.text != _next.text ? 'Mật khẩu nhập lại không khớp' : null;

  Future<void> _submit() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final message = await ref.read(authProvider.notifier).changePassword(_current.text, _next.text);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
    } catch (e) {
      setState(() => _error = ApiException.from(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _current.text.isNotEmpty && _next.text.length >= 8 && _mismatch == null &&
        _confirm.text.isNotEmpty && !_saving;
    InputDecoration deco(String label, String field) =>
        InputDecoration(labelText: label, errorText: _error?.fieldError(field));

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('Đổi mật khẩu', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 16),
        TextField(
          controller: _current,
          obscureText: true,
          autofocus: true,
          decoration: deco('Mật khẩu hiện tại', 'current_password'),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _next,
          obscureText: true,
          decoration: deco('Mật khẩu mới (ít nhất 8 ký tự)', 'password'),
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _confirm,
          obscureText: true,
          decoration: InputDecoration(labelText: 'Nhập lại mật khẩu mới', errorText: _mismatch),
          onChanged: (_) => setState(() {}),
        ),
        if (_error != null && _error!.fieldErrors.isEmpty) ...[
          const SizedBox(height: 12),
          Text(_error!.message, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: canSubmit ? _submit : null,
          child: _saving
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Text('Đổi mật khẩu'),
        ),
      ]),
    );
  }
}
