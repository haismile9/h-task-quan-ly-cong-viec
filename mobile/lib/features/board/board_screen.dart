import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/backgrounds.dart';
import '../../models/project.dart';
import '../../models/task.dart';
import '../auth/auth_controller.dart';
import 'board_repository.dart';
import 'task_card.dart';
import 'task_meta.dart';

/// Bảng Kanban toàn màn hình: nền bảng, các cột vuốt ngang, mỗi cột cuộn dọc.
class BoardScreen extends ConsumerStatefulWidget {
  const BoardScreen({super.key, required this.projectId, this.initial});

  final int projectId;

  /// Dự án đã có sẵn từ danh sách (hiện tên/nền ngay trong lúc tải chi tiết).
  final Project? initial;

  @override
  ConsumerState<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends ConsumerState<BoardScreen> {
  final _pages = PageController(viewportFraction: 0.86);
  int _page = 0;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final id = widget.projectId;
    final project = ref.watch(projectDetailProvider(id)).valueOrNull ?? widget.initial;
    final board = ref.watch(boardProvider(id));
    final filter = ref.watch(boardFilterProvider(id));
    final userId = ref.watch(authProvider).valueOrNull?.id;

    return Scaffold(
      backgroundColor: Colors.black,
      body: BoardBackground(
        value: project?.backgroundUrl,
        child: Column(
          children: [
            _TopBar(
              title: project?.name ?? '',
              filterCount: filter.count,
              onFilter: () => _openFilter(context),
            ),
            Expanded(
              child: board.when(
                skipLoadingOnReload: true,
                loading: () => const Center(child: CircularProgressIndicator(color: Colors.white)),
                error: (e, _) => _BoardMessage(
                  text: ApiException.from(e).message,
                  action: FilledButton.tonal(
                    onPressed: () => ref.invalidate(boardProvider(id)),
                    child: const Text('Thử lại'),
                  ),
                ),
                data: (data) {
                  if (data.lists.isEmpty) {
                    return const _BoardMessage(text: 'Bảng chưa có danh sách nào.');
                  }
                  return Column(
                    children: [
                      Expanded(
                        child: PageView.builder(
                          controller: _pages,
                          itemCount: data.lists.length,
                          padEnds: false,
                          onPageChanged: (i) => setState(() => _page = i),
                          itemBuilder: (_, i) {
                            final list = data.lists[i];
                            final all = data.tasksOf(list.id);
                            return _ListColumn(
                              list: list,
                              tasks: all.where((t) => filter.matches(t, userId: userId)).toList(),
                              totalCount: all.length,
                              filtering: filter.isActive,
                              onRefresh: () => ref.read(boardProvider(id).notifier).reload(),
                              onTaskTap: (t) => ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Chi tiết thẻ "${t.title}" sẽ có ở bước 4')),
                              ),
                            );
                          },
                        ),
                      ),
                      _PageDots(count: data.lists.length, index: _page.clamp(0, data.lists.length - 1)),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openFilter(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => _FilterSheet(projectId: widget.projectId),
    );
  }
}

/// Thanh tiêu đề bảng (nền tối mờ trên ảnh nền).
class _TopBar extends StatelessWidget {
  const _TopBar({required this.title, required this.filterCount, required this.onFilter});

  final String title;
  final int filterCount;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withOpacity(0.28),
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 56,
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                tooltip: 'Quay lại',
                onPressed: () => context.pop(),
              ),
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                ),
              ),
              IconButton(
                tooltip: 'Lọc thẻ',
                onPressed: onFilter,
                icon: Badge(
                  isLabelVisible: filterCount > 0,
                  label: Text('$filterCount'),
                  child: const Icon(Icons.filter_list, color: Colors.white),
                ),
              ),
              const SizedBox(width: 4),
            ],
          ),
        ),
      ),
    );
  }
}

