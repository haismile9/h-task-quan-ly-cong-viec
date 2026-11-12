import 'json.dart';
import 'user.dart';

/// Bình luận trên thẻ (GET /tasks/{id}/comments, mới nhất trước).
class Comment {
  const Comment({
    required this.id,
    required this.taskId,
    required this.content,
    required this.createdAt,
    required this.user,
  });

  final int id;
  final int taskId;
  final String content;
  final DateTime createdAt;
  final User user;

  factory Comment.fromJson(Map<String, dynamic> json) => Comment(
        id: asInt(json['id']),
        taskId: asInt(json['task_id']),
        content: (json['content'] ?? '') as String,
        createdAt: DateTime.tryParse('${json['created_at']}')?.toLocal() ?? DateTime.now(),
        user: User.fromJson((json['user'] as Map<String, dynamic>?) ?? const {'id': 0, 'name': '?'}),
      );
}

/// Một dòng nhật ký hoạt động (khớp type Activity ở frontend/src/types/index.ts).
class Activity {
  const Activity({
    required this.id,
    required this.type,
    required this.createdAt,
    required this.user,
    this.taskId,
    this.projectId,
    this.projectName,
    this.data = const {},
  });

  final int id;

  /// card_created, card_moved, comment_added, … (17 loại).
  final String type;
  final DateTime createdAt;
  final User user;
  final int? taskId;
  final int? projectId;
  final String? projectName;

  /// Tên thẻ, danh sách, người liên quan… lưu sẵn lúc ghi.
  final Map<String, dynamic> data;

  String str(String key) => data[key] == null ? '' : '${data[key]}';

  factory Activity.fromJson(Map<String, dynamic> json) {
    final project = json['project'];
    return Activity(
      id: asInt(json['id']),
      type: (json['type'] ?? '') as String,
      createdAt: DateTime.tryParse('${json['created_at']}')?.toLocal() ?? DateTime.now(),
      user: User.fromJson((json['user'] as Map<String, dynamic>?) ?? const {'id': 0, 'name': '?'}),
      taskId: asIntOrNull(json['task_id']),
      projectId: asIntOrNull(json['project_id']),
      projectName: project is Map ? project['name'] as String? : null,
      data: json['data'] is Map ? Map<String, dynamic>.from(json['data'] as Map) : const {},
    );
  }
}

class ActivityPage {
  const ActivityPage(this.items, this.hasMore);

  final List<Activity> items;
  final bool hasMore;

  factory ActivityPage.fromJson(Map<String, dynamic> json) => ActivityPage(
        (json['data'] as List? ?? []).whereType<Map<String, dynamic>>().map(Activity.fromJson).toList(),
        json['has_more'] == true,
      );
}
