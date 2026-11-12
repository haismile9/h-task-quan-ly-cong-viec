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
              icon: Icon(Icons.calendar_month_outlined),
              selectedIcon: Icon(Icons.calendar_month),
              label: 'Kế hoạch'),
          const NavigationDestination(
              icon: Icon(Icons.notifications_none), selectedIcon: Icon(Icons.notifications), label: 'Hoạt động'),
          NavigationDestination(icon: Avatar(name: user?.name ?? '?', size: 26), label: 'Tài khoản'),
        ],
      ),
    );
  }
}
