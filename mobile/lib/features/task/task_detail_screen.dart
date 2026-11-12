import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../core/api_client.dart';
import '../../models/activity.dart';
import '../../models/task.dart';
import '../../models/user.dart';
import '../../widgets/avatar.dart';
import '../activity/activity_text.dart';
import '../auth/auth_controller.dart';
import '../board/board_repository.dart';
import '../board/task_meta.dart';
import 'task_repository.dart';

/// Chi tiết thẻ toàn màn hình: tiêu đề, danh sách, hoàn thành, ưu tiên, hạn chót,
/// thành viên, mô tả, bình luận và hoạt động (như cửa sổ chi tiết thẻ trên web).
class TaskDetailScreen extends ConsumerStatefulWidget {
  const TaskDetailScreen({super.key, required this.projectId, required this.taskId});

  final int projectId;
  final int taskId;

  @override
  ConsumerState<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends ConsumerState<TaskDetailScreen> {
  final _title = TextEditingController();
  final _titleFocus = FocusNode();
  final _description = TextEditingController();
  bool _editingDesc = false;
  bool _showDetails = false;

  BoardController get _board => ref.read(boardProvider(widget.projectId).notifier);

  @override
  void initState() {
    super.initState();
    _titleFocus.addListener(() {
      if (!_titleFocus.hasFocus) _saveTitle();
    });
  }

  @override
  void dispose() {
    _title.dispose();
    _titleFocus.dispose();
    _description.dispose();
    super.dispose();
  }

  Task? get _task =>
      ref.read(boardProvider(widget.projectId)).valueOrNull?.tasks.where((t) => t.id == widget.taskId).firstOrNull;

  void _toast(Object e) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ApiException.from(e).message)));
  }

  /// Sửa thẻ (lạc quan) rồi làm mới dòng hoạt động.
  Future<void> _update(Map<String, dynamic> input, Task Function(Task) preview) async {
    try {
      await _board.updateTask(widget.taskId, input, preview);
      ref.invalidate(taskActivitiesProvider(widget.taskId));
    } catch (e) {
      _toast(e);
    }
  }

  void _saveTitle() {
    final task = _task;
    final text = _title.text.trim();
    if (task == null) return;
    if (text.isEmpty || text == task.title) {
      _title.text = task.title;
      return;
    }
    _update({'title': text}, (t) => t.copyWith(title: text));
  }

  Future<void> _pickDeadline(Task task) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: task.deadline ?? now,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 10),
      helpText: 'Chọn hạn chót',
      cancelText: 'Huỷ',
      confirmText: 'Lưu',
    );
    if (picked == null) return;
    final value = DateFormat('yyyy-MM-dd').format(picked);
    await _update({'deadline': value}, (t) => t.copyWith(deadline: () => picked));
  }

  Future<void> _moveToList(Task task, List<TaskList> lists) async {
    final target = await showModalBottomSheet<TaskList>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('Chuyển tới danh sách', style: Theme.of(ctx).textTheme.titleMedium),
          const SizedBox(height: 8),
          for (final l in lists)
            ListTile(
              title: Text(l.name),
              trailing: l.id == task.listId ? const Icon(Icons.check) : null,
              onTap: () => Navigator.pop(ctx, l),
            ),
        ]),
      ),
    );
    if (target == null || target.id == task.listId) return;
    final board = ref.read(boardProvider(widget.projectId)).valueOrNull;
    final index = board?.tasksOf(target.id).length ?? 0; // cuối danh sách đích
    try {
      await _board.moveTask(task.id, target.id, index);
      ref.invalidate(taskActivitiesProvider(widget.taskId));
    } catch (e) {
      _toast(e);
    }
  }

  Future<void> _editMembers(Task task, List<User> members) async {
    final selected = await showModalBottomSheet<Set<int>>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => _MembersSheet(members: members, initial: task.assignees.map((u) => u.id).toSet()),
    );
    if (selected == null) return;
    final current = task.assignees.map((u) => u.id).toSet();
    if (selected.length == current.length && selected.containsAll(current)) return;
    final users = members.where((m) => selected.contains(m.id)).toList();
    await _update({'assigned_user_ids': selected.toList()}, (t) => t.copyWith(assignees: users));
  }

  Future<void> _delete(Task task) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá thẻ?'),
        content: Text('Xoá thẻ "${task.title}" cùng bình luận của nó. Không thể khôi phục.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Huỷ')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xoá thẻ'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    final router = GoRouter.of(context);
    try {
      await _board.deleteTask(task.id);
      router.pop();
    } catch (e) {
      _toast(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final board = ref.watch(boardProvider(widget.projectId));
    final project = ref.watch(projectDetailProvider(widget.projectId)).valueOrNull;
    final task = board.valueOrNull?.tasks.where((t) => t.id == widget.taskId).firstOrNull;

    if (task == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: board.isLoading
              ? const CircularProgressIndicator()
              : Text(board.hasError ? ApiException.from(board.error!).message : 'Thẻ không còn tồn tại.'),
        ),
      );
    }
    if (!_titleFocus.hasFocus && _title.text != task.title) _title.text = task.title;

    final lists = board.valueOrNull?.lists ?? const <TaskList>[];
    final listName = lists.where((l) => l.id == task.listId).firstOrNull?.name ?? '';
    // Thành viên bảng = người trong dự án + chủ dự án
    final members = <User>[
      if (project?.owner != null) project!.owner!,
      ...?project?.members.where((m) => m.id != project.owner?.id),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thẻ', style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Thao tác thẻ',
            onSelected: (v) => v == 'delete' ? _delete(task) : null,
            itemBuilder: (_) => [
              PopupMenuItem(
                value: 'delete',
                child: Text('Xoá thẻ', style: TextStyle(color: theme.colorScheme.error)),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
              children: [
                // Danh sách chứa thẻ (bấm để chuyển)
                Align(
                  alignment: Alignment.centerLeft,
                  child: ActionChip(
                    avatar: const Icon(Icons.view_column_outlined, size: 18),
                    label: Text('trong danh sách $listName'),
                    onPressed: () => _moveToList(task, lists),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconButton(
                      tooltip: task.isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành',
                      onPressed: () => _board.setDone(task, !task.isDone).catchError(_toast),
                      icon: Icon(
                        task.isDone ? Icons.check_circle : Icons.radio_button_unchecked,
                        color: task.isDone ? const Color(0xFF22A06B) : theme.colorScheme.onSurfaceVariant,
                        size: 28,
                      ),
                    ),
                    Expanded(
                      child: TextField(
                        controller: _title,
                        focusNode: _titleFocus,
                        maxLines: null,
                        keyboardType: TextInputType.text,
                        textInputAction: TextInputAction.done,
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                        decoration: const InputDecoration(
                          filled: false,
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(vertical: 10),
                        ),
                        onSubmitted: (_) => _titleFocus.unfocus(),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _Section(
                  icon: Icons.flag_outlined,
                  title: 'Độ ưu tiên',
                  child: SegmentedButton<TaskPriority>(
                    showSelectedIcon: false,
                    segments: [
                      for (final p in TaskPriority.values)
                        ButtonSegment(
                          value: p,
                          label: Text(priorityLabel[p]!),
                          icon: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(color: priorityColor[p], shape: BoxShape.circle),
                          ),
                        ),
                    ],
                    selected: {task.priority},
                    onSelectionChanged: (s) =>
                        _update({'priority': s.first.name}, (t) => t.copyWith(priority: s.first)),
                  ),
                ),
                _Section(
                  icon: Icons.schedule,
                  title: 'Hạn chót',
                  child: Row(children: [
                    _DeadlineButton(task: task, onTap: () => _pickDeadline(task)),
                    if (task.deadline != null)
                      IconButton(
                        tooltip: 'Gỡ hạn chót',
                        icon: const Icon(Icons.close),
                        onPressed: () => _update({'deadline': null}, (t) => t.copyWith(deadline: () => null)),
                      ),
                  ]),
                ),
                _Section(
                  icon: Icons.group_outlined,
                  title: 'Thành viên',
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      for (final u in task.assignees) Tooltip(message: u.name, child: Avatar(name: u.name, size: 34)),
                      IconButton.filledTonal(
                        tooltip: 'Thêm / bỏ thành viên',
                        onPressed: members.isEmpty ? null : () => _editMembers(task, members),
                        icon: const Icon(Icons.add),
                      ),
                    ],
                  ),
                ),
                _Section(
                  icon: Icons.notes,
                  title: 'Mô tả',
                  child: _editingDesc
                      ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                          TextField(
                            controller: _description,
                            autofocus: true,
                            minLines: 4,
                            maxLines: 12,
                            decoration: const InputDecoration(hintText: 'Thêm mô tả chi tiết hơn…'),
                          ),
                          const SizedBox(height: 8),
                          Row(children: [
                            FilledButton(
                              style: FilledButton.styleFrom(minimumSize: const Size(88, 40)),
                              onPressed: () {
                                final text = _description.text.trim();
                                setState(() => _editingDesc = false);
                                if (text != (task.description ?? '')) {
                                  _update({'description': text.isEmpty ? null : text},
                                      (t) => t.copyWith(description: () => text.isEmpty ? null : text));
                                }
                              },
                              child: const Text('Lưu'),
                            ),
                            TextButton(
                              onPressed: () => setState(() => _editingDesc = false),
                              child: const Text('Huỷ'),
                            ),
                          ]),
                        ])
                      : Material(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(8),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(8),
                            onTap: () => setState(() {
                              _description.text = task.description ?? '';
                              _editingDesc = true;
                            }),
                            child: Container(
                              width: double.infinity,
                              constraints: const BoxConstraints(minHeight: 64),
                              padding: const EdgeInsets.all(12),
                              child: Text(
                                task.hasDescription ? task.description! : 'Thêm mô tả chi tiết hơn…',
                                style: TextStyle(
                                    color: task.hasDescription ? null : theme.colorScheme.onSurfaceVariant),
                              ),
                            ),
                          ),
                        ),
                ),
                const SizedBox(height: 8),
                Row(children: [
                  Icon(Icons.forum_outlined, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text('Bình luận và hoạt động',
                        style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                  ),
                  TextButton(
                    onPressed: () => setState(() => _showDetails = !_showDetails),
                    child: Text(_showDetails ? 'Ẩn chi tiết' : 'Hiện chi tiết'),
                  ),
                ]),
                _Timeline(taskId: widget.taskId, showActivity: _showDetails),
              ],
            ),
          ),
          _CommentComposer(taskId: widget.taskId, onError: _toast),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.icon, required this.title, required this.child});

  final IconData icon;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 20, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 10),
          Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 8),
        child,
      ]),
    );
  }
}

