import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_client.dart';
import '../../models/activity.dart';
import '../../widgets/avatar.dart';
import 'activity_text.dart';

/// Hoạt động liên quan tới tôi (GET /activities/me), tải thêm bằng ?before=<id cuối>.
class ActivityFeedController extends AutoDisposeAsyncNotifier<ActivityPage> {
  ApiClient get _api => ref.read(apiClientProvider);
  bool _loadingMore = false;

  @override
  Future<ActivityPage> build() async =>
      ActivityPage.fromJson(await _api.get<Map<String, dynamic>>('/activities/me'));

  Future<void> reload() async => state = await AsyncValue.guard(build);

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || !current.hasMore || current.items.isEmpty || _loadingMore) return;
    _loadingMore = true;
    try {
      final next = ActivityPage.fromJson(
        await _api.get<Map<String, dynamic>>('/activities/me', query: {'before': current.items.last.id}),
      );
      state = AsyncData(ActivityPage([...current.items, ...next.items], next.hasMore));
    } finally {
      _loadingMore = false;
    }
  }
}

final activityFeedProvider =
    AsyncNotifierProvider.autoDispose<ActivityFeedController, ActivityPage>(ActivityFeedController.new);

class ActivityScreen extends ConsumerWidget {
  const ActivityScreen({super.key});

  void _open(BuildContext context, Activity a) {
    final projectId = a.projectId;
    if (projectId == null) return;
    // Thẻ đã xoá thì chỉ mở bảng
    if (a.taskId != null && a.type != 'card_deleted') {
      context.push('/boards/$projectId/cards/${a.taskId}');
    } else {
      context.push('/boards/$projectId');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final feed = ref.watch(activityFeedProvider);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () => ref.read(activityFeedProvider.notifier).reload(),
          child: NotificationListener<ScrollNotification>(
            // Gần cuối danh sách thì tải thêm
            onNotification: (n) {
              if (n.metrics.extentAfter < 300) ref.read(activityFeedProvider.notifier).loadMore();
              return false;
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  sliver: SliverToBoxAdapter(
                    child: Text('Hoạt động',
                        style: theme.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800)),
                  ),
                ),
                ...feed.when(
                  skipLoadingOnReload: true,
                  loading: () => [const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))],
                  error: (e, _) => [
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Text(ApiException.from(e).message),
                          TextButton(
                            onPressed: () => ref.invalidate(activityFeedProvider),
                            child: const Text('Thử lại'),
                          ),
                        ]),
                      ),
                    ),
                  ],
                  data: (page) => [
                    if (page.items.isEmpty)
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Text('Chưa có hoạt động nào.',
                              style: TextStyle(color: theme.colorScheme.onSurfaceVariant)),
                        ),
                      )
                    else
                      SliverList.builder(
                        itemCount: page.items.length + (page.hasMore ? 1 : 0),
                        itemBuilder: (_, i) {
                          if (i == page.items.length) {
                            return const Padding(
                              padding: EdgeInsets.all(16),
                              child: Center(child: CircularProgressIndicator()),
                            );
                          }
                          final a = page.items[i];
                          return InkWell(
                            onTap: () => _open(context, a),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Avatar(name: a.user.name, size: 36),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text.rich(TextSpan(style: theme.textTheme.bodyMedium, children: [
                                      TextSpan(text: '${a.user.name} ', style: const TextStyle(fontWeight: FontWeight.w600)),
                                      ...describeActivity(a, showCard: true),
                                    ])),
                                    if (a.type == 'comment_added' && a.str('excerpt').isNotEmpty)
                                      Container(
                                        margin: const EdgeInsets.only(top: 6),
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: theme.colorScheme.surface,
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: theme.colorScheme.outlineVariant),
                                        ),
                                        child: Text(a.str('excerpt'), maxLines: 3, overflow: TextOverflow.ellipsis),
                                      ),
                                    const SizedBox(height: 2),
                                    Text(
                                      [timeAgo(a.createdAt), if (a.projectName != null) 'trên bảng ${a.projectName}']
                                          .join(' · '),
                                      style: TextStyle(color: theme.colorScheme.onSurfaceVariant, fontSize: 12),
                                    ),
                                  ]),
                                ),
                              ]),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
