import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../core/backgrounds.dart';
import '../../models/project.dart';
import 'projects_repository.dart';

/// Tab "Bảng": tiêu đề lớn, ô tìm kiếm, danh sách bảng có ảnh nền thu nhỏ.
class ProjectsScreen extends ConsumerStatefulWidget {
  const ProjectsScreen({super.key});

  @override
  ConsumerState<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends ConsumerState<ProjectsScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final projects = ref.watch(projectsProvider);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(projectsProvider.future),
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      Expanded(
                        child: Text('Bảng', style: theme.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800)),
                      ),
                      IconButton.filled(
                        // Bước 3: tạo bảng mới
                        onPressed: () => ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(content: Text('Tạo bảng sẽ có ở bước tiếp theo'))),
                        icon: const Icon(Icons.add),
                        tooltip: 'Tạo bảng',
                        iconSize: 28,
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                sliver: SliverToBoxAdapter(
                  child: TextField(
                    decoration: const InputDecoration(hintText: 'Tìm bảng', prefixIcon: Icon(Icons.search)),
                    onChanged: (v) => setState(() => _query = v.trim().toLowerCase()),
                  ),
                ),
              ),
              ...projects.when(
                loading: () => [const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))],
                error: (e, _) => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _Message(
                      icon: Icons.cloud_off_outlined,
                      text: ApiException.from(e).message,
                      action: TextButton(onPressed: () => ref.invalidate(projectsProvider), child: const Text('Thử lại')),
                    ),
                  ),
                ],
                data: (list) {
                  final shown = _query.isEmpty ? list : list.where((p) => p.name.toLowerCase().contains(_query)).toList();
                  if (list.isEmpty) {
                    return [
                      const SliverFillRemaining(
                        hasScrollBody: false,
                        child: _Message(icon: Icons.dashboard_outlined, text: 'Bạn chưa có bảng nào.\nTạo bảng đầu tiên bằng nút +.'),
                      ),
                    ];
                  }
                  if (shown.isEmpty) {
                    return [
                      const SliverFillRemaining(
                        hasScrollBody: false,
                        child: _Message(icon: Icons.search_off, text: 'Không tìm thấy bảng phù hợp.'),
                      ),
                    ];
                  }
                  return [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                      sliver: SliverToBoxAdapter(
                        child: Text('BẢNG CỦA BẠN',
                            style: theme.textTheme.labelMedium?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant, letterSpacing: 0.8, fontWeight: FontWeight.w700)),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                      sliver: SliverList.separated(
                        itemCount: shown.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => _BoardTile(project: shown[i]),
                      ),
                    ),
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

class _BoardTile extends StatelessWidget {
  const _BoardTile({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surface,
      borderRadius: BorderRadius.circular(14),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/boards/${project.id}', extra: project),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(width: 56, height: 40, child: BoardBackground(value: project.backgroundUrl, thumb: true)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(project.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                    if (project.description?.isNotEmpty ?? false)
                      Text(project.description!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({required this.icon, required this.text, this.action});

  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final color = Theme.of(context).colorScheme.onSurfaceVariant;
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: color),
          const SizedBox(height: 12),
          Text(text, textAlign: TextAlign.center, style: TextStyle(color: color)),
          if (action != null) ...[const SizedBox(height: 8), action!],
        ],
      ),
    );
  }
}
