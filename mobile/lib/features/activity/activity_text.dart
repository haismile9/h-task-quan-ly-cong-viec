import 'package:flutter/painting.dart';
import 'package:intl/intl.dart';

import '../../models/activity.dart';

/// Port từ describeActivity (frontend/src/components/activity/ActivityItem.tsx):
/// câu mô tả một hoạt động, phần tên in đậm. [showCard] = hiện tên thẻ (trang Hoạt động);
/// tắt trong chi tiết thẻ (thay bằng "thẻ này").
List<InlineSpan> describeActivity(Activity a, {required bool showCard}) {
  TextSpan t(String s) => TextSpan(text: s);
  TextSpan b(String s) => TextSpan(text: s, style: const TextStyle(fontWeight: FontWeight.w600));

  final card = showCard ? b(a.str('task_title')) : t('thẻ này');
  final the = showCard ? [t('thẻ '), card] : [card];
  final isSelf = a.data['member_id'] != null && '${a.data['member_id']}' == '${a.user.id}';

  return switch (a.type) {
    'project_created' => [t('đã tạo bảng')],
    'member_added' => [t('đã thêm '), b(a.str('member_name')), t(' vào bảng')],
    'member_removed' => [t('đã gỡ '), b(a.str('member_name')), t(' khỏi bảng')],
    'member_invited' => [t('đã mời '), b(a.str('email')), t(' vào bảng')],
    'list_created' => [t('đã thêm danh sách '), b(a.str('list_name'))],
    'list_renamed' => [t('đã đổi tên danh sách '), b(a.str('old_name')), t(' thành '), b(a.str('list_name'))],
    'list_deleted' => [
        t('đã xoá danh sách '),
        b(a.str('list_name')),
        if ((int.tryParse(a.str('card_count')) ?? 0) > 0) t(' (${a.str('card_count')} thẻ)'),
      ],
    'card_created' => [t('đã thêm '), ...the, t(' vào danh sách '), b(a.str('list_name'))],
    'card_moved' => [t('đã chuyển '), ...the, t(' từ '), b(a.str('from_list')), t(' sang '), b(a.str('to_list'))],
    'card_completed' => [t('đã đánh dấu '), ...the, t(' là hoàn thành')],
    'card_reopened' => [t('đã đánh dấu '), ...the, t(' là chưa hoàn thành')],
    'card_renamed' => [t('đã đổi tên '), ...the, t(' (trước đây: '), b(a.str('old_title')), t(')')],
    'card_deleted' => [t('đã xoá thẻ '), b(a.str('task_title'))],
    'card_due_changed' => a.str('deadline').isNotEmpty
        ? [t('đã đặt hạn '), ...the, t(' vào '), b(_formatDate(a.str('deadline')))]
        : [t('đã gỡ hạn chót của '), ...the],
    'card_member_added' =>
      isSelf ? [t('đã tham gia '), ...the] : [t('đã thêm '), b(a.str('member_name')), t(' vào '), ...the],
    'card_member_removed' =>
      isSelf ? [t('đã rời khỏi '), ...the] : [t('đã loại '), b(a.str('member_name')), t(' khỏi '), ...the],
    'comment_added' => [t('đã bình luận về '), ...the],
    _ => [t('đã cập nhật '), ...the],
  };
}

String _formatDate(String value) {
  final d = DateTime.tryParse(value.length >= 10 ? value.substring(0, 10) : value);
  return d == null ? value : DateFormat('dd/MM/yyyy').format(d);
}

/// "vừa xong", "5 phút trước", "3 giờ trước", "hôm qua", "4 ngày trước", rồi ngày cụ thể.
String timeAgo(DateTime time, {DateTime? now}) {
  final n = now ?? DateTime.now();
  final diff = n.difference(time);
  if (diff.inSeconds < 60) return 'vừa xong';
  if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
  if (diff.inHours < 24) return '${diff.inHours} giờ trước';
  final days = DateTime(n.year, n.month, n.day).difference(DateTime(time.year, time.month, time.day)).inDays;
  if (days == 1) return 'hôm qua';
  if (days < 7) return '$days ngày trước';
  return DateFormat('dd/MM/yyyy').format(time);
}
