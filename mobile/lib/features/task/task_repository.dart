import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/activity.dart';

/// Bình luận của một thẻ (mới nhất trước) + thêm / xoá.
class CommentsController extends AutoDisposeFamilyAsyncNotifier<List<Comment>, int> {
  ApiClient get _api => ref.read(apiClientProvider);

  @override
  Future<List<Comment>> build(int arg) async {
    final data = await _api.get<List<dynamic>>('/tasks/$arg/comments');
    return data.whereType<Map<String, dynamic>>().map(Comment.fromJson).toList();
  }

  Future<void> add(String content) async {
    final json = await _api.post<Map<String, dynamic>>('/tasks/$arg/comments', {'content': content});
    state = AsyncData([Comment.fromJson(json), ...?state.valueOrNull]);
    ref.invalidate(taskActivitiesProvider(arg));
  }

  Future<void> delete(int id) async {
    final previous = state.valueOrNull;
    state = AsyncData([...?previous?.where((c) => c.id != id)]);
    try {
      await _api.delete('/comments/$id');
    } catch (e) {
      if (previous != null) state = AsyncData(previous);
      throw ApiException.from(e);
    }
  }
}

final commentsProvider =
    AsyncNotifierProvider.autoDispose.family<CommentsController, List<Comment>, int>(CommentsController.new);

/// Trang hoạt động mới nhất của một thẻ (như bản web: chỉ trang đầu).
final taskActivitiesProvider = FutureProvider.autoDispose.family<ActivityPage, int>((ref, taskId) async {
  final json = await ref.watch(apiClientProvider).get<Map<String, dynamic>>('/tasks/$taskId/activities');
  return ActivityPage.fromJson(json);
});
