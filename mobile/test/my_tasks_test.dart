import 'package:flutter_test/flutter_test.dart';
import 'package:htask/features/my_tasks/my_tasks_repository.dart';
import 'package:htask/models/dashboard.dart';
import 'package:htask/models/user.dart';

MyTask t(int id, {String? deadline, String status = 'pending'}) => MyTask.fromJson({
      'id': id,
      'title': 'T$id',
      'project_id': '17',
      'project_name': 'Bảng',
      'list_name': 'Cần làm',
      'status': status,
      'priority': 'high',
      'deadline': deadline,
    });

void main() {
  final now = DateTime(2026, 11, 12, 15);

  test('chia nhóm theo hạn chót, đúng thứ tự nhóm, bỏ nhóm rỗng', () {
    final groups = groupMyTasks([
      t(1, deadline: '2026-11-20'),
      t(2, deadline: '2026-11-10'),
      t(3),
      t(4, deadline: '2026-11-12'),
      t(5, deadline: '2026-11-01', status: 'done'),
      t(6, deadline: '2026-11-14'),
    ], now: now);

    expect(groups.keys, [
      MyTaskGroup.overdue,
      MyTaskGroup.today,
      MyTaskGroup.upcoming,
      MyTaskGroup.noDeadline,
      MyTaskGroup.done,
    ]);
    expect(groups[MyTaskGroup.overdue]!.map((x) => x.id), [2]);
    expect(groups[MyTaskGroup.today]!.map((x) => x.id), [4]);
    expect(groups[MyTaskGroup.upcoming]!.map((x) => x.id), [6, 1], reason: 'hạn gần nhất lên trước');
    expect(groups[MyTaskGroup.noDeadline]!.map((x) => x.id), [3]);
    expect(groups[MyTaskGroup.done]!.map((x) => x.id), [5], reason: 'đã xong dù quá hạn vẫn vào "Đã xong"');
  });

  test('không có thẻ → không có nhóm', () => expect(groupMyTasks([], now: now), isEmpty));

  test('MyTask đọc project_id dạng chuỗi', () => expect(t(1).projectId, 17));

  test('Dashboard: số liệu của tôi và tiến độ bảng', () {
    final d = Dashboard.fromJson({
      'task_summary': {'total': 5, 'completed': 2, 'in_progress': 0, 'pending': 3, 'overdue': 1},
      'projects': [
        {'id': 8, 'name': 'neee', 'task_summary': {'total': 4, 'completed': 1}},
        {'id': 9, 'name': 'test', 'task_summary': {'total': 0, 'completed': 0}},
      ],
    });
    expect(d.mine.open, 3);
    expect(d.mine.overdue, 1);
    expect(d.projects.first.summary.progress, 0.25);
    expect(d.projects.last.summary.progress, 0, reason: 'bảng không có thẻ không chia cho 0');
  });

  test('User đọc cài đặt email nhắc hạn', () {
    expect(User.fromJson({'id': 1, 'name': 'A', 'email': 'a@b.c', 'email_deadline_reminders': false})
        .emailDeadlineReminders, isFalse);
    expect(User.fromJson({'id': 1, 'name': 'A', 'email': 'a@b.c', 'email_deadline_reminders': 1})
        .emailDeadlineReminders, isTrue);
    expect(User.fromJson({'id': 1, 'name': 'A', 'email': 'a@b.c'}).emailDeadlineReminders, isTrue);
  });
}
