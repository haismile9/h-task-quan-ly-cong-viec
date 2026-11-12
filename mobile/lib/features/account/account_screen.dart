import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/env.dart';
import '../../widgets/avatar.dart';
import '../auth/auth_controller.dart';

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

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

    return Scaffold(
      appBar: AppBar(title: const Text('Tài khoản', style: TextStyle(fontWeight: FontWeight.w700))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user != null)
            Card(
              elevation: 0,
              color: theme.colorScheme.surface,
              child: ListTile(
                contentPadding: const EdgeInsets.all(12),
                leading: Avatar(name: user.name, size: 48),
                title: Text(user.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(user.email),
              ),
            ),
          const SizedBox(height: 16),
          Card(
            elevation: 0,
            color: theme.colorScheme.surface,
            child: ListTile(
              leading: Icon(Icons.logout, color: theme.colorScheme.error),
              title: Text('Đăng xuất', style: TextStyle(color: theme.colorScheme.error)),
              onTap: () => _confirmLogout(context, ref),
            ),
          ),
          const SizedBox(height: 24),
          Text('Máy chủ: ${Env.apiUrl}',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}
