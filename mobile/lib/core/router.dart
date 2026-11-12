import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/account/account_screen.dart';
import '../features/activity/activity_screen.dart';
import '../features/my_tasks/my_tasks_screen.dart';
import '../features/planner/planner_screen.dart';
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
  const authOnlyPaths = {'/login', '/register', '/forgot-password'};
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
            GoRoute(path: '/planner', builder: (_, __) => const PlannerScreen()),
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

  /// Khớp với splash native (pubspec.yaml → flutter_native_splash) để chuyển cảnh không bị chớp.
  @override
  Widget build(BuildContext context) {
    final dark = MediaQuery.platformBrightnessOf(context) == Brightness.dark;
    return Scaffold(
      backgroundColor: dark ? const Color(0xFF09326C) : const Color(0xFF0C66E4),
      body: Stack(children: [
        Center(
          child: Container(
            // Cùng cỡ với logo splash Android 12 (đo trên máy: ~158dp) để không "nhảy" khi chuyển cảnh
            width: 158,
            height: 158,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(37)),
            child: const Text(
              'H',
              style: TextStyle(
                color: Color(0xFF0C66E4),
                fontSize: 104,
                fontWeight: FontWeight.w800,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ),
        const Align(
          alignment: Alignment(0, 0.45),
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
          ),
        ),
      ]),
    );
  }
}