class _DeadlineButton extends StatelessWidget {
  const _DeadlineButton({required this.task, required this.onTap});

  final Task task;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final deadline = task.deadline;
    if (deadline == null) {
      return OutlinedButton.icon(onPressed: onTap, icon: const Icon(Icons.add), label: const Text('Đặt hạn chót'));
    }
    final state = deadlineState(task)!;
    final c = deadlineColors(state, Theme.of(context).colorScheme);
    return FilledButton.tonalIcon(
      // Theme đặt nút rộng hết cỡ (Size.fromHeight) → trong Row phải tự đặt kích thước tối thiểu
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 44),
        backgroundColor: c.bg,
        foregroundColor: c.bg == null ? null : c.fg,
      ),
      onPressed: onTap,
      icon: const Icon(Icons.schedule, size: 18),
      label: Text(
        '${DateFormat('EEEE, dd/MM/yyyy', 'vi').format(deadline)}'
        '${state == DeadlineState.normal ? '' : ' · ${deadlineLabel[state]}'}',
      ),
    );
  }
}

/// Chọn người được giao trong số thành viên bảng.
class _MembersSheet extends StatefulWidget {
  const _MembersSheet({required this.members, required this.initial});

  final List<User> members;
  final Set<int> initial;

  @override
  State<_MembersSheet> createState() => _MembersSheetState();
}

