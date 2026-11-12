import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../models/dashboard.dart';
import '../board/task_meta.dart';
import 'my_tasks_repository.dart';

/// Tab "Việc của tôi": mọi thẻ được giao cho tôi ở tất cả các bảng, chia theo hạn chót.
class MyTasksScreen extends ConsumerWidget {
  const MyTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final tasks = ref.watch(myTasksProvider);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(myTasksProvider.notifier).reload(),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                sliver: SliverToBoxAdapter(
                  child: Text('Việc của tôi',
                      style: theme.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800)),
                ),
              ),
              ...tasks.when(
                skipLoadingOnReload: true,
                loading: () => [const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))],
                error: (e, _) => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _Empty(
                      icon: Icons.cloud_off_outlined,
                      text: ApiException.from(e).message,
                      action: TextButton(onPressed: () => ref.invalidate(myTasksProvider), child: const Text('Thử lại')),
                    ),
                  ),
                ],
                data: (list) {
                  if (list.isEmpty) {
                    return [
                      const SliverFillRemaining(
                        hasScrollBody: false,
                        child: _Empty(
                          icon: Icons.task_alt,
                          text: 'Chưa có thẻ nào được giao cho bạn.\nThẻ bạn được giao ở mọi bảng sẽ hiện ở đây.',
                        ),
                      ),
                    ];
                  }
                  final groups = groupMyTasks(list);
                  return [
                    for (final entry in groups.entries) ...[
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                        sliver: SliverToBoxAdapter(
                          child: Row(children: [
                            Text(entry.key.label.toUpperCase(),
                                style: theme.textTheme.labelMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.8,
                                  color: entry.key == MyTaskGroup.overdue
                                      ? theme.colorScheme.error
                                      : theme.colorScheme.onSurfaceVariant,
                                )),
                            const SizedBox(width: 6),
                            Text('${entry.value.length}', style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                          ]),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        sliver: SliverList.separated(
                          itemCount: entry.value.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (_, i) => _MyTaskTile(task: entry.value[i]),
                        ),
                      ),
                    ],
                    const SliverToBoxAdapter(child: SizedBox(height: 24)),
                  ];
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MyTaskTile extends ConsumerWidget {
  const _MyTaskTile({required this.task});

  final MyTask task;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final deadline = task.deadline;
    final today = DateUtils.dateOnly(DateTime.now());
    final overdue = !task.isDone && deadline != null && deadline.isBefore(today);

    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/boards/${task.projectId}/cards/${task.id}'),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(4, 8, 12, 8),
          child: Row(children: [
            IconButton(
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
                color: task.isDone ? const Color(0xFF22A06B) : theme.colorScheme.onSurfaceVariant,
              ),
            ),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  task.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: task.isDone ? theme.colorScheme.onSurfaceVariant : null,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [task.projectName, if (task.listName != null) task.listName].join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
              ]),
            ),
            const SizedBox(width: 8),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Container(
                width: 28,
                height: 6,
                decoration: BoxDecoration(
                  color: priorityColor[task.priority],
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              if (deadline != null) ...[
                const SizedBox(height: 6),
                Text(
                  DateFormat('dd/MM').format(deadline),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: overdue ? theme.colorScheme.error : theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ]),
          ]),
        ),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.icon, required this.text, this.action});

  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.onSurfaceVariant;
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 48, color: color),
        const SizedBox(height: 12),
        Text(text, textAlign: TextAlign.center, style: TextStyle(color: color)),
        if (action != null) ...[const SizedBox(height: 8), action!],
      ]),
    );
  }
}
