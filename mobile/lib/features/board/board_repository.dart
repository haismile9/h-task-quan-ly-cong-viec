import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/project.dart';
import '../../models/task.dart';
import 'board_ops.dart' as ops;
import 'task_meta.dart';

int _tempId = -1;

/// Dữ liệu một bảng (cột + thẻ) và mọi thao tác trên bảng.
/// Mọi thao tác ghi đều "lạc quan": cập nhật màn hình ngay, gọi API, lỗi thì hoàn tác và ném
/// ApiException để màn hình báo lỗi (giống frontend/src/hooks/useTasks.ts).
class BoardController extends AutoDisposeFamilyAsyncNotifier<BoardData, int> {
  ApiClient get _api => ref.read(apiClientProvider);
  int get projectId => arg;

  @override
  Future<BoardData> build(int arg) async {
    final json = await _api.get<Map<String, dynamic>>('/projects/$arg/tasks');
    return BoardData.fromJson(json);
  }

  /// Kéo xuống để làm mới: giữ dữ liệu cũ trên màn hình trong lúc tải.
  Future<void> reload() async {
    final next = await AsyncValue.guard(() => build(arg));
    state = next;
  }

  /// Áp [update] ngay; nếu [call] lỗi thì trả lại dữ liệu trước đó.
  Future<T> _optimistic<T>(BoardData Function(BoardData) update, Future<T> Function() call) async {
    final previous = state.valueOrNull;
    if (previous != null) state = AsyncData(update(previous));
    try {
      return await call();
    } catch (e) {
      if (previous != null) state = AsyncData(previous);
      throw ApiException.from(e);
    }
  }

  void _patch(BoardData Function(BoardData) update) {
    final current = state.valueOrNull;
    if (current != null) state = AsyncData(update(current));
  }

  // ----- Thẻ -----

  /// Thêm thẻ ở cuối cột: hiện ngay với id tạm, thay bằng thẻ thật khi server trả về.
  Future<void> createTask(int listId, String title) async {
    final id = _tempId--;
    final draft = Task(id: id, projectId: projectId, listId: listId, position: 0, title: title);
    final saved = await _optimistic(
      (b) => ops.appendTask(b, draft),
      () => _api.post<Map<String, dynamic>>('/projects/$projectId/tasks', {'title': title, 'list_id': listId}),
    );
    final task = Task.fromJson(saved);
    _patch((b) => ops.replaceTask(b, id, (_) => task));
  }

  /// Sửa thẻ (tiêu đề, trạng thái, mô tả, hạn, ưu tiên, người được giao) — body như TaskInput của web.
  Future<void> updateTask(int id, Map<String, dynamic> input, Task Function(Task) preview) async {
    final saved = await _optimistic(
      (b) => ops.replaceTask(b, id, preview),
      () => _api.put<Map<String, dynamic>>('/tasks/$id', input),
    );
    final task = Task.fromJson(saved);
    // Giữ người được giao nếu server không trả về kèm
    _patch((b) => ops.replaceTask(b, id, (old) => saved.containsKey('assigned_users') ? task : task.copyWith(assignees: old.assignees)));
  }

  Future<void> setDone(Task task, bool done) {
    final status = done ? 'done' : 'pending';
    return updateTask(task.id, {'status': status}, (t) => t.copyWith(status: status));
  }

  /// Kéo thả: chuyển thẻ sang cột [listId] ở vị trí [index] (trên cột không kể thẻ đang kéo).
  Future<void> moveTask(int taskId, int listId, int index) async {
    await _optimistic(
      (b) => ops.moveTask(b, taskId, listId, index),
      () => _api.put('/tasks/$taskId/move', {'list_id': listId, 'position': index}),
    );
  }

  Future<void> deleteTask(int id) => _optimistic(
        (b) => b.copyWith(tasks: b.tasks.where((t) => t.id != id).toList()),
        () => _api.delete('/tasks/$id'),
      );

  // ----- Cột -----

  Future<void> createList(String name) async {
    final json = await _api.post<Map<String, dynamic>>('/projects/$projectId/lists', {'name': name});
    final list = TaskList.fromJson(json);
    _patch((b) => b.copyWith(lists: [...b.lists, list]));
  }

  Future<void> renameList(int id, String name) => _optimistic(
        (b) => b.copyWith(lists: [for (final l in b.lists) l.id == id ? l.copyWith(name: name) : l]),
        () => _api.put('/lists/$id', {'name': name}),
      );

  Future<void> deleteList(int id) => _optimistic((b) => ops.removeList(b, id), () => _api.delete('/lists/$id'));

  Future<void> reorderLists(List<int> ids) => _optimistic(
        (b) => ops.reorderLists(b, ids),
        () => _api.put('/projects/$projectId/lists/reorder', {'ids': ids}),
      );
}

final boardProvider =
    AsyncNotifierProvider.autoDispose.family<BoardController, BoardData, int>(BoardController.new);

/// Chi tiết dự án (tên, nền, chủ dự án, thành viên) — dùng khi mở bảng.
final projectDetailProvider = FutureProvider.autoDispose.family<Project, int>((ref, id) async {
  final json = await ref.watch(apiClientProvider).get<Map<String, dynamic>>('/projects/$id');
  return Project.fromJson(json);
});

/// Bộ lọc đang áp dụng cho từng bảng.
final boardFilterProvider = StateProvider.autoDispose.family<BoardFilter, int>((_, __) => const BoardFilter());
