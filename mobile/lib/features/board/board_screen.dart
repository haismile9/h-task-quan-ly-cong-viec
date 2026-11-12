import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/backgrounds.dart';
import '../../models/project.dart';
import '../../models/task.dart';
import '../auth/auth_controller.dart';
import '../projects/projects_repository.dart';
import 'board_column.dart';
import 'board_menu_sheet.dart';
import 'board_ops.dart';
import 'board_repository.dart';
import 'task_meta.dart';

/// Bảng Kanban toàn màn hình: nền bảng, các cột vuốt ngang, mỗi cột cuộn dọc.
/// Nhấn giữ thẻ để kéo; kéo tới mép trái/phải màn hình thì tự sang cột bên cạnh.
class BoardScreen extends ConsumerStatefulWidget {
  const BoardScreen({super.key, required this.projectId, this.initial});

  final int projectId;

  /// Dự án đã có sẵn từ danh sách (hiện tên/nền ngay trong lúc tải chi tiết).
  final Project? initial;

  @override
  ConsumerState<BoardScreen> createState() => _BoardScreenState();
}

class _BoardScreenState extends ConsumerState<BoardScreen> {
  static const _viewport = 0.86;
  final _pages = PageController(viewportFraction: _viewport);
  int _page = 0;

  // ----- Kéo thả -----
  Task? _dragging;
  final _hover = ValueNotifier<DropHover?>(null);
  Offset _pointer = Offset.zero;
  Timer? _edgeTimer;

  int get id => widget.projectId;
  BoardController get _board => ref.read(boardProvider(id).notifier);

  @override
  void dispose() {
    _edgeTimer?.cancel();
    _hover.dispose();
    _pages.dispose();
    super.dispose();
  }

