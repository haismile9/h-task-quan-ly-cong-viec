import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../models/project.dart';

/// Danh sách bảng (dự án) của người dùng, mới cập nhật lên đầu.
final projectsProvider = FutureProvider.autoDispose<List<Project>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final data = await api.get<List<dynamic>>('/projects');
  final projects = data.whereType<Map<String, dynamic>>().map(Project.fromJson).toList();
  projects.sort((a, b) => (b.updatedAt ?? DateTime(0)).compareTo(a.updatedAt ?? DateTime(0)));
  return projects;
});
