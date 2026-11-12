import '../../models/task.dart';

/// Các phép biến đổi dữ liệu bảng (thuần, không gọi API) — dùng cho cập nhật lạc quan và unit test.
/// Khớp với cách làm ở frontend/src/hooks/useTasks.ts và backend TaskController@move.

/// Chuyển thẻ [taskId] sang cột [listId] tại vị trí [index] (0 = trên cùng, tính trên cột đích
/// không kể thẻ đang di chuyển), rồi đánh lại position cho cột đích và cột cũ.
BoardData moveTask(BoardData board, int taskId, int listId, int index) {
  final moving = board.tasks.where((t) => t.id == taskId).firstOrNull;
  if (moving == null) return board;

  final target = board.tasksOf(listId).where((t) => t.id != taskId).toList();
  target.insert(index.clamp(0, target.length), moving.copyWith(listId: listId));

  final updated = <int, Task>{};
  for (var i = 0; i < target.length; i++) {
    updated[target[i].id] = target[i].copyWith(listId: listId, position: i);
  }
  if (moving.listId != listId) {
    final source = board.tasksOf(moving.listId).where((t) => t.id != taskId).toList();
    for (var i = 0; i < source.length; i++) {
      updated[source[i].id] = source[i].copyWith(position: i);
    }
  }
  return board.copyWith(tasks: [for (final t in board.tasks) updated[t.id] ?? t]);
}

/// Khi đang lọc, vị trí thả là vị trí trong danh sách đang hiển thị: quy đổi về vị trí thật
/// trong cột (không kể thẻ đang kéo) — giống onDragEnd ở TaskBoard.tsx.
int realDropIndex({
  required List<Task> columnTasks,
  required int draggedId,
  required bool Function(Task) isVisible,
  required int visibleIndex,
}) {
  final full = columnTasks.where((t) => t.id != draggedId).toList();
  final shown = full.where(isVisible).toList();
  if (visibleIndex < shown.length) return full.indexOf(shown[visibleIndex]);
  return shown.isEmpty ? full.length : full.indexOf(shown.last) + 1;
}

BoardData replaceTask(BoardData board, int id, Task Function(Task) update) =>
    board.copyWith(tasks: [for (final t in board.tasks) t.id == id ? update(t) : t]);

/// Thêm thẻ vào cuối cột.
BoardData appendTask(BoardData board, Task task) {
  final last = board.tasksOf(task.listId).fold<int>(-1, (m, t) => t.position > m ? t.position : m);
  return board.copyWith(tasks: [...board.tasks, task.copyWith(position: last + 1)]);
}

BoardData removeList(BoardData board, int listId) => board.copyWith(
      lists: board.lists.where((l) => l.id != listId).toList(),
      tasks: board.tasks.where((t) => t.listId != listId).toList(),
    );

/// Sắp lại cột theo thứ tự [ids].
BoardData reorderLists(BoardData board, List<int> ids) => board.copyWith(lists: [
      for (final l in board.lists) l.copyWith(position: ids.indexOf(l.id)),
    ]);