  void _toast(Object error) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiException.from(error).message)));
  }

  /// Chạy một thao tác trên bảng; lỗi (đã hoàn tác) thì báo bằng SnackBar.
  Future<bool> _run(Future<void> Function() action) async {
    try {
      await action();
      return true;
    } catch (e) {
      _toast(e);
      return false;
    }
  }

  late final _drag = DragCallbacks(
    onStarted: (t) => setState(() => _dragging = t),
    onUpdate: (pos) {
      _pointer = pos;
      _checkEdge(pos);
    },
    onFinished: _endDrag,
    onHover: (listId, index) {
      if (index != null) {
        _hover.value = DropHover(listId, index);
      } else if (_hover.value?.listId == listId) {
        _hover.value = null;
      }
    },
    onDrop: _drop,
    pointer: () => _pointer,
  );

  /// Giữ ngón tay ở mép màn hình ~0,5 giây thì lật sang cột bên cạnh.
  void _checkEdge(Offset pos) {
    final width = MediaQuery.of(context).size.width;
    final dir = pos.dx < 28 ? -1 : (pos.dx > width - 28 ? 1 : 0);
    if (dir == 0) {
      _edgeTimer?.cancel();
      _edgeTimer = null;
      return;
    }
    _edgeTimer ??= Timer(const Duration(milliseconds: 550), () {
      _edgeTimer = null;
      final count = ref.read(boardProvider(id)).valueOrNull?.lists.length ?? 0;
      final target = (_page + dir).clamp(0, count - 1);
      if (target != _page) {
        _pages.animateToPage(target, duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
      }
    });
  }

  void _endDrag() {
    _edgeTimer?.cancel();
    _edgeTimer = null;
    _hover.value = null;
    if (mounted && _dragging != null) setState(() => _dragging = null);
  }

  void _drop(int listId, int visibleIndex) {
    final task = _dragging;
    // Dọn trạng thái kéo ngay: sau khi chuyển cột, thẻ gốc bị gỡ khỏi cột cũ nên
    // onDragEnd của nó sẽ không được gọi.
    _endDrag();
    final data = ref.read(boardProvider(id)).valueOrNull;
    if (task == null || data == null) return;
    final filter = ref.read(boardFilterProvider(id));
    final userId = ref.read(authProvider).valueOrNull?.id;
    final column = data.tasksOf(listId);
    final index = realDropIndex(
      columnTasks: column,
      draggedId: task.id,
      isVisible: (t) => filter.matches(t, userId: userId),
      visibleIndex: visibleIndex,
    );
    // Thả lại đúng chỗ cũ → không gọi API
    if (listId == task.listId && index == column.indexWhere((t) => t.id == task.id)) return;
    _run(() => _board.moveTask(task.id, listId, index));
  }

  Future<void> _confirmDeleteList(TaskList list, int count) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá danh sách?'),
        content: Text(count > 0
            ? 'Xoá danh sách "${list.name}" cùng $count thẻ bên trong? Không thể khôi phục.'
            : 'Xoá danh sách "${list.name}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Huỷ')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xoá danh sách'),
          ),
        ],
      ),
    );
    if (ok == true) await _run(() => _board.deleteList(list.id));
  }

  @override
  Widget build(BuildContext context) {
    final project = ref.watch(projectDetailProvider(id)).valueOrNull ?? widget.initial;
    final board = ref.watch(boardProvider(id));
    final filter = ref.watch(boardFilterProvider(id));
    final userId = ref.watch(authProvider).valueOrNull?.id;
    final starred = ref.watch(starredProvider).valueOrNull?.contains(id) ?? false;
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = screenWidth * _viewport - 12 - 16;

    return Scaffold(
      backgroundColor: Colors.black,
      // Nhấc tay mà không thả vào cột nào (và thẻ gốc đã bị gỡ khi lật trang) → vẫn dọn trạng thái kéo
      body: Listener(
        onPointerUp: (_) => _dragging == null ? null : Future.delayed(Duration.zero, _endDrag),
        onPointerCancel: (_) => _dragging == null ? null : Future.delayed(Duration.zero, _endDrag),
        child: BoardBackground(
          value: project?.backgroundUrl,
          child: Column(
            children: [
              _TopBar(
                title: project?.name ?? '',
                filterCount: filter.count,
                starred: starred,
                onStar: () => ref.read(starredProvider.notifier).toggle(id),
                onFilter: () => _openFilter(context),
                onMenu: project == null ? null : () => showBoardMenu(context, project),
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
                    final pageCount = data.lists.length + 1; // + trang "Thêm danh sách"
                    return Column(
                      children: [
                        Expanded(
                          child: PageView.builder(
                            controller: _pages,
                            itemCount: pageCount,
                            padEnds: false,
                            onPageChanged: (i) => setState(() => _page = i),
                            itemBuilder: (_, i) {
                              if (i == data.lists.length) {
                                return _AddListPage(onAdd: (name) => _run(() => _board.createList(name)));
                              }
                              final list = data.lists[i];
                              final all = data.tasksOf(list.id);
                              return BoardColumn(
                                key: ValueKey(list.id),
                                list: list,
                                tasks: all.where((t) => filter.matches(t, userId: userId)).toList(),
                                totalCount: all.length,
                                filtering: filter.isActive,
                                canDelete: data.lists.length > 1,
                                cardWidth: cardWidth,
                                dragging: _dragging,
                                hover: _hover,
                                drag: _drag,
                                onRefresh: _board.reload,
                                onTaskTap: (t) => context.push('/boards/$id/cards/${t.id}'),
                                onToggleDone: (t) => _run(() => _board.setDone(t, !t.isDone)),
                                onAddTask: (title) => _run(() => _board.createTask(list.id, title)),
                                onRename: (name) => _run(() => _board.renameList(list.id, name)),
                                onDelete: () => _confirmDeleteList(list, all.length),
                                onReorderLists: () => _openReorder(data.lists),
                              );
                            },
                          ),
                        ),
                        _PageDots(count: pageCount, index: _page.clamp(0, pageCount - 1)),
                      ],
                    );
                  },
                ),
              ),
            ],
          ),
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

  void _openReorder(List<TaskList> lists) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => _ReorderListsSheet(
        lists: lists,
        onSave: (ids) => _run(() => _board.reorderLists(ids)),
      ),
    );
  }
}

