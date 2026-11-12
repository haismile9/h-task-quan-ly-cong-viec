import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/account/account_screen.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/board/board_screen.dart';
import '../features/projects/projects_screen.dart';
import '../features/shell/home_shell.dart';
import '../features/task/task_detail_screen.dart';
import '../models/project.dart';

final routerProvider = Provider<GoRouter>((ref) {
  // Báo GoRouter tính lại redirect mỗi khi trạng thái đăng nhập đổi
  final authState = ValueNotifier<AsyncValue<Object?>>(const AsyncLoading());
  ref.listen(authProvider, (_, next) => authState.value = next, fireImmediately: true);
  ref.onDispose(authState.dispose);

  return GoRouter(
    initialLocation: '/boards',
    refreshListenable: authState,
    redirect: (context, state) {
      final auth = authState.value;
      final loc = state.matchedLocation;
      if (auth.isLoading && !auth.hasValue) return loc == '/splash' ? null : '/splash';
      final signedIn = auth.valueOrNull != null;
      if (!signedIn) return loc == '/login' ? null : '/login';
      if (loc == '/login' || loc == '/splash') return '/boards';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const _SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      StatefulShellRoute.indexedStack(
        builder: (_, __, shell) => HomeShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/boards', builder: (_, __) => const ProjectsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/my-tasks',
                builder: (_, __) => const ComingSoonScreen(title: 'Việc của tôi', step: 'bước 5')),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/activity', builder: (_, __) => const ComingSoonScreen(title: 'Hoạt động', step: 'bước 5')),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/account', builder: (_, __) => const AccountScreen()),
          ]),
        ],
      ),
      // Bảng mở toàn màn hình (che thanh tab), giống app Kanban di động
      GoRoute(
        path: '/boards/:id',
        builder: (_, state) => BoardScreen(
          projectId: int.parse(state.pathParameters['id']!),
          initial: state.extra is Project ? state.extra as Project : null,
        ),
      ),
      GoRoute(
        path: '/boards/:id/cards/:taskId',
        builder: (_, state) => TaskDetailScreen(
          projectId: int.parse(state.pathParameters['id']!),
          taskId: int.parse(state.pathParameters['taskId']!),
        ),
      ),
    ],
  );
});

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: CircularProgressIndicator()));
}