class _MembersSheetState extends State<_MembersSheet> {
  late final _selected = {...widget.initial};

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 0, 8, 12),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text('Thành viên của thẻ', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Flexible(
              child: ListView(shrinkWrap: true, children: [
                for (final m in widget.members)
                  CheckboxListTile(
                    value: _selected.contains(m.id),
                    onChanged: (v) => setState(() => v == true ? _selected.add(m.id) : _selected.remove(m.id)),
                    secondary: Avatar(name: m.name, size: 36),
                    title: Text(m.name),
                    subtitle: Text(m.email),
                  ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: FilledButton(onPressed: () => Navigator.pop(context, _selected), child: const Text('Xong')),
            ),
          ]),
        ),
      );
}

/// Bình luận + (tuỳ chọn) hoạt động, gộp theo thời gian, mới nhất trước — như CommentSection trên web.
class _Timeline extends ConsumerWidget {
  const _Timeline({required this.taskId, required this.showActivity});

  final int taskId;
  final bool showActivity;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final comments = ref.watch(commentsProvider(taskId));
    final activities = showActivity ? ref.watch(taskActivitiesProvider(taskId)).valueOrNull?.items : null;
    final me = ref.watch(authProvider).valueOrNull;

    if (comments.isLoading && !comments.hasValue) {
      return const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator()));
    }
    if (comments.hasError) {
      return Text(ApiException.from(comments.error!).message, style: TextStyle(color: theme.colorScheme.error));
    }

    final items = <({DateTime at, Widget child})>[
      for (final c in comments.valueOrNull ?? const <Comment>[])
        (at: c.createdAt, child: _CommentItem(comment: c, canDelete: me != null && (me.id == c.user.id || me.isAdmin))),
      for (final a in activities ?? const <Activity>[])
        if (a.type != 'comment_added') (at: a.createdAt, child: _ActivityItem(activity: a)),
    ]..sort((x, y) => y.at.compareTo(x.at));

    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text('Chưa có bình luận nào.', style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
      );
    }
    return Column(children: [for (final i in items) i.child]);
  }
}

