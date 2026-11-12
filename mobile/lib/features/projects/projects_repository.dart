import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api_client.dart';
import '../../models/project.dart';
import '../../models/user.dart';
import '../board/board_repository.dart';

/// Danh sách bảng (dự án) của người dùng, mới cập nhật lên đầu.
final projectsProvider = FutureProvider.autoDispose<List<Project>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final data = await api.get<List<dynamic>>('/projects');
  final projects = data.whereType<Map<String, dynamic>>().map(Project.fromJson).toList();
  projects.sort((a, b) => (b.updatedAt ?? DateTime(0)).compareTo(a.updatedAt ?? DateTime(0)));
  return projects;
});

/// Chủ dự án hoặc admin: được sửa mô tả, đổi nền, đổi tên, xoá bảng (như isManager ở web).
bool canManageProject(User? user, Project project) =>
    user != null && (user.isAdmin || user.id == project.ownerId);

/// Tạo / sửa / xoá dự án; làm mới danh sách và chi tiết sau mỗi thay đổi.
class ProjectsActions {
  ProjectsActions(this._ref);

  final Ref _ref;
  ApiClient get _api => _ref.read(apiClientProvider);

  Future<Project> create({required String name, String? description, required String background}) async {
    final json = await _api.post<Map<String, dynamic>>('/projects', {
      'name': name,
      if (description != null && description.isNotEmpty) 'description': description,
      'background_url': background,
    });
    _ref.invalidate(projectsProvider);
    return Project.fromJson(json);
  }

  /// Sửa từng trường (backend chấp nhận cập nhật một phần): name, description, background_url.
  Future<void> update(int id, Map<String, dynamic> input) async {
    try {
      await _api.put('/projects/$id', input);
    } finally {
      _ref.invalidate(projectDetailProvider(id));
      _ref.invalidate(projectsProvider);
    }
  }

  Future<void> delete(int id) async {
    await _api.delete('/projects/$id');
    _ref.invalidate(projectsProvider);
    await _ref.read(starredProvider.notifier).remove(id);
  }
}

final projectsActionsProvider = Provider(ProjectsActions.new);

/// Bảng đã gắn sao — lưu trên máy (bản web cũng lưu ở localStorage).
class StarredController extends AsyncNotifier<Set<int>> {
  static const _key = 'starred_projects';

  @override
  Future<Set<int>> build() async {
    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_key) ?? []).map(int.tryParse).whereType<int>().toSet();
  }

  Future<void> toggle(int id) async {
    final current = {...?state.valueOrNull};
    current.contains(id) ? current.remove(id) : current.add(id);
    await _save(current);
  }

  Future<void> remove(int id) async {
    final current = {...?state.valueOrNull}..remove(id);
    await _save(current);
  }

  Future<void> _save(Set<int> ids) async {
    state = AsyncData(ids);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_key, ids.map((e) => '$e').toList());
  }
}

final starredProvider = AsyncNotifierProvider<StarredController, Set<int>>(StarredController.new);
