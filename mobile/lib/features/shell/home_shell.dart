import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../widgets/avatar.dart';
import '../auth/auth_controller.dart';

/// Khung chính với thanh tab dưới cùng: Bảng · Việc của tôi · Hoạt động · Tài khoản.
class HomeShell extends ConsumerWidget {
  const HomeShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).valueOrNull;
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        // Bấm lại tab đang mở → về màn hình đầu của tab đó
        onDestinationSelected: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Bảng'),
          const NavigationDestination(
              icon: Icon(Icons.task_alt_outlined), selectedIcon: Icon(Icons.task_alt), label: 'Việc của tôi'),
          const NavigationDestination(
              icon: Icon(Icons.notifications_none), selectedIcon: Icon(Icons.notifications), label: 'Hoạt động'),
          NavigationDestination(icon: Avatar(name: user?.name ?? '?', size: 26), label: 'Tài khoản'),
        ],
      ),
    );
  }
}

/// Màn hình tạm cho các tab sẽ làm ở bước sau.
class ComingSoonScreen extends StatelessWidget {
  const ComingSoonScreen({super.key, required this.title, required this.step});

  final String title;
  final String step;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700))),
      body: Center(
        child: Text('Sẽ làm ở $step', style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
      ),
    );
  }
}