class _CommentItem extends ConsumerWidget {
  const _CommentItem({required this.comment, required this.canDelete});

  final Comment comment;
  final bool canDelete;

  /// Xoá phải qua menu ⋯ rồi xác nhận — tránh bấm nhầm khi cuộn.
  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá bình luận?'),
        content: const Text('Bình luận sẽ bị xoá vĩnh viễn. Không thể khôi phục.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Huỷ')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xoá'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(commentsProvider(comment.taskId).notifier).delete(comment.id);
      messenger.showSnackBar(const SnackBar(content: Text('Đã xoá bình luận')));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(ApiException.from(e).message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Avatar(name: comment.user.name, size: 32),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text.rich(TextSpan(children: [
                  TextSpan(text: comment.user.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  TextSpan(
                    text: '  ${timeAgo(comment.createdAt)}',
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 12),
                  ),
                ])),
              ),
              if (canDelete)
                SizedBox(
                  height: 28,
                  child: PopupMenuButton<String>(
                    tooltip: 'Thao tác bình luận',
                    padding: EdgeInsets.zero,
                    iconSize: 20,
                    icon: Icon(Icons.more_horiz, color: theme.colorScheme.onSurfaceVariant),
                    onSelected: (_) => _confirmDelete(context, ref),
                    itemBuilder: (_) => [
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(children: [
                          Icon(Icons.delete_outline, color: theme.colorScheme.error),
                          const SizedBox(width: 12),
                          Text('Xoá bình luận', style: TextStyle(color: theme.colorScheme.error)),
                        ]),
                      ),
                    ],
                  ),
                ),
            ]),
            const SizedBox(height: 4),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: Text(comment.content),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  const _ActivityItem({required this.activity});

  final Activity activity;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Avatar(name: activity.user.name, size: 32),
        const SizedBox(width: 10),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text.rich(TextSpan(style: theme.textTheme.bodyMedium, children: [
              TextSpan(text: '${activity.user.name} ', style: const TextStyle(fontWeight: FontWeight.w600)),
              ...describeActivity(activity, showCard: false),
            ])),
            Text(timeAgo(activity.createdAt),
                style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 12)),
          ]),
        ),
      ]),
    );
  }
}

/// Ô viết bình luận cố định ở đáy màn hình.
class _CommentComposer extends ConsumerStatefulWidget {
  const _CommentComposer({required this.taskId, required this.onError});

  final int taskId;
  final void Function(Object) onError;

  @override
  ConsumerState<_CommentComposer> createState() => _CommentComposerState();
}

class _CommentComposerState extends ConsumerState<_CommentComposer> {
  var _controller = TextEditingController();
  int _gen = 0;
  bool _sending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      await ref.read(commentsProvider(widget.taskId).notifier).add(text);
      // Dựng ô nhập mới để bàn phím không gửi lại chữ cũ (xem BoardColumn)
      final old = _controller;
      setState(() {
        _controller = TextEditingController();
        _gen++;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) => old.dispose());
    } catch (e) {
      widget.onError(e);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(authProvider).valueOrNull;
    return Material(
      elevation: 6,
      color: Theme.of(context).colorScheme.surface,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
          child: Row(children: [
            Avatar(name: me?.name ?? '?', size: 32),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                key: ValueKey(_gen),
                controller: _controller,
                minLines: 1,
                maxLines: 4,
                textCapitalization: TextCapitalization.sentences,
                decoration: const InputDecoration(hintText: 'Viết bình luận…', isDense: true),
                onChanged: (_) => setState(() {}),
              ),
            ),
            IconButton(
              tooltip: 'Gửi bình luận',
              onPressed: _controller.text.trim().isEmpty || _sending ? null : _send,
              icon: _sending
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.send),
            ),
          ]),
        ),
      ),
    );
  }
}