/// Một cột: tiêu đề + số thẻ, danh sách thẻ cuộn dọc (co theo nội dung, tối đa hết chiều cao).
class _ListColumn extends StatelessWidget {
  const _ListColumn({
    required this.list,
    required this.tasks,
    required this.totalCount,
    required this.filtering,
    required this.onRefresh,
    required this.onTaskTap,
  });

  final TaskList list;
  final List<Task> tasks;
  final int totalCount;
  final bool filtering;
  final Future<void> Function() onRefresh;
  final void Function(Task) onTaskTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 0, 8),
      child: Align(
        alignment: Alignment.topCenter,
        child: Container(
          decoration: BoxDecoration(
            color: dark ? const Color(0xFF101204) : const Color(0xFFF1F2F4),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(list.name,
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700, fontSize: 15)),
                    ),
                    Text(
                      filtering && tasks.length != totalCount ? '${tasks.length}/$totalCount' : '$totalCount',
                      style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: RefreshIndicator(
                  onRefresh: onRefresh,
                  child: tasks.isEmpty
                      ? ListView(
                          shrinkWrap: true,
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(14, 4, 14, 16),
                          children: [
                            Text(
                              filtering && totalCount > 0 ? 'Không có thẻ khớp bộ lọc' : 'Chưa có thẻ',
                              style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ],
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
                          itemCount: tasks.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (_, i) => TaskCard(task: tasks[i], onTap: () => onTaskTap(tasks[i])),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PageDots extends StatelessWidget {
  const _PageDots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10, top: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            for (var i = 0; i < count; i++)
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == index ? 18 : 7,
                height: 7,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(i == index ? 0.95 : 0.5),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _BoardMessage extends StatelessWidget {
  const _BoardMessage({required this.text, this.action});

  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(text, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 16)),
              if (action != null) ...[const SizedBox(height: 12), action!],
            ],
          ),
        ),
      );
}

/// Lọc thẻ: từ khoá, thẻ được giao cho tôi, độ ưu tiên.
class _FilterSheet extends ConsumerStatefulWidget {
  const _FilterSheet({required this.projectId});

  final int projectId;

  @override
  ConsumerState<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends ConsumerState<_FilterSheet> {
  late final _keyword = TextEditingController(text: ref.read(boardFilterProvider(widget.projectId)).keyword);

  @override
  void dispose() {
    _keyword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = boardFilterProvider(widget.projectId);
    final filter = ref.watch(provider);
    void update(BoardFilter f) => ref.read(provider.notifier).state = f;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + MediaQuery.of(context).viewInsets.bottom),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Lọc thẻ', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          TextField(
            controller: _keyword,
            decoration: const InputDecoration(hintText: 'Từ khoá…', prefixIcon: Icon(Icons.search)),
            onChanged: (v) => update(filter.copyWith(keyword: v)),
          ),
          const SizedBox(height: 8),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            title: const Text('Thẻ được giao cho tôi'),
            value: filter.onlyMine,
            onChanged: (v) => update(filter.copyWith(onlyMine: v ?? false)),
          ),
          const Padding(
            padding: EdgeInsets.only(top: 4, bottom: 4),
            child: Text('Độ ưu tiên', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
          for (final p in TaskPriority.values)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              controlAffinity: ListTileControlAffinity.leading,
              title: Row(children: [
                Container(
                  width: 32,
                  height: 8,
                  decoration: BoxDecoration(color: priorityColor[p], borderRadius: BorderRadius.circular(4)),
                ),
                const SizedBox(width: 10),
                Text(priorityLabel[p]!),
              ]),
              value: filter.priorities.contains(p),
              onChanged: (v) => update(filter.copyWith(
                priorities: v == true ? {...filter.priorities, p} : ({...filter.priorities}..remove(p)),
              )),
            ),
          if (filter.isActive)
            TextButton(
              onPressed: () {
                _keyword.clear();
                update(const BoardFilter());
              },
              child: const Text('Xoá bộ lọc'),
            ),
        ],
      ),
    );
  }
}
