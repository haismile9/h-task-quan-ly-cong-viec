import 'json.dart';
import 'task.dart';

/// Một thẻ được giao cho tôi (GET /my-tasks).
class MyTask {
  const MyTask({
    required this.id,
    required this.title,
    required this.projectId,
    required this.projectName,
    this.listName,
    this.status = 'pending',
    this.priority = TaskPriority.medium,
    this.deadline,
  });

  final int id;
  final String title;
  final int projectId;
  final String projectName;
  final String? listName;
  final String status;
  final TaskPriority priority;
  final DateTime? deadline;

  bool get isDone => status == 'done';

  MyTask withStatus(String s) => MyTask(
        id: id,
        title: title,
        projectId: projectId,
        projectName: projectName,
        listName: listName,
        status: s,
        priority: priority,
        deadline: deadline,
      );

  factory MyTask.fromJson(Map<String, dynamic> json) => MyTask(
        id: asInt(json['id']),
        title: (json['title'] ?? '') as String,
        projectId: asInt(json['project_id']),
        projectName: (json['project_name'] ?? '') as String,
        listName: json['list_name'] as String?,
        status: (json['status'] ?? 'pending') as String,
        priority: TaskPriority.values.asNameMap()[json['priority']] ?? TaskPriority.medium,
        deadline: Task.parseDeadline(json['deadline']),
      );
}

/// Số liệu thẻ (của tôi, hoặc của một dự án).
class TaskSummary {
  const TaskSummary({this.total = 0, this.completed = 0, this.overdue = 0});

  final int total;
  final int completed;
  final int overdue;

  int get open => total - completed;
  double get progress => total == 0 ? 0 : completed / total;

  factory TaskSummary.fromJson(Object? json) {
    final m = json is Map ? json : const {};
    return TaskSummary(
      total: asInt(m['total']),
      completed: asInt(m['completed']),
      overdue: asInt(m['overdue']),
    );
  }
}

class DashboardProject {
  const DashboardProject({required this.id, required this.name, required this.summary});

  final int id;
  final String name;
  final TaskSummary summary;

  factory DashboardProject.fromJson(Map<String, dynamic> json) => DashboardProject(
        id: asInt(json['id']),
        name: (json['name'] ?? '') as String,
        summary: TaskSummary.fromJson(json['task_summary']),
      );
}

/// GET /dashboard: thẻ được giao cho tôi + tiến độ từng bảng.
class Dashboard {
  const Dashboard({required this.mine, required this.projects});

  final TaskSummary mine;
  final List<DashboardProject> projects;

  factory Dashboard.fromJson(Map<String, dynamic> json) => Dashboard(
        mine: TaskSummary.fromJson(json['task_summary']),
        projects: (json['projects'] as List? ?? [])
            .whereType<Map<String, dynamic>>()
            .map(DashboardProject.fromJson)
            .toList(),
      );
}