/// Thanh tiêu đề bảng (nền tối mờ trên ảnh nền).
class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.title,
    required this.filterCount,
    required this.starred,
    required this.onStar,
    required this.onFilter,
    required this.onMenu,
  });

  final String title;
  final int filterCount;
  final bool starred;
  final VoidCallback onStar;
  final VoidCallback onFilter;
  final VoidCallback? onMenu;

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
                onPressed: () => context.canPop() ? context.pop() : context.go('/boards'),
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
                tooltip: starred ? 'Bỏ gắn sao' : 'Gắn sao',
                onPressed: onStar,
                icon: Icon(starred ? Icons.star : Icons.star_border, color: starred ? Colors.amber : Colors.white),
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
              IconButton(
                tooltip: 'Menu của bảng',
                onPressed: onMenu,
                icon: const Icon(Icons.more_horiz, color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Trang cuối: "+ Thêm danh sách".
class _AddListPage extends StatefulWidget {
  const _AddListPage({required this.onAdd});

  final Future<bool> Function(String name) onAdd;

  @override
  State<_AddListPage> createState() => _AddListPageState();
}

class _AddListPageState extends State<_AddListPage> {
  bool _open = false;
  bool _saving = false;
  final _name = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _name.text.trim();
    if (text.isEmpty) return;
    setState(() => _saving = true);
    final ok = await widget.onAdd(text);
    if (!mounted) return;
    setState(() {
      _saving = false;
      if (ok) _name.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
      child: Align(
        alignment: Alignment.topCenter,
        child: _open
            ? Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: dark ? const Color(0xFF101204) : const Color(0xFFF1F2F4),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _name,
                      autofocus: true,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Nhập tên danh sách…',
                        fillColor: dark ? const Color(0xFF22272B) : Colors.white,
                      ),
                      onSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: 8),
                    Row(children: [
                      FilledButton(
                        style: FilledButton.styleFrom(minimumSize: const Size(120, 40)),
                        onPressed: _saving ? null : _submit,
                        child: const Text('Thêm danh sách'),
                      ),
                      IconButton(
                        tooltip: 'Huỷ',
                        icon: const Icon(Icons.close),
                        onPressed: () => setState(() => _open = false),
                      ),
                    ]),
                  ],
                ),
              )
            : Material(
                color: Colors.white.withOpacity(0.24),
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => setState(() => _open = true),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    child: Row(children: [
                      Icon(Icons.add, color: Colors.white),
                      SizedBox(width: 8),
                      Text('Thêm danh sách',
                          style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ),
              ),
      ),
    );
  }
}

/// Sắp xếp các cột bằng cách kéo trong danh sách.
class _ReorderListsSheet extends StatefulWidget {
  const _ReorderListsSheet({required this.lists, required this.onSave});

  final List<TaskList> lists;
  final void Function(List<int> ids) onSave;

  @override
  State<_ReorderListsSheet> createState() => _ReorderListsSheetState();
}

class _ReorderListsSheetState extends State<_ReorderListsSheet> {
  late final _lists = [...widget.lists];

  @override
  Widget build(BuildContext context) {
    final changed = !List.generate(_lists.length, (i) => _lists[i].id == widget.lists[i].id).every((e) => e);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Sắp xếp danh sách', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('Giữ biểu tượng ≡ và kéo để đổi thứ tự',
                textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            const SizedBox(height: 8),
            Flexible(
              child: ReorderableListView(
                shrinkWrap: true,
                buildDefaultDragHandles: false,
                onReorder: (from, to) => setState(() {
                  final item = _lists.removeAt(from);
                  _lists.insert(to > from ? to - 1 : to, item);
                }),
                children: [
                  for (var i = 0; i < _lists.length; i++)
                    ListTile(
                      key: ValueKey(_lists[i].id),
                      title: Text(_lists[i].name),
                      trailing: ReorderableDragStartListener(index: i, child: const Icon(Icons.drag_handle)),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: changed
                  ? () {
                      widget.onSave(_lists.map((l) => l.id).toList());
                      Navigator.pop(context);
                    }
                  : null,
              child: const Text('Lưu thứ tự'),
            ),
          ],
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
