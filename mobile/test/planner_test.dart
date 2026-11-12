import 'package:flutter_test/flutter_test.dart';
import 'package:htask/features/planner/planner_screen.dart';
import 'package:htask/models/dashboard.dart';

MyTask t(int id, String? deadline, {String status = 'pending'}) => MyTask.fromJson({
      'id': id,
      'title': 'T$id',
      'project_id': 1,
      'project_name': 'B',
      'status': status,
      'deadline': deadline,
    });

void main() {
  final now = DateTime(2026, 11, 12, 15);

  test('chia thẻ theo ngày, quá hạn chưa xong để riêng, bỏ thẻ không hạn', () {
    final plan = planTasks([
      t(1, '2026-11-12'),
      t(2, '2026-11-12', status: 'done'),
      t(3, '2026-11-20'),
      t(4, '2026-11-01'),
      t(5, '2026-10-30'),
      t(6, '2026-11-02', status: 'done'),
      t(7, null),
    ], now: now);

    expect(plan.overdue.map((x) => x.id), [5, 4], reason: 'quá hạn, cũ nhất trước; thẻ đã xong không tính');
    expect(plan.byDay[DateTime(2026, 11, 12)]!.map((x) => x.id), [1, 2], reason: 'chưa xong lên trước');
    expect(plan.byDay[DateTime(2026, 11, 20)]!.single.id, 3);
    expect(plan.byDay.length, 2);
  });
}
