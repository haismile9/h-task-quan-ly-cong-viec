import 'package:flutter_test/flutter_test.dart';
import 'package:htask/features/board/task_meta.dart';
import 'package:htask/models/task.dart';

Task _task({
  int id = 1,
  String title = 'Thẻ',
  String? description,
  String status = 'pending',
  TaskPriority priority = TaskPriority.medium,
  DateTime? deadline,
  List<int> assignees = const [],
}) =>
    Task.fromJson({
      'id': id,
      'project_id': 1,
      'list_id': 1,
      'position': 0,
      'title': title,
      'description': description,
      'status': status,
      'priority': priority.name,
      'deadline': deadline?.toIso8601String(),
      'assigned_users': [for (final u in assignees) {'id': u, 'name': 'User $u', 'email': 'u$u@x.com'}],
    });

void main() {
  group('BoardData.fromJson', () {
    final board = BoardData.fromJson({
      'lists': [
        {'id': 2, 'project_id': 1, 'name': 'Đang làm', 'position': 1},
        {'id': 1, 'project_id': 1, 'name': 'Chờ làm', 'position': 0},
      ],
      'tasks': [
        {'id': 10, 'project_id': 1, 'list_id': 1, 'position': 1, 'title': 'B', 'status': 'done', 'priority': 'high',
         'deadline': '2026-11-20', 'assigned_users': [{'id': 5, 'name': 'Hai', 'email': 'h@x.com'}]},
        {'id': 11, 'project_id': 1, 'list_id': 1, 'position': 0, 'title': 'A', 'status': 'in_progress',
         'priority': 'weird', 'deadline': null},
        {'id': 12, 'project_id': 1, 'list_id': 2, 'position': 0, 'title': 'C',
         'deadline': '2026-11-21T00:00:00.000000Z'},
      ],
      'user': {'id': 5, 'role': 'member'},
    });

    test('cột sắp theo position', () {
      expect(board.lists.map((l) => l.name), ['Chờ làm', 'Đang làm']);
    });

    test('thẻ của từng cột sắp theo position', () {
      expect(board.tasksOf(1).map((t) => t.title), ['A', 'B']);
      expect(board.tasksOf(2).map((t) => t.title), ['C']);
    });

    test('đọc trạng thái, ưu tiên, hạn chót, người được giao', () {
      final b = board.tasks.firstWhere((t) => t.id == 10);
      expect(b.isDone, isTrue);
      expect(b.priority, TaskPriority.high);
      expect(b.deadline, DateTime(2026, 11, 20));
      expect(b.assignees.single.name, 'Hai');

      final a = board.tasks.firstWhere((t) => t.id == 11);
      expect(a.isDone, isFalse, reason: 'in_progress (dữ liệu cũ) vẫn là chưa xong');
      expect(a.priority, TaskPriority.medium, reason: 'giá trị lạ → mặc định medium');
      expect(a.deadline, isNull);

      expect(board.tasks.firstWhere((t) => t.id == 12).deadline, DateTime(2026, 11, 21));
    });
  });

  group('deadlineState', () {
    final now = DateTime(2026, 11, 12, 15, 30);
    test('không có hạn → null', () => expect(deadlineState(_task(), now: now), isNull));
    test('đã xong', () => expect(deadlineState(_task(status: 'done', deadline: DateTime(2026, 1, 1)), now: now),
        DeadlineState.done));
    test('quá hạn', () => expect(deadlineState(_task(deadline: DateTime(2026, 11, 11)), now: now), DeadlineState.overdue));
    test('hôm nay là sắp đến hạn', () => expect(deadlineState(_task(deadline: DateTime(2026, 11, 12)), now: now),
        DeadlineState.soon));
    test('2 ngày nữa vẫn là sắp đến hạn', () => expect(deadlineState(_task(deadline: DateTime(2026, 11, 14)), now: now),
        DeadlineState.soon));
    test('3 ngày nữa là bình thường', () => expect(deadlineState(_task(deadline: DateTime(2026, 11, 15)), now: now),
        DeadlineState.normal));
  });

  group('BoardFilter', () {
    final tasks = [
      _task(id: 1, title: 'Thiết kế logo', priority: TaskPriority.high, assignees: [5]),
      _task(id: 2, title: 'Viết API', description: 'endpoint đăng nhập', priority: TaskPriority.low),
      _task(id: 3, title: 'Họp nhóm', assignees: [7]),
    ];
    List<int> ids(BoardFilter f) => tasks.where((t) => f.matches(t, userId: 5)).map((t) => t.id).toList();

    test('không lọc → tất cả', () => expect(ids(const BoardFilter()), [1, 2, 3]));
    test('từ khoá khớp tiêu đề hoặc mô tả, không phân biệt hoa thường', () {
      expect(ids(const BoardFilter(keyword: 'LOGO')), [1]);
      expect(ids(const BoardFilter(keyword: 'đăng nhập')), [2]);
    });
    test('chỉ thẻ của tôi', () => expect(ids(const BoardFilter(onlyMine: true)), [1]));
    test('theo độ ưu tiên', () => expect(ids(const BoardFilter(priorities: {TaskPriority.low, TaskPriority.medium})), [2, 3]));
    test('đếm số bộ lọc', () =>
        expect(const BoardFilter(keyword: 'a', onlyMine: true, priorities: {TaskPriority.high}).count, 3));
  });
}
