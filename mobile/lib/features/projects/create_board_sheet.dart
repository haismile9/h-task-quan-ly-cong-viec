import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/backgrounds.dart';
import 'background_picker.dart';
import 'projects_repository.dart';

Future<void> showCreateBoardSheet(BuildContext context) => showModalBottomSheet<void>(
      context: context,
      // Mở trên navigator gốc để che cả thanh tab dưới (tab Bảng có navigator riêng)
      useRootNavigator: true,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (_) => const _CreateBoardSheet(),
    );

/// Tạo bảng: xem trước nền, tên, mô tả, chọn phông nền.
class _CreateBoardSheet extends ConsumerStatefulWidget {
  const _CreateBoardSheet();

  @override
  ConsumerState<_CreateBoardSheet> createState() => _CreateBoardSheetState();
}

class _CreateBoardSheetState extends ConsumerState<_CreateBoardSheet> {
  final _name = TextEditingController();
  final _description = TextEditingController();
  String _background = 'gradient:blue';
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final project = await ref.read(projectsActionsProvider).create(
            name: _name.text.trim(),
            description: _description.text.trim(),
            background: _background,
          );
      if (!mounted) return;
      final router = GoRouter.of(context);
      Navigator.of(context).pop();
      router.push('/boards/${project.id}', extra: project);
    } catch (e) {
      setState(() => _error = ApiException.from(e).message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSubmit = _name.text.trim().isNotEmpty && !_saving;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.9,
      maxChildSize: 0.95,
      builder: (_, scroll) => ListView(
        controller: scroll,
        padding: EdgeInsets.fromLTRB(20, 0, 20, 24 + MediaQuery.of(context).viewInsets.bottom),
        children: [
          Text('Tạo bảng', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 16),
          // Xem trước: nền + 3 cột giả lập
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              height: 110,
              child: BoardBackground(
                value: _background,
                thumb: true,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      for (final cards in [3, 2, 4])
                        Container(
                          width: 56,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Column(children: [
                            for (var i = 0; i < cards; i++)
                              Container(
                                height: 6,
                                margin: const EdgeInsets.symmetric(vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCDFE4),
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                          ]),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _name,
            autofocus: true,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(labelText: 'Tên bảng *'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _description,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Mô tả (không bắt buộc)'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 16),
          FilledButton(
            onPressed: canSubmit ? _submit : null,
            child: _saving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Tạo bảng'),
          ),
          const SizedBox(height: 8),
          BackgroundPicker(value: _background, onChanged: (v) => setState(() => _background = v)),
        ],
      ),
    );
  }
}
