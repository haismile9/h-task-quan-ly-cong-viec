import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../models/dashboard.dart';
import '../board/task_meta.dart';
import '../my_tasks/my_tasks_repository.dart';

/// Số ngày hiện trong lịch (từ hôm nay trở đi); bấm "Xem thêm" để kéo dài.
const _pageDays = 35;

/// Gom thẻ có hạn chót theo ngày (bỏ giờ). Thẻ chưa xong đã quá hạn để riêng.
({List<MyTask> overdue, Map<DateTime, List<MyTask>> byDay}) planTasks(List<MyTask> tasks, {DateTime? now}) {
  final today = DateUtils.dateOnly(now ?? DateTime.now());
  final overdue = <MyTask>[];
  final byDay = <DateTime, List<MyTask>>{};
  for (final t in tasks) {
    final d = t.deadline;
    if (d == null) continue;
    final day = DateUtils.dateOnly(d);
    if (day.isBefore(today)) {
      if (!t.isDone) overdue.add(t);
    } else {
      (byDay[day] ??= []).add(t);
    }
  }
  overdue.sort((a, b) => a.deadline!.compareTo(b.deadline!));
  for (final list in byDay.values) {
    list.sort((a, b) => (a.isDone ? 1 : 0) - (b.isDone ? 1 : 0));
  }
  return (overdue: overdue, byDay: byDay);
}

/// Tab "Kế hoạch": các thẻ được giao cho tôi xếp theo ngày (như Planner của Trello).
class PlannerScreen extends ConsumerStatefulWidget {
  const PlannerScreen({super.key});

  @override
  ConsumerState<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends ConsumerState<PlannerScreen> {
  int _days = _pageDays;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tasks = ref.watch(myTasksProvider);
    final today = DateUtils.dateOnly(DateTime.now());

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(myTasksProvider.notifier).reload(),
          child: tasks.when(
            skipLoadingOnReload: true,
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => ListView(children: [
              const SizedBox(height: 120),
              Center(child: Text(ApiException.from(e).message)),
              TextButton(onPressed: () => ref.invalidate(myTasksProvider), child: const Text('Thử lại')),
            ]),
            data: (list) {
              final plan = planTasks(list);
              final days = List.generate(_days, (i) => today.add(Duration(days: i)));
              return CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                    sliver: SliverToBoxAdapter(
                      child: Text(
                        toBeginningOfSentenceCase(DateFormat('MMMM', 'vi').format(today))!,
                        style: theme.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                  if (plan.overdue.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _DayRow(
                        label: 'Quá hạn',
                        sub: '${plan.overdue.length}',
                        tasks: plan.overdue,
                        danger: true,
                        showDate: true,
                      ),
                    ),
                  SliverList.builder(
                    itemCount: days.length,
                    itemBuilder: (_, i) {
                      final d = days[i];
                      final newMonth = i > 0 && d.day == 1;
                      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        if (newMonth)
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
                            child: Text(
                              toBeginningOfSentenceCase(DateFormat('MMMM yyyy', 'vi').format(d))!,
                              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                        _DayRow(
                          label: _weekday(d),
                          sub: '${d.day}',
                          tasks: plan.byDay[d] ?? const [],
                          isToday: i == 0,
                        ),
                      ]);
                    },
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      child: OutlinedButton(
                        onPressed: () => setState(() => _days += _pageDays),
                        child: const Text('Xem thêm'),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  static String _weekday(DateTime d) =>
      const ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][d.weekday - 1];
}

/// Một ngày: cột trái (thứ + ngày), bên phải là các thẻ hoặc "Không có kế hoạch".
class _DayRow extends StatelessWidget {
  const _DayRow({
    required this.label,
    required this.sub,
    required this.tasks,
    this.isToday = false,
    this.danger = false,
    this.showDate = false,
  });

  final String label;
  final String sub;
  final List<MyTask> tasks;
  final bool isToday;
  final bool danger;
  final bool showDate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final labelColor = danger ? scheme.error : (isToday ? scheme.onPrimary : scheme.onSurfaceVariant);

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 16, 6),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 56,
          height: 56,
          margin: const EdgeInsets.only(right: 12),
          decoration: isToday ? BoxDecoration(color: scheme.primary, shape: BoxShape.circle) : null,
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(label, style: TextStyle(fontSize: 12, color: labelColor, fontWeight: FontWeight.w600)),
            Text(sub,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: danger ? scheme.error : (isToday ? scheme.onPrimary : scheme.onSurface),
                )),
          ]),
        ),
        Expanded(
          child: tasks.isEmpty
              ? Container(
                  height: 56,
                  alignment: Alignment.centerLeft,
                  decoration: isToday
                      ? BoxDecoration(border: Border(bottom: BorderSide(color: scheme.primary, width: 2)))
                      : null,
                  child: Text('Không có kế hoạch', style: TextStyle(color: scheme.onSurfaceVariant)),
                )
              : Column(children: [for (final t in tasks) _PlanTile(task: t, showDate: showDate)]),
        ),
      ]),
    );
  }
}

class _PlanTile extends ConsumerWidget {
  const _PlanTile({required this.task, required this.showDate});

  final MyTask task;
  final bool showDate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () => context.push('/boards/${task.projectId}/cards/${task.id}'),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(4, 6, 12, 6),
            child: Row(children: [
              IconButton(
                visualDensity: VisualDensity.compact,
                tooltip: task.isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành',
                onPressed: () async {
                  try {
                    await ref.read(myTasksProvider.notifier).setDone(task, !task.isDone);
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context)
                          .showSnackBar(SnackBar(content: Text(ApiException.from(e).message)));
                    }
                  }
                },
                icon: Icon(
                  task.isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                  color: task.isDone ? const Color(0xFF22A06B) : scheme.onSurfaceVariant,
                ),
              ),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(task.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: task.isDone ? scheme.onSurfaceVariant : null,
                      )),
                  Text(
                    [
                      task.projectName,
                      if (showDate && task.deadline != null) DateFormat('dd/MM').format(task.deadline!),
                    ].join(' · '),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
                  ),
                ]),
              ),
              Container(
                width: 6,
                height: 28,
                decoration: BoxDecoration(color: priorityColor[task.priority], borderRadius: BorderRadius.circular(3)),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
