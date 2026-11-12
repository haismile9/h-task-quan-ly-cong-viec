import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../../models/task.dart';
import 'task_card.dart';

/// Vị trí thả đang được chỉ tới: cột [listId], trước thẻ hiển thị thứ [index]
/// (đếm trên các thẻ đang hiện, không kể thẻ đang kéo).
class DropHover {
  const DropHover(this.listId, this.index);

  final int listId;
  final int index;

  @override
  bool operator ==(Object other) => other is DropHover && other.listId == listId && other.index == index;

  @override
  int get hashCode => Object.hash(listId, index);
}

/// Các callback kéo thả do màn hình bảng điều phối (kéo qua nhiều cột).
class DragCallbacks {
  const DragCallbacks({
    required this.onStarted,
    required this.onUpdate,
    required this.onFinished,
    required this.onHover,
    required this.onDrop,
    required this.pointer,
  });

  final void Function(Task) onStarted;
  final void Function(Offset global) onUpdate;
  final VoidCallback onFinished;

  /// null = rời khỏi cột này.
  final void Function(int listId, int? index) onHover;
  final void Function(int listId, int index) onDrop;

  /// Vị trí ngón tay hiện tại (toạ độ màn hình).
  final Offset Function() pointer;
}

/// Một cột trên bảng: tiêu đề (chạm để đổi tên), menu ⋯, danh sách thẻ kéo thả được, ô thêm thẻ nhanh.
class BoardColumn extends StatefulWidget {
  const BoardColumn({
    super.key,
    required this.list,
    required this.tasks,
    required this.totalCount,
    required this.filtering,
    required this.canDelete,
    required this.cardWidth,
    required this.dragging,
    required this.hover,
    required this.drag,
    required this.onRefresh,
    required this.onTaskTap,
    required this.onToggleDone,
    required this.onAddTask,
    required this.onRename,
    required this.onDelete,
    required this.onReorderLists,
  });

  final TaskList list;

  /// Thẻ đang hiện (đã lọc), đúng thứ tự.
  final List<Task> tasks;
  final int totalCount;
  final bool filtering;
  final bool canDelete;
  final double cardWidth;
  final Task? dragging;
  final ValueListenable<DropHover?> hover;
  final DragCallbacks drag;
  final Future<void> Function() onRefresh;
  final void Function(Task) onTaskTap;
  final void Function(Task) onToggleDone;

  /// Trả về false nếu thêm lỗi (giữ lại chữ đã gõ).
  final Future<bool> Function(String title) onAddTask;
  final void Function(String name) onRename;
  final VoidCallback onDelete;
  final VoidCallback onReorderLists;

  @override
  State<BoardColumn> createState() => _BoardColumnState();
}

class _BoardColumnState extends State<BoardColumn> {
  final _scroll = ScrollController();
  final _listKey = GlobalKey();
  final _cardKeys = <int, GlobalKey>{};
  Timer? _autoScroll;
  int _scrollDir = 0;

  bool _composing = false;
  var _composer = TextEditingController();
  int _composerGen = 0;

  bool _renaming = false;
  late final _name = TextEditingController(text: widget.list.name);

  @override
  void didUpdateWidget(BoardColumn old) {
    super.didUpdateWidget(old);
    if (!_renaming && old.list.name != widget.list.name) _name.text = widget.list.name;
  }

  @override
  void dispose() {
    _autoScroll?.cancel();
    _scroll.dispose();
    _composer.dispose();
    _name.dispose();
    super.dispose();
  }

  GlobalKey _keyFor(int id) => _cardKeys.putIfAbsent(id, GlobalKey.new);

