import 'package:flutter/material.dart';

import '../../models/task.dart';

/// Port từ frontend/src/components/tasks/taskMeta.ts.

const priorityLabel = {
  TaskPriority.low: 'Thấp',
  TaskPriority.medium: 'Trung bình',
  TaskPriority.high: 'Cao',
};

const priorityColor = {
  TaskPriority.low: Color(0xFF4BCE97),
  TaskPriority.medium: Color(0xFF579DFF),
  TaskPriority.high: Color(0xFFF87168),
};

enum DeadlineState { done, overdue, soon, normal }

/// Tình trạng hạn chót: quá hạn, sắp đến hạn (≤ 2 ngày), đã xong, bình thường.
DeadlineState? deadlineState(Task task, {DateTime? now}) {
  final deadline = task.deadline;
  if (deadline == null) return null;
  if (task.isDone) return DeadlineState.done;
  final n = now ?? DateTime.now();
  final today = DateTime(n.year, n.month, n.day);
  final day = DateTime(deadline.year, deadline.month, deadline.day);
  if (day.isBefore(today)) return DeadlineState.overdue;
  if (day.difference(today).inDays <= 2) return DeadlineState.soon;
  return DeadlineState.normal;
}

const deadlineLabel = {
  DeadlineState.done: 'Đã xong',
  DeadlineState.overdue: 'Quá hạn',
  DeadlineState.soon: 'Sắp đến hạn',
  DeadlineState.normal: 'Hạn chót',
};

/// Màu nền / chữ của chip hạn chót (null = không nền).
({Color? bg, Color fg}) deadlineColors(DeadlineState state, ColorScheme scheme) => switch (state) {
      DeadlineState.done => (bg: const Color(0xFF1F845A), fg: Colors.white),
      DeadlineState.overdue => (bg: const Color(0xFFC9372C), fg: Colors.white),
      DeadlineState.soon => (bg: const Color(0xFFF5CD47), fg: const Color(0xFF533F04)),
      DeadlineState.normal => (bg: null, fg: scheme.onSurfaceVariant),
    };

/// Bộ lọc thẻ trên bảng (giống bộ lọc bản web).
class BoardFilter {
  const BoardFilter({this.keyword = '', this.onlyMine = false, this.priorities = const {}});

  final String keyword;
  final bool onlyMine;
  final Set<TaskPriority> priorities;

  int get count => (keyword.trim().isNotEmpty ? 1 : 0) + (onlyMine ? 1 : 0) + priorities.length;
  bool get isActive => count > 0;

  BoardFilter copyWith({String? keyword, bool? onlyMine, Set<TaskPriority>? priorities}) => BoardFilter(
        keyword: keyword ?? this.keyword,
        onlyMine: onlyMine ?? this.onlyMine,
        priorities: priorities ?? this.priorities,
      );

  /// Thẻ có hiện khi đang lọc không (`userId` = người đang đăng nhập).
  bool matches(Task t, {required int? userId}) {
    final k = keyword.trim().toLowerCase();
    return (k.isEmpty ||
            t.title.toLowerCase().contains(k) ||
            (t.description?.toLowerCase().contains(k) ?? false)) &&
        (!onlyMine || t.assignees.any((u) => u.id == userId)) &&
        (priorities.isEmpty || priorities.contains(t.priority));
  }
}
