import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/dashboard.dart';
import '../board/board_repository.dart';

/// Nhóm hiển thị ở tab "Việc của tôi".
enum MyTaskGroup {
  overdue('Quá hạn'),
  today('Hôm nay'),
  upcoming('Sắp tới'),
  noDeadline('Không có hạn'),
  done('Đã xong');

  const MyTaskGroup(this.label);
  final String label;
}

/// Chia thẻ theo nhóm (giữ thứ tự nhóm như enum); trong nhóm sắp theo hạn chót gần nhất.
Map<MyTaskGroup, List<MyTask>> groupMyTasks(List<MyTask> tasks, {DateTime? now}) {
  final n = now ?? DateTime.now();
  final today = DateTime(n.year, n.month, n.day);
  MyTaskGroup groupOf(MyTask t) {
    if (t.isDone) return MyTaskGroup.done;
    final d = t.deadline;
    if (d == null) return MyTaskGroup.noDeadline;
    final day = DateTime(d.year, d.month, d.day);
    if (day.isBefore(today)) return MyTaskGroup.overdue;
    if (day == today) return MyTaskGroup.today;
    return MyTaskGroup.upcoming;
  }

  final result = {for (final g in MyTaskGroup.values) g: <MyTask>[]};
  for (final t in tasks) {
    result[groupOf(t)]!.add(t);
  }
  for (final list in result.values) {
    list.sort((a, b) => (a.deadline ?? DateTime(9999)).compareTo(b.deadline ?? DateTime(9999)));
  }
  result.removeWhere((_, v) => v.isEmpty);
  return result;
}

class MyTasksController extends AutoDisposeAsyncNotifier<List<MyTask>> {
  ApiClient get _api => ref.read(apiClientProvider);

  @override
  Future<List<MyTask>> build() async {
    final json = await _api.get<Map<String, dynamic>>('/my-tasks');
    return (json['tasks'] as List? ?? []).whereType<Map<String, dynamic>>().map(MyTask.fromJson).toList();
  }

  Future<void> reload() async => state = await AsyncValue.guard(build);

  /// Tick xong / chưa xong ngay trong danh sách (lạc quan).
  Future<void> setDone(MyTask task, bool done) async {
    final status = done ? 'done' : 'pending';
    final previous = state.valueOrNull;
    if (previous != null) {
      state = AsyncData([for (final t in previous) t.id == task.id ? t.withStatus(status) : t]);
    }
    try {
      await _api.put('/tasks/${task.id}', {'status': status});
      ref.invalidate(boardProvider(task.projectId));
    } catch (e) {
      if (previous != null) state = AsyncData(previous);
      throw ApiException.from(e);
    }
  }
}

final myTasksProvider = AsyncNotifierProvider.autoDispose<MyTasksController, List<MyTask>>(MyTasksController.new);

final dashboardProvider = FutureProvider.autoDispose<Dashboard>((ref) async {
  final json = await ref.watch(apiClientProvider).get<Map<String, dynamic>>('/dashboard');
  return Dashboard.fromJson(json);
});
