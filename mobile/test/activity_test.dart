import 'package:flutter/painting.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:htask/features/activity/activity_text.dart';
import 'package:htask/models/activity.dart';

Activity act(String type, Map<String, dynamic> data, {int userId = 1}) => Activity.fromJson({
      'id': 1,
      'type': type,
      'created_at': '2026-11-12T03:00:00Z',
      'task_id': '7',
      'project_id': 3,
      'user': {'id': userId, 'name': 'Hai', 'email': 'h@x.com'},
      'project': {'id': 3, 'name': 'Bảng A'},
      'data': data,
    });

String text(Activity a, {bool showCard = true}) =>
    describeActivity(a, showCard: showCard).map((s) => (s as TextSpan).text).join();

void main() {
  test('đọc JSON hoạt động (task_id dạng chuỗi, tên bảng)', () {
    final a = act('card_created', {});
    expect(a.taskId, 7);
    expect(a.projectName, 'Bảng A');
  });

  group('describeActivity — đủ 17 loại như bản web', () {
    final cases = <String, (Map<String, dynamic>, String)>{
      'project_created': ({}, 'đã tạo bảng'),
      'member_added': ({'member_name': 'Lan'}, 'đã thêm Lan vào bảng'),
      'member_removed': ({'member_name': 'Lan'}, 'đã gỡ Lan khỏi bảng'),
      'member_invited': ({'email': 'a@b.c'}, 'đã mời a@b.c vào bảng'),
      'list_created': ({'list_name': 'Todo'}, 'đã thêm danh sách Todo'),
      'list_renamed': ({'old_name': 'A', 'list_name': 'B'}, 'đã đổi tên danh sách A thành B'),
      'list_deleted': ({'list_name': 'X', 'card_count': 3}, 'đã xoá danh sách X (3 thẻ)'),
      'card_created': ({'task_title': 'T', 'list_name': 'L'}, 'đã thêm thẻ T vào danh sách L'),
      'card_moved': ({'task_title': 'T', 'from_list': 'A', 'to_list': 'B'}, 'đã chuyển thẻ T từ A sang B'),
      'card_completed': ({'task_title': 'T'}, 'đã đánh dấu thẻ T là hoàn thành'),
      'card_reopened': ({'task_title': 'T'}, 'đã đánh dấu thẻ T là chưa hoàn thành'),
      'card_renamed': ({'task_title': 'T', 'old_title': 'S'}, 'đã đổi tên thẻ T (trước đây: S)'),
      'card_deleted': ({'task_title': 'T'}, 'đã xoá thẻ T'),
      'card_due_changed': ({'task_title': 'T', 'deadline': '2026-11-20'}, 'đã đặt hạn thẻ T vào 20/11/2026'),
      'card_member_added': ({'task_title': 'T', 'member_id': 9, 'member_name': 'Lan'}, 'đã thêm Lan vào thẻ T'),
      'card_member_removed': ({'task_title': 'T', 'member_id': 9, 'member_name': 'Lan'}, 'đã loại Lan khỏi thẻ T'),
      'comment_added': ({'task_title': 'T'}, 'đã bình luận về thẻ T'),
    };
    cases.forEach((type, c) => test(type, () => expect(text(act(type, c.$1)), c.$2)));
  });

  test('trong chi tiết thẻ: "thẻ này" thay cho tên thẻ', () {
    expect(text(act('card_completed', {'task_title': 'T'}), showCard: false), 'đã đánh dấu thẻ này là hoàn thành');
  });

  test('tự tham gia / rời thẻ', () {
    expect(text(act('card_member_added', {'task_title': 'T', 'member_id': 1})), 'đã tham gia thẻ T');
    expect(text(act('card_member_removed', {'task_title': 'T', 'member_id': 1})), 'đã rời khỏi thẻ T');
  });

  test('gỡ hạn chót, loại lạ', () {
    expect(text(act('card_due_changed', {'task_title': 'T', 'deadline': null})), 'đã gỡ hạn chót của thẻ T');
    expect(text(act('weird', {'task_title': 'T'})), 'đã cập nhật thẻ T');
  });

  group('timeAgo', () {
    final now = DateTime(2026, 11, 12, 15, 0);
    test('vừa xong', () => expect(timeAgo(now.subtract(const Duration(seconds: 20)), now: now), 'vừa xong'));
    test('phút', () => expect(timeAgo(now.subtract(const Duration(minutes: 5)), now: now), '5 phút trước'));
    test('giờ', () => expect(timeAgo(now.subtract(const Duration(hours: 3)), now: now), '3 giờ trước'));
    test('hôm qua', () => expect(timeAgo(DateTime(2026, 11, 11, 9), now: now), 'hôm qua'));
    test('ngày', () => expect(timeAgo(DateTime(2026, 11, 8, 9), now: now), '4 ngày trước'));
    test('lâu rồi', () => expect(timeAgo(DateTime(2026, 10, 1), now: now), '01/10/2026'));
  });
}
