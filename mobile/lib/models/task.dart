import 'json.dart';
import 'user.dart';

/// Danh sách (cột) trên bảng.
class TaskList {
  const TaskList({required this.id, required this.projectId, required this.name, required this.position});

  final int id;
  final int projectId;
  final String name;
  final int position;

  TaskList copyWith({String? name, int? position}) =>
      TaskList(id: id, projectId: projectId, name: name ?? this.name, position: position ?? this.position);

  factory TaskList.fromJson(Map<String, dynamic> json) => TaskList(
        id: asInt(json['id']),
        projectId: asInt(json['project_id']),
        name: (json['name'] ?? '') as String,
        position: asInt(json['position']),
      );
}

/// pending | in_progress (dữ liệu cũ) đều là "chưa xong"; chỉ done là "đã xong" — như bản web.
enum TaskPriority { low, medium, high }

class Task {
  const Task({
    required this.id,
    required this.projectId,
    required this.listId,
    required this.position,
    required this.title,
    this.description,
    this.status = 'pending',
    this.priority = TaskPriority.medium,
    this.deadline,
    this.assignees = const [],
  });

  final int id;
  final int projectId;
  final int listId;

  /// Vị trí trong danh sách (0 = trên cùng).
  final int position;
  final String title;
  final String? description;
  final String status;
  final TaskPriority priority;

  /// Ngày hạn chót (chỉ dùng phần ngày).
  final DateTime? deadline;
  final List<User> assignees;

  bool get isDone => status == 'done';
  bool get hasDescription => description?.trim().isNotEmpty ?? false;

  Task copyWith({
    int? id,
    int? listId,
    int? position,
    String? title,
    String? status,
    TaskPriority? priority,
    String? Function()? description,
    DateTime? Function()? deadline,
    List<User>? assignees,
  }) =>
      Task(
        id: id ?? this.id,
        projectId: projectId,
        listId: listId ?? this.listId,
        position: position ?? this.position,
        title: title ?? this.title,
        description: description != null ? description() : this.description,
        status: status ?? this.status,
        priority: priority ?? this.priority,
        deadline: deadline != null ? deadline() : this.deadline,
        assignees: assignees ?? this.assignees,
      );

  factory Task.fromJson(Map<String, dynamic> json) => Task(
        id: asInt(json['id']),
        projectId: asInt(json['project_id']),
        listId: asInt(json['list_id']),
        position: asInt(json['position']),
        title: (json['title'] ?? '') as String,
        description: json['description'] as String?,
        status: (json['status'] ?? 'pending') as String,
        priority: TaskPriority.values.asNameMap()[json['priority']] ?? TaskPriority.medium,
        deadline: parseDeadline(json['deadline']),
        assignees: (json['assigned_users'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(User.fromJson)
            .toList(),
      );

  /// "2026-11-20" hoặc "2026-11-20T00:00:00.000000Z" → ngày theo giờ máy (bỏ giờ).
  static DateTime? parseDeadline(Object? value) {
    if (value is! String || value.length < 10) return null;
    return DateTime.tryParse(value.substring(0, 10));
  }
}

/// Dữ liệu một bảng: các cột (đã sắp theo position) và các thẻ.
class BoardData {
  BoardData({required List<TaskList> lists, required this.tasks})
      : lists = [...lists]..sort((a, b) => a.position.compareTo(b.position));

  final List<TaskList> lists;
  final List<Task> tasks;

  BoardData copyWith({List<TaskList>? lists, List<Task>? tasks}) =>
      BoardData(lists: lists ?? this.lists, tasks: tasks ?? this.tasks);

  /// Thẻ của một cột, đúng thứ tự đã lưu.
  List<Task> tasksOf(int listId) =>
      tasks.where((t) => t.listId == listId).toList()..sort((a, b) => a.position.compareTo(b.position));

  factory BoardData.fromJson(Map<String, dynamic> json) => BoardData(
        lists: (json['lists'] as List? ?? []).whereType<Map<String, dynamic>>().map(TaskList.fromJson).toList(),
        tasks: (json['tasks'] as List? ?? []).whereType<Map<String, dynamic>>().map(Task.fromJson).toList(),
      );
}
