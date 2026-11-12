import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/task.dart';
import '../../widgets/avatar.dart';
import 'task_meta.dart';

/// Thẻ công việc trên bảng: vạch ưu tiên, tiêu đề (✓ khi xong), hạn chót, mô tả, người được giao.
class TaskCard extends StatelessWidget {
  const TaskCard({super.key, required this.task, this.onTap});

  final Task task;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final dark = theme.brightness == Brightness.dark;
    final deadline = deadlineState(task);
    final hasMeta = deadline != null || task.hasDescription || task.assignees.isNotEmpty;

    return Material(
      color: dark ? const Color(0xFF22272B) : Colors.white,
      borderRadius: BorderRadius.circular(10),
      elevation: 0.6,
      shadowColor: Colors.black,
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Tooltip(
                message: 'Độ ưu tiên: ${priorityLabel[task.priority]}',
                child: Container(
                  width: 40,
                  height: 8,
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: priorityColor[task.priority],
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (task.isDone)
                    const Padding(
                      padding: EdgeInsets.only(right: 6, top: 1),
                      child: Icon(Icons.check_circle, size: 18, color: Color(0xFF22A06B)),
                    ),
                  Expanded(
                    child: Text(
                      task.title,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontSize: 15,
                        color: task.isDone ? scheme.onSurfaceVariant : scheme.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
              if (hasMeta) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (deadline != null) _DeadlineChip(date: task.deadline!, state: deadline),
                    if (task.hasDescription)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Tooltip(
                          message: 'Có mô tả',
                          child: Icon(Icons.notes, size: 18, color: scheme.onSurfaceVariant),
                        ),
                      ),
                    const Spacer(),
                    _Assignees(names: task.assignees.map((u) => u.name).toList()),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DeadlineChip extends StatelessWidget {
  const _DeadlineChip({required this.date, required this.state});

  final DateTime date;
  final DeadlineState state;

  @override
  Widget build(BuildContext context) {
    final c = deadlineColors(state, Theme.of(context).colorScheme);
    return Tooltip(
      message: deadlineLabel[state]!,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
        decoration: BoxDecoration(color: c.bg, borderRadius: BorderRadius.circular(4)),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.schedule, size: 14, color: c.fg),
            const SizedBox(width: 4),
            Text(DateFormat('dd/MM').format(date), style: TextStyle(fontSize: 12, color: c.fg)),
          ],
        ),
      ),
    );
  }
}

/// Tối đa 3 avatar chồng nhau, còn lại "+N".
class _Assignees extends StatelessWidget {
  const _Assignees({required this.names});

  final List<String> names;

  @override
  Widget build(BuildContext context) {
    if (names.isEmpty) return const SizedBox.shrink();
    const size = 26.0;
    const step = 20.0;
    final shown = names.take(3).toList();
    final extra = names.length - shown.length;
    final count = shown.length + (extra > 0 ? 1 : 0);
    final ring = Theme.of(context).brightness == Brightness.dark ? const Color(0xFF22272B) : Colors.white;

    Widget ringed(Widget child) => Container(
          padding: const EdgeInsets.all(1.5),
          decoration: BoxDecoration(color: ring, shape: BoxShape.circle),
          child: child,
        );

    return SizedBox(
      width: step * (count - 1) + size + 3,
      height: size + 3,
      child: Stack(
        children: [
          for (var i = 0; i < shown.length; i++)
            Positioned(left: step * i, child: ringed(Avatar(name: shown[i], size: size))),
          if (extra > 0)
            Positioned(
              left: step * shown.length,
              child: ringed(Container(
                width: size,
                height: size,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerHighest, shape: BoxShape.circle),
                child: Text('+$extra', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600)),
              )),
            ),
        ],
      ),
    );
  }
}
