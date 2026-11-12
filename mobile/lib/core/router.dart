import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/account/account_screen.dart';
import '../features/activity/activity_screen.dart';
import '../features/my_tasks/my_tasks_screen.dart';
import '../features/auth/accept_invitation_screen.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/forgot_password_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
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

  // Trang mở được khi chưa đăng nhập; trang lời mời mở được cả khi đã đăng nhập.
  const authOnlyPaths = {'/login', '/register', '/verify-email', '/forgot-password'};
  bool isPublic(String loc) => authOnlyPaths.contains(loc) || loc.startsWith('/invite/');

  // Link mở app (vd. htask://app/invite/<token>) trong lúc đang khôi phục phiên → nhớ lại để mở sau
  String? pending;

  return GoRouter(
    initialLocation: '/boards',
    refreshListenable: authState,
    redirect: (context, state) {
      final auth = authState.value;
      var loc = state.matchedLocation;
      if (auth.isLoading && !auth.hasValue) {
        if (loc != '/splash') pending = loc;
        return loc == '/splash' ? null : '/splash';
      }
      String? target;
      if (loc == '/splash') {
        loc = target = pending ?? '/boards';
        pending = null;
      }
      final signedIn = auth.valueOrNull != null;
      if (!signedIn) return isPublic(loc) ? target : '/login';
      if (authOnlyPaths.contains(loc)) return '/boards';
      return target;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const _SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/verify-email', builder: (_, state) => VerifyEmailScreen(email: state.extra as String? ?? '')),
      GoRoute(
        path: '/forgot-password',
        builder: (_, state) => ForgotPasswordScreen(initialEmail: state.extra as String?),
      ),
      GoRoute(
        path: '/invite/:token',
        builder: (_, state) => AcceptInvitationScreen(token: state.pathParameters['token']!),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, shell) => HomeShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/boards', builder: (_, __) => const ProjectsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/my-tasks', builder: (_, __) => const MyTasksScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/activity', builder: (_, __) => const ActivityScreen()),
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