  /// Vị trí chèn theo toạ độ y của ngón tay: trước thẻ đầu tiên có tâm nằm dưới ngón tay.
  int _indexAt(double y) {
    final others = widget.tasks.where((t) => t.id != widget.dragging?.id).toList();
    for (var j = 0; j < others.length; j++) {
      final box = _cardKeys[others[j].id]?.currentContext?.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) continue;
      final center = box.localToGlobal(Offset.zero).dy + box.size.height / 2;
      if (y < center) return j;
    }
    return others.length;
  }

  /// Kéo tới gần mép trên/dưới của cột thì cột tự cuộn.
  void _updateAutoScroll(double y) {
    final box = _listKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize || !_scroll.hasClients) return;
    final top = box.localToGlobal(Offset.zero).dy;
    final bottom = top + box.size.height;
    final dir = y < top + 56 ? -1 : (y > bottom - 56 ? 1 : 0);
    if (dir == _scrollDir) return;
    _scrollDir = dir;
    _autoScroll?.cancel();
    if (dir == 0) return;
    _autoScroll = Timer.periodic(const Duration(milliseconds: 16), (_) {
      if (!_scroll.hasClients) return;
      final pos = _scroll.position;
      final next = (pos.pixels + dir * 9).clamp(pos.minScrollExtent, pos.maxScrollExtent);
      if (next != pos.pixels) _scroll.jumpTo(next);
      widget.drag.onHover(widget.list.id, _indexAt(widget.drag.pointer().dy));
    });
  }

  void _stopAutoScroll() {
    _autoScroll?.cancel();
    _autoScroll = null;
    _scrollDir = 0;
  }

  Future<void> _submitComposer() async {
    final text = _composer.text.trim();
    if (text.isEmpty) return;
    // Bàn phím (IME) còn giữ đoạn chữ đang gõ và gửi lại nếu chỉ clear() → dựng ô nhập mới
    // (controller + key mới) để bàn phím mở kết nối mới, sạch.
    final old = _composer;
    setState(() {
      _composer = TextEditingController();
      _composerGen++;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => old.dispose());
    // Cuộn xuống thẻ vừa thêm
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(_scroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      }
    });
    final ok = await widget.onAddTask(text);
    if (!ok && mounted && _composer.text.isEmpty) _composer.text = text;
  }

  void _saveName() {
    setState(() => _renaming = false);
    final text = _name.text.trim();
    if (text.isEmpty || text == widget.list.name) {
      _name.text = widget.list.name;
      return;
    }
    widget.onRename(text);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 0, 8),
      child: Align(
        alignment: Alignment.topCenter,
        child: DragTarget<Task>(
          onWillAcceptWithDetails: (_) => true,
          onMove: (_) {
            final y = widget.drag.pointer().dy;
            widget.drag.onHover(widget.list.id, _indexAt(y));
            _updateAutoScroll(y);
          },
          onLeave: (_) {
            _stopAutoScroll();
            widget.drag.onHover(widget.list.id, null);
          },
          onAcceptWithDetails: (_) {
            _stopAutoScroll();
            final h = widget.hover.value;
            final index = h != null && h.listId == widget.list.id ? h.index : _indexAt(widget.drag.pointer().dy);
            widget.drag.onDrop(widget.list.id, index);
          },
          builder: (context, candidates, _) => Container(
            decoration: BoxDecoration(
              color: dark ? const Color(0xFF101204) : const Color(0xFFF1F2F4),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _header(theme),
                Flexible(child: _cards(theme)),
                _footer(theme),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _header(ThemeData theme) {
    final count = widget.filtering && widget.tasks.length != widget.totalCount
        ? '${widget.tasks.length}/${widget.totalCount}'
        : '${widget.totalCount}';
    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 6, 0, 2),
      child: Row(
        children: [
          Expanded(
            child: _renaming
                ? TextField(
                    controller: _name,
                    autofocus: true,
                    style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700, fontSize: 15),
                    decoration: const InputDecoration(isDense: true, contentPadding: EdgeInsets.all(8)),
                    onSubmitted: (_) => _saveName(),
                    onTapOutside: (_) => _saveName(),
                  )
                : InkWell(
                    borderRadius: BorderRadius.circular(6),
                    onTap: () => setState(() => _renaming = true),
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Text(widget.list.name,
                          style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700, fontSize: 15)),
                    ),
                  ),
          ),
          Text(count, style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
          PopupMenuButton<String>(
            tooltip: 'Thao tác danh sách',
            icon: const Icon(Icons.more_horiz),
            onSelected: (v) => switch (v) {
              'add' => setState(() => _composing = true),
              'rename' => setState(() => _renaming = true),
              'reorder' => widget.onReorderLists(),
              'delete' => widget.onDelete(),
              _ => null,
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'add', child: Text('Thêm thẻ')),
              const PopupMenuItem(value: 'rename', child: Text('Đổi tên danh sách')),
              const PopupMenuItem(value: 'reorder', child: Text('Sắp xếp danh sách')),
              if (widget.canDelete)
                PopupMenuItem(
                  value: 'delete',
                  child: Text('Xoá danh sách', style: TextStyle(color: theme.colorScheme.error)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _cards(ThemeData theme) {
    final dragging = widget.dragging;
    return ValueListenableBuilder<DropHover?>(
      valueListenable: widget.hover,
      builder: (context, hover, _) {
        final hoverIndex = hover != null && hover.listId == widget.list.id ? hover.index : null;
        final placeholder = Container(
          height: 64,
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: theme.colorScheme.onSurface.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10),
          ),
        );

        // Cấu trúc danh sách giữ nguyên trong lúc kéo (ô trống chèn bên trong từng phần tử),
        // để thẻ đang kéo không bị gỡ khỏi cây widget.
        final items = <Widget>[];
        var j = 0;
        for (final t in widget.tasks) {
          final isDragged = dragging?.id == t.id;
          final showGap = !isDragged && hoverIndex == j;
          if (!isDragged) j++;
          items.add(Column(
            key: ValueKey(t.id),
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (showGap) placeholder,
              _draggableCard(t),
            ],
          ));
        }
        items.add(KeyedSubtree(
          key: const ValueKey('end'),
          child: hoverIndex == j ? placeholder : const SizedBox(height: 2),
        ));

        final empty = widget.tasks.isEmpty && dragging == null && !_composing;
        return RefreshIndicator(
          onRefresh: widget.onRefresh,
          child: ListView(
            key: _listKey,
            controller: _scroll,
            shrinkWrap: true,
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 0),
            children: [
              if (empty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(6, 2, 6, 8),
                  child: Text(
                    widget.filtering && widget.totalCount > 0 ? 'Không có thẻ khớp bộ lọc' : 'Chưa có thẻ',
                    style: TextStyle(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ),
              ...items,
            ],
          ),
        );
      },
    );
  }

  Widget _draggableCard(Task t) {
    final card = TaskCard(
      task: t,
      onTap: t.id > 0 ? () => widget.onTaskTap(t) : null,
      onToggleDone: t.id > 0 ? () => widget.onToggleDone(t) : null,
    );
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: LongPressDraggable<Task>(
        data: t,
        // Thẻ vừa thêm (id tạm) chưa kéo được cho tới khi server lưu xong
        maxSimultaneousDrags: t.id > 0 ? 1 : 0,
        feedback: Material(
          color: Colors.transparent,
          child: SizedBox(
            width: widget.cardWidth,
            child: Transform.rotate(
              angle: 0.04,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 12, offset: Offset(0, 6))],
                ),
                child: TaskCard(task: t),
              ),
            ),
          ),
        ),
        childWhenDragging: const SizedBox.shrink(),
        onDragStarted: () => widget.drag.onStarted(t),
        onDragUpdate: (d) => widget.drag.onUpdate(d.globalPosition),
        onDragEnd: (_) {
          _stopAutoScroll();
          widget.drag.onFinished();
        },
        child: KeyedSubtree(key: _keyFor(t.id), child: card),
      ),
    );
  }

  Widget _footer(ThemeData theme) {
    if (!_composing) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(4, 0, 4, 4),
        child: TextButton.icon(
          style: TextButton.styleFrom(
            alignment: Alignment.centerLeft,
            foregroundColor: theme.colorScheme.onSurfaceVariant,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
          onPressed: () => setState(() => _composing = true),
          icon: const Icon(Icons.add),
          label: const Text('Thêm thẻ'),
        ),
      );
    }
    final dark = theme.brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            key: ValueKey(_composerGen),
            controller: _composer,
            autofocus: true,
            minLines: 2,
            maxLines: 5,
            // Chữ dài vẫn tự xuống dòng, nhưng Enter / nút ✓ trên bàn phím = thêm thẻ (như bản web)
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.done,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: 'Nhập tiêu đề thẻ…',
              fillColor: dark ? const Color(0xFF22272B) : Colors.white,
            ),
            // Giữ bàn phím mở để gõ tiếp thẻ sau
            onEditingComplete: () {},
            onSubmitted: (_) => _submitComposer(),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              FilledButton(
                style: FilledButton.styleFrom(minimumSize: const Size(96, 40)),
                onPressed: _submitComposer,
                child: const Text('Thêm thẻ'),
              ),
              const SizedBox(width: 4),
              IconButton(
                tooltip: 'Huỷ',
                icon: const Icon(Icons.close),
                onPressed: () => setState(() {
                  _composing = false;
                  _composer.clear();
                }),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
