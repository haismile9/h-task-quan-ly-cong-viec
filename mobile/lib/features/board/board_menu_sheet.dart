import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/backgrounds.dart';
import '../../models/project.dart';
import '../../widgets/avatar.dart';
import '../auth/auth_controller.dart';
import '../projects/background_picker.dart';
import '../projects/projects_repository.dart';

Future<void> showBoardMenu(BuildContext context, Project project) => showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) => _BoardMenuSheet(project: project),
    );

enum _View { menu, about, background }

/// Menu của bảng (như popup Menu trên web): một sheet chuyển qua lại giữa
/// Menu → Về bảng này / Thay đổi hình nền, có nút quay lại.
class _BoardMenuSheet extends ConsumerStatefulWidget {
  const _BoardMenuSheet({required this.project});

  final Project project;

  @override
  ConsumerState<_BoardMenuSheet> createState() => _BoardMenuSheetState();
}

class _BoardMenuSheetState extends ConsumerState<_BoardMenuSheet> {
  _View _view = _View.menu;
  late String _background = widget.project.backgroundUrl ?? 'gradient:blue';
  late final _description = TextEditingController(text: widget.project.description ?? '');
  bool _editingDesc = false;
  bool _saving = false;

  Project get p => widget.project;

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> _update(Map<String, dynamic> input) async {
    setState(() => _saving = true);
    try {
      await ref.read(projectsActionsProvider).update(p.id, input);
    } catch (e) {
      _toast(ApiException.from(e).message);
      rethrow;
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _rename() async {
    final controller = TextEditingController(text: p.name);
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đổi tên bảng'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Tên bảng'),
          onSubmitted: (v) => Navigator.pop(ctx, v),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Huỷ')),
          FilledButton(onPressed: () => Navigator.pop(ctx, controller.text), child: const Text('Lưu')),
        ],
      ),
    );
    final text = name?.trim() ?? '';
    if (text.isEmpty || text == p.name) return;
    await _update({'name': text}).catchError((_) {});
    if (mounted) Navigator.pop(context);
  }

  Future<void> _delete() async {
    final router = GoRouter.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xoá bảng?'),
        content: Text('Xoá bảng "${p.name}" cùng toàn bộ danh sách và thẻ bên trong. Không thể khôi phục.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Huỷ')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Xoá bảng'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(projectsActionsProvider).delete(p.id);
      if (!mounted) return;
      _toast('Đã xoá bảng "${p.name}"');
      Navigator.pop(context);
      router.go('/boards');
    } catch (e) {
      _toast(ApiException.from(e).message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).valueOrNull;
    final canManage = canManageProject(user, p);
    final starred = ref.watch(starredProvider).valueOrNull?.contains(p.id) ?? false;

    final (title, body) = switch (_view) {
      _View.menu => ('Menu', _menu(canManage, starred)),
      _View.about => ('Về bảng này', _about(canManage)),
      _View.background => ('Phông nền bảng', _backgroundView()),
    };

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: _view == _View.background ? 0.9 : 0.6,
      maxChildSize: 0.95,
      builder: (_, scroll) => Column(
        children: [
          SizedBox(
            height: 40,
            child: Row(
              children: [
                SizedBox(
                  width: 56,
                  child: _view == _View.menu
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.arrow_back),
                          tooltip: 'Quay lại',
                          onPressed: () => setState(() {
                            _view = _View.menu;
                            _editingDesc = false;
                          }),
                        ),
                ),
                Expanded(
                  child: Text(title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
                ),
                SizedBox(width: 56, child: _saving ? const Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))) : null),
              ],
            ),
          ),
          const Divider(height: 16),
          Expanded(
            child: ListView(
              controller: scroll,
              padding: EdgeInsets.fromLTRB(16, 0, 16, 24 + MediaQuery.of(context).viewInsets.bottom),
              children: body,
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _menu(bool canManage, bool starred) => [
        ListTile(
          leading: const Icon(Icons.info_outline),
          title: const Text('Về bảng này'),
          subtitle: Text(
            (p.description?.isNotEmpty ?? false) ? p.description! : (canManage ? 'Thêm mô tả vào bảng của bạn' : 'Chưa có mô tả'),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          onTap: () => setState(() => _view = _View.about),
        ),
        ListTile(
          leading: Icon(starred ? Icons.star : Icons.star_border, color: starred ? Colors.amber : null),
          title: Text(starred ? 'Bỏ gắn sao' : 'Gắn sao'),
          onTap: () => ref.read(starredProvider.notifier).toggle(p.id),
        ),
        if (canManage) ...[
          const Divider(),
          ListTile(
            leading: const Icon(Icons.edit_outlined),
            title: const Text('Đổi tên bảng'),
            onTap: _rename,
          ),
          ListTile(
            leading: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: SizedBox(width: 28, height: 20, child: BoardBackground(value: _background, thumb: true)),
            ),
            title: const Text('Thay đổi hình nền'),
            onTap: () => setState(() => _view = _View.background),
          ),
          ListTile(
            leading: Icon(Icons.delete_outline, color: Theme.of(context).colorScheme.error),
            title: Text('Xoá bảng', style: TextStyle(color: Theme.of(context).colorScheme.error)),
            onTap: _delete,
          ),
        ],
      ];

  List<Widget> _about(bool canManage) {
    final theme = Theme.of(context);
    final owner = p.owner;
    return [
      Row(children: [
        const Icon(Icons.person_outline, size: 20),
        const SizedBox(width: 8),
        Text('Quản trị viên của bảng', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
      ]),
      const SizedBox(height: 12),
      if (owner != null)
        Row(children: [
          Avatar(name: owner.name, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(owner.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
              Text(owner.email, style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
            ]),
          ),
        ]),
      const SizedBox(height: 24),
      Row(children: [
        const Icon(Icons.notes, size: 20),
        const SizedBox(width: 8),
        Text('Mô tả', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
      ]),
      const SizedBox(height: 12),
      if (_editingDesc) ...[
        TextField(
          controller: _description,
          autofocus: true,
          minLines: 4,
          maxLines: 8,
          decoration: const InputDecoration(hintText: 'Bảng này được dùng để làm gì?'),
        ),
        const SizedBox(height: 8),
        Row(children: [
          FilledButton(
            onPressed: _saving
                ? null
                : () async {
                    try {
                      await _update({'description': _description.text.trim()});
                      if (mounted) Navigator.pop(context);
                    } catch (_) {}
                  },
            style: FilledButton.styleFrom(minimumSize: const Size(88, 40)),
            child: const Text('Lưu'),
          ),
          const SizedBox(width: 8),
          TextButton(
            onPressed: () => setState(() {
              _description.text = p.description ?? '';
              _editingDesc = false;
            }),
            child: const Text('Huỷ'),
          ),
        ]),
      ] else
        Material(
          color: theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
          child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: canManage ? () => setState(() => _editingDesc = true) : null,
            child: Container(
              constraints: const BoxConstraints(minHeight: 96),
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              child: Text(
                (p.description?.isNotEmpty ?? false)
                    ? p.description!
                    : canManage
                        ? 'Thêm mô tả để cho đồng đội của bạn biết bảng này được sử dụng để làm gì.'
                        : 'Chưa có mô tả.',
                style: TextStyle(
                  color: (p.description?.isNotEmpty ?? false) ? null : theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
        ),
    ];
  }

  List<Widget> _backgroundView() => [
        BackgroundPicker(
          value: _background,
          onChanged: (v) async {
            final previous = _background;
            setState(() => _background = v); // áp dụng ngay như Trello
            try {
              await _update({'background_url': v});
            } catch (_) {
              if (mounted) setState(() => _background = previous);
            }
          },
        ),
      ];
}
