import 'package:flutter_test/flutter_test.dart';
import 'package:htask/features/board/board_ops.dart';
import 'package:htask/models/task.dart';

Task t(int id, int listId, int position, {String title = '', String status = 'pending'}) => Task(
      id: id,
      projectId: 1,
      listId: listId,
      position: position,
      title: title.isEmpty ? 'T$id' : title,
      status: status,
    );

BoardData board() => BoardData(
      lists: const [
        TaskList(id: 1, projectId: 1, name: 'A', position: 0),
        TaskList(id: 2, projectId: 1, name: 'B', position: 1),
      ],
      tasks: [t(10, 1, 0), t(11, 1, 1), t(12, 1, 2), t(20, 2, 0), t(21, 2, 1)],
    );

List<int> order(BoardData b, int listId) => b.tasksOf(listId).map((t) => t.id).toList();
List<int> positions(BoardData b, int listId) => b.tasksOf(listId).map((t) => t.position).toList();

void main() {
  group('moveTask', () {
    test('kéo xuống trong cùng cột', () {
      final b = moveTask(board(), 10, 1, 2);
      expect(order(b, 1), [11, 12, 10]);
      expect(positions(b, 1), [0, 1, 2]);
    });

    test('kéo lên đầu cột', () {
      final b = moveTask(board(), 12, 1, 0);
      expect(order(b, 1), [12, 10, 11]);
    });

    test('chuyển sang cột khác: đánh lại position cả hai cột', () {
      final b = moveTask(board(), 11, 2, 1);
      expect(order(b, 1), [10, 12]);
      expect(positions(b, 1), [0, 1]);
      expect(order(b, 2), [20, 11, 21]);
      expect(positions(b, 2), [0, 1, 2]);
      expect(b.tasks.firstWhere((x) => x.id == 11).listId, 2);
    });

    test('vị trí vượt quá → đặt cuối cột', () {
      expect(order(moveTask(board(), 10, 2, 99), 2), [20, 21, 10]);
    });

    test('thẻ không tồn tại → giữ nguyên', () {
      final b0 = board();
      expect(identical(moveTask(b0, 999, 1, 0), b0), isTrue);
    });
  });

  group('realDropIndex (đang lọc)', () {
    // Cột 1: 10, 11 (ẩn), 12; đang kéo thẻ 20 từ cột khác
    final column = [t(10, 1, 0), t(11, 1, 1, status: 'done'), t(12, 1, 2)];
    bool visible(Task x) => x.id != 11;

    test('thả trước thẻ hiển thị thứ 2 (12) → vị trí thật 2', () {
      expect(realDropIndex(columnTasks: column, draggedId: 20, isVisible: visible, visibleIndex: 1), 2);
    });
    test('thả cuối danh sách hiển thị → ngay sau thẻ hiển thị cuối', () {
      expect(realDropIndex(columnTasks: column, draggedId: 20, isVisible: visible, visibleIndex: 2), 3);
    });
    test('cột không có thẻ nào hiển thị → cuối cột', () {
      expect(realDropIndex(columnTasks: column, draggedId: 20, isVisible: (_) => false, visibleIndex: 0), 3);
    });
    test('kéo trong cùng cột: không tính chính thẻ đang kéo', () {
      expect(realDropIndex(columnTasks: column, draggedId: 10, isVisible: visible, visibleIndex: 1), 2);
    });
  });

  group('thao tác cột / thẻ', () {
    test('appendTask thêm vào cuối cột', () {
      final b = appendTask(board(), t(-1, 2, 0));
      expect(order(b, 2), [20, 21, -1]);
    });

    test('removeList xoá cột và thẻ bên trong', () {
      final b = removeList(board(), 1);
      expect(b.lists.map((l) => l.id), [2]);
      expect(b.tasks.map((x) => x.id), [20, 21]);
    });

    test('reorderLists đổi thứ tự cột', () {
      expect(reorderLists(board(), [2, 1]).lists.map((l) => l.id), [2, 1]);
    });

    test('replaceTask chỉ đổi đúng thẻ', () {
      final b = replaceTask(board(), 11, (x) => x.copyWith(status: 'done'));
      expect(b.tasks.where((x) => x.isDone).map((x) => x.id), [11]);
    });
  });
}
