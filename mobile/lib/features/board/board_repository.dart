import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/project.dart';
import '../../models/task.dart';
import 'task_meta.dart';

/// Dữ liệu một bảng (cột + thẻ). Các thao tác sửa/kéo thả sẽ thêm vào đây ở bước 3.
class BoardController extends AutoDisposeFamilyAsyncNotifier<BoardData, int> {
  ApiClient get _api => ref.read(apiClientProvider);

  @override
  Future<BoardData> build(int arg) async {
    final json = await _api.get<Map<String, dynamic>>('/projects/$arg/tasks');
    return BoardData.fromJson(json);
  }

  /// Kéo xuống để làm mới: giữ dữ liệu cũ trên màn hình trong lúc tải.
  Future<void> reload() async {
    final next = await AsyncValue.guard(() => build(arg));
    state = next;
  }
}

final boardProvider =
    AsyncNotifierProvider.autoDispose.family<BoardController, BoardData, int>(BoardController.new);

/// Chi tiết dự án (tên, nền, chủ dự án, thành viên) — dùng khi mở bảng.
final projectDetailProvider = FutureProvider.autoDispose.family<Project, int>((ref, id) async {
  final json = await ref.watch(apiClientProvider).get<Map<String, dynamic>>('/projects/$id');
  return Project.fromJson(json);
});

/// Bộ lọc đang áp dụng cho từng bảng.
final boardFilterProvider = StateProvider.autoDispose.family<BoardFilter, int>((_, __) => const BoardFilter());
