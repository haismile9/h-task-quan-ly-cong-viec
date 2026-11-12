import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/project.dart';
import '../../models/user.dart';
import '../../widgets/avatar.dart';
import '../auth/auth_controller.dart';
import '../auth/auth_widgets.dart';
import '../projects/projects_repository.dart';
import 'board_repository.dart';

Future<void> showShareSheet(BuildContext context, int projectId) => showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) => _ShareSheet(projectId: projectId),
    );

/// Chia sẻ bảng: mời bằng email (kể cả người chưa có tài khoản), xem / gỡ thành viên, huỷ lời mời.
class _ShareSheet extends ConsumerStatefulWidget {
  const _ShareSheet({required this.projectId});

  final int projectId;

  @override
  ConsumerState<_ShareSheet> createState() => _ShareSheetState();
}

class _ShareSheetState extends ConsumerState<_ShareSheet> {
  final _email = TextEditingController();
  bool _sending = false;
  String? _error;

  /// Lời mời vừa tạo nhưng không gửi được mail → hiện link để người mời tự gửi.
  String? _manualLink;

  ApiClient get _api => ref.read(apiClientProvider);

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  void _refresh() {
    ref.invalidate(projectDetailProvider(widget.projectId));
    ref.invalidate(projectsProvider);
  }

  void _toast(String text) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));

  Future<void> _invite() async {
    final email = _email.text.trim();
    FocusScope.of(context).unfocus();
    setState(() {
      _sending = true;
      _error = null;
      _manualLink = null;
    });
    try {
      final res = await _api.post<Map<String, dynamic>>('/projects/${widget.projectId}/members', {'email': email});
      _email.clear();
      final message = (res['message'] as String?) ?? 'Đã mời $email';
      if (res['status'] == 'invited' && res['mail_sent'] == false) {
        setState(() => _manualLink = res['invite_url'] as String?);
      }
      _toast(message);
      _refresh();
    } catch (e) {
      final err = ApiException.from(e);
      setState(() => _error = err.fieldError('email') ?? err.message);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<bool> _confirm(String title, String message, String action) async =>
      await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Huỷ')),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: Theme.of(ctx).colorScheme.error),
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(action),
            ),
          ],
        ),
      ) ==
      true;

  Future<void> _removeMember(User u) async {
    if (!await _confirm('Gỡ thành viên?', 'Gỡ ${u.name} khỏi bảng (và khỏi mọi thẻ của bảng)?', 'Gỡ')) return;
    try {
      await _api.delete('/projects/${widget.projectId}/members/${u.id}');
      _toast('Đã gỡ ${u.name}');
      _refresh();
      ref.invalidate(boardProvider(widget.projectId));
    } catch (e) {
      _toast(ApiException.from(e).message);
    }
  }

  Future<void> _cancelInvitation(PendingInvitation inv) async {
    if (!await _confirm('Huỷ lời mời?', 'Huỷ lời mời gửi tới ${inv.email}?', 'Huỷ lời mời')) return;
    try {
      await _api.delete('/projects/${widget.projectId}/invitations/${inv.id}');
      _toast('Đã huỷ lời mời');
      _refresh();
    } catch (e) {
      _toast(ApiException.from(e).message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final project = ref.watch(projectDetailProvider(widget.projectId));
    final me = ref.watch(authProvider).valueOrNull;

    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.75,
      maxChildSize: 0.95,
      builder: (_, scroll) => ListView(
        controller: scroll,
        padding: EdgeInsets.fromLTRB(16, 0, 16, 24 + MediaQuery.of(context).viewInsets.bottom),
        children: [
          Text('Chia sẻ bảng', textAlign: TextAlign.center, style: theme.textTheme.titleMedium),
          const SizedBox(height: 16),
          ...project.when(
            loading: () => [const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))],
            error: (e, _) => [Text(ApiException.from(e).message)],
            data: (p) {
              final canManage = canManageProject(me, p);
              return [
                if (canManage) ...[
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(
                      child: TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          hintText: 'Email người được mời',
                          prefixIcon: const Icon(Icons.mail_outline),
                          errorText: _error,
                          isDense: true,
                        ),
                        onChanged: (_) => setState(() {}),
                        onSubmitted: (_) => isValidEmail(_email.text) ? _invite() : null,
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      style: FilledButton.styleFrom(minimumSize: const Size(72, 48)),
                      onPressed: _sending || !isValidEmail(_email.text) ? null : _invite,
                      child: _sending
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Mời'),
                    ),
                  ]),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(4, 6, 4, 0),
                    child: Text('Người chưa có tài khoản sẽ nhận email mời đăng ký và vào thẳng bảng.',
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                  ),
                  if (_manualLink != null)
                    Card(
                      margin: const EdgeInsets.only(top: 12),
                      color: theme.colorScheme.errorContainer,
                      child: ListTile(
                        title: const Text('Chưa gửi được email mời'),
                        subtitle: Text('Gửi link này cho người được mời:\n$_manualLink'),
                        isThreeLine: true,
                        trailing: IconButton(
                          tooltip: 'Sao chép link',
                          icon: const Icon(Icons.copy),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: _manualLink!));
                            _toast('Đã sao chép link mời');
                          },
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),
                ],
                _heading(theme, 'Thành viên của bảng (${p.allMembers.length})'),
                for (final u in p.allMembers)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Avatar(name: u.name, size: 40),
                    title: Text(u.id == me?.id ? '${u.name} (bạn)' : u.name),
                    subtitle: Text(u.email),
                    trailing: u.id == p.ownerId
                        ? const Chip(label: Text('Quản trị viên'), visualDensity: VisualDensity.compact)
                        : canManage
                            ? IconButton(
                                tooltip: 'Gỡ khỏi bảng',
                                icon: Icon(Icons.person_remove_outlined, color: theme.colorScheme.error),
                                onPressed: () => _removeMember(u),
                              )
                            : null,
                  ),
                if (p.pendingInvitations.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _heading(theme, 'Đang chờ đăng ký (${p.pendingInvitations.length})'),
                  for (final inv in p.pendingInvitations)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        radius: 20,
                        backgroundColor: theme.colorScheme.surfaceContainerHighest,
                        child: Text(inv.email.characters.first.toUpperCase()),
                      ),
                      title: Text(inv.email),
                      subtitle: const Text('Đã gửi lời mời'),
                      trailing: canManage
                          ? IconButton(
                              tooltip: 'Huỷ lời mời',
                              icon: const Icon(Icons.close),
                              onPressed: () => _cancelInvitation(inv),
                            )
                          : null,
                    ),
                ],
                if (!canManage)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text('Chỉ quản trị viên của bảng mới mời hoặc gỡ được thành viên.',
                        style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                  ),
              ];
            },
          ),
        ],
      ),
    );
  }

  Widget _heading(ThemeData theme, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(text, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
      );
}
